# 62 — 一次統管所有 App：一個控制台、一份設定、68 個 App 跟

> **2026-11-26 用戶問**：「但有無咩方法係可以一次統管所有 APP？」
> **答案：有，但要分清楚你想「統管」邊樣。** 四樣嘢唔同做法、唔同代價，冇一個方案可以零成本做晒。本文逐層講清楚，最後畀你一個**唔使重寫 68 個 App** 嘅組合路線。
> **同 [docs/61](61-registration-gate-and-single-session.md) 分工**：61 講「登記／單一 session／刪人」嘅機制；62 講「**邊個掣控制晒 68 個 App**」（控制面）。62 唔新增 PLAYBOOK 規則 ID（局部編號 CP1–CP8）。
> **狀態：設計，未實作**。只有一項係即時做得：**Vercel 專案層／團隊層的 Deployment Protection**（見 §2-L1）。

---

## 0. 先分清「統管」係邊種（一張表睇完）

| 你想統管 | 現實係咪做得到「一個掣」 | 靠乜 | 代價 |
|---|:--:|---|---|
| **① 開關**：一撳就全部 App 停／開 | ✅ 做得到 | APP STORE 一份 `apps` 表 ＋ 遠端閘門設定（§4）／或 Vercel Team 層 Deployment Protection | 需要改一次 68 個 App 掛一個 `<script>`（**一次性**，之後唔再逐個改） |
| **② 政策**：全部 App 由「公開」轉「要登記先入得」 | ✅ 做得到 | 同上：`apps.access_mode` 一個欄位 | 純靜態 App 只做到軟閘（同 [docs/61](61-registration-gate-and-single-session.md) §11） |
| **③ 身份**：一個戶口通行所有 App | ⚠️ 做得到，但唔完美 | 中心簽票（61）／或加自訂網域令 cookie 可以共用（§3） | 自訂網域要買＋逐個 project 綁（可 API 一次做） |
| **④ 部署**：一個 repo、一次 deploy | ⚠️ 做得到但唔值 | monorepo／一個「總 App」用 `<iframe>` 嵌 | 68 個 repo 併入一個＝極大工程＋日後每次改都要全量 build；**唔建議** |

> **一句**：**① 同 ② 可以真正做到「一次統管」，而且唔需要重寫任何 App**——方法係「**App 只負責掛一個讀設定的載入器，政策全部搬去 APP STORE**」。下面 §4 就係呢件事嘅具體做法。

---

## 1. 點解今日唔算「統管」

| 現況（[docs/51 §0.1](51-whitelist-rollout-list.md) 實查） | 後果 |
|---|---|
| 21 個已接閘、43 個未接 | 你改政策（例如「全部要登記」）要開 **43–68 次工** |
| 每個 App **自己 copy 一份** `store_gate_v1.0.js`，`mode`／`portalIds` 寫死喺自己 `<head>` | 入口改名、加減入口、改攔截文案 → **68 份唔同版本**，日後一定漂移 |
| 冇一個地方睇到「邊個 App 而家咩狀態」 | 你只能靠 [docs/51](51-whitelist-rollout-list.md) 手動清單（文件會過時，今次就係） |
| 停一個 App 要入 Vercel Dashboard 逐個撳 Pause | 停 5 個要 5 次 |

**根因唔係「冇工具」，係「政策寫死喺 68 個 repo 裏面」。** 只要將政策抽出嚟，統管就成立。

---

## 2. 四層槓桿：每層做到乜、幾多代價

### L1. 邊緣層（零改 App 碼，**今日就做得到**）

| 做法 | 一個掣管到幾多 | 限制（誠實） |
|---|---|---|
| **Vercel Team／專案 Deployment Protection** | 專案層一次；Team 層可一次蓋全部 | 只有「共用密碼／Vercel 帳號」兩種身分，**冇逐人登記、冇 1 人 1 session、刪人＝換密碼**；只能做臨時罩（同 [docs/61](61-registration-gate-and-single-session.md) §1 路線 A） |
| **Cloudflare Zero Trust（Access）放喺自訂網域前面** | **一份 policy 管晒所有 App**；Email OTP 登記、逐個撤銷、session 到期 | 需要自訂網域＋DNS 指去 Cloudflare（DNS 用 Cloudflare 免費 plan 即可）；**唔係「同帳號只 1 部機」**；流量經第三方（私隱要寫）；免費 plan 用戶數上限要**喺官方定價頁即時核實**（我唔會靠記憶報數） |

> L1 嘅價值：**唔使改 68 個 repo** 就有基本封閉。但佢「管閘」唔「管人」，所以長期仍然要 L2／L3。

### L2. 閘門層：**一份遠端閘門程式**（本文核心）

今日：68 份 copy。改成：

```html
<!-- 每個 App 只需要呢兩行（一次性改），以後唔再逐個 repo 改政策 -->
<script src="/store_gate_v1.0.js"></script>
<script src="https://scoutappstore.vercel.app/gate_remote_v1.0.js"
        data-app="router"                        <!-- 就係 SG18 用嘅 slug -->
        data-default-mode="entry-gate"           <!-- 讀唔到中央設定時嘅行為 -->
        data-on-error="local"></script>          <!-- local＝fail-soft，唔會令 App 死 -->
```

載入器（[`templates/vercel/gate_remote_v1.0.js`](../templates/vercel/gate_remote_v1.0.js)）做三件事：
① 去 APP STORE 攞 `?app=<slug>` 嘅政策（`mode`／`portalIds`／`silentPortalIds`…）；
② 5 分鐘瀏覽器快取（唔會每次開都打一次）；
③ 交畀**現有** `initStoreGate()` —— **`store_gate_v1.0.js` 一個字都唔使改**。

之後你喺控制台改 `apps.access_mode = 'closed'` → **全部有掛載入器嘅 App 下一次開就變關站卡**，**零部署**。

### L3. 設定層：APP STORE 已經係你嘅控制台骨幹（唔使開新 repo）

實查 `playerkousas-rgb/website`（APP STORE）：

| 已經有 | 對統管嘅意義 |
|---|---|
| `apps` 表（`slug`／`url`／`visible`／`clicks`／`stars`／`hearts`） | 已經係**全生態唯一 App 名冊**，加幾個欄位就係政策表 |
| `is_store_admin()` ＋ 後台 `admin.js`（已有登入同權限判斷） | 你已經有管理員介面，**唔使由零起** |
| `migrations/*.sql`（可重跑、`if not exists`） | 加欄位／加 RPC 嘅工作流已經成熟 |
| 13 個 migration 檔案（`retired_apps` 等） | 「已下架」概念已經存在，同「關站」相似，可對齊 |

**要加嘅只有一個 migration ＋ 一頁**：`apps.access_mode` 等欄位 ＋ `/api/gate-config` ＋ 後台一欄下拉選單（見 §6）。

### L4. 註冊層（要「登記」才需要）

L2／L3 只答「呢個 App 而家係開、閘、定關」。要「所有人登記先用、同帳號只 1 人、你隨時刪」，就接 [docs/61](61-registration-gate-and-single-session.md)：註冊中心（建議 `member-portal`）＋ `sessions` 表。**兩層唔可以互相取代**。

---

## 3. 三個套餐：按你嘅風險／工作量揀（唔使全部做）

| 套餐 | 內容 | 你要嘅 4 樣 | 工作量 | 風險 |
|---|---|:--:|:--:|---|
| **A. 即刻封閉** | 自訂網域 ＋ Cloudflare Access（一份 policy 管晒） | 封閉 ✅／登記 ✅（Email OTP）／1 人 1 session ❌／隨時刪 ✅ | 1 日（DNS ＋ 綁 domain 較多） | 唔改任何 App 碼，但**所有流量經第三方**；「1 人」做唔到 |
| **B. 中央政策（推薦做主線）** | L2 遠端載入器 ＋ L3 `apps` 表控制台 ＋（L4 接 61 嘅登記） | 封閉 ✅／登記 ✅（配 61）／1 人 ✅（配 61）／刪 ✅ | 控制台 1 日；68 個 App 掛載入器 = 每個 5 分鐘（可分批、可 Agent 批量） | App 多一個外部 script 依賴 → 已用 fail-soft 預設＋5 分鐘快取擋住 |
| **C. 全部自建（最硬）** | 自訂網域（真 SSO）＋ 61 全套 ＋ 每 App middleware 硬驗票 | ✅✅✅✅ | 1–2 週 | 最徹底，但要逐個 App 有後端；**唔建議一次過做** |

> **建議：B 做主線，A 做「今晚就想封閉」嘅臨時罩，C 只喺有收費／敏感資料嘅 App 做。** 三條唔衝突，因為 A 喺網域層、B 喺 App 層、C 喺後端層。

---

## 4. 中央設定格式（一份 JSON 答晒，App 只讀自己嗰行）

`GET https://scoutappstore.vercel.app/api/gate-config?app=<slug>`（公開、可快取、冇 secret）：

```json
{
  "schema": 1,
  "app": "router",
  "config": {
    "mode": "entry-gate",              // open｜entry-gate｜iframe-only｜closed
    "portalIds": ["appstore"],         // 沿用 SG §0.1 註冊表
    "silentPortalIds": ["library"],    // SG19：放行但唔畫掣
    "allowStandalone": true,
    "autoRedirectSeconds": 0,
    "titleZh": "此程式需經 SCOUT APP STORE 開啟",
    "titleEn": "Please open this app from SCOUT APP STORE"
  },
  "meta": { "updatedAt": "2026-11-26T12:00:00Z", "registry": "apps.access_mode" }
}
```

**原則（CP1–CP4）**：
- **CP1 只答政策，唔答內容**：API 唔可以回 `/api` 開唔開、唔可以回任何 token／個人資料。
- **CP2 未知 slug 要 fail-closed 定 fail-soft？** → **回 404**，由載入器用 `data-default-mode`。**唔可以靜靜回 `open`**（否則打錯 slug 就變全開）。
- **CP3 快取**：`Cache-Control: public, max-age=60, s-maxage=300`；App 側再 `sessionStorage` 5 分鐘。
- **CP4 版本**：`schema` 對唔上就當讀唔到（走 fallback），唔准「估格式」。

---

## 5. 遠端閘門嘅風險（呢節最重要，唔准跳）

| 風險 | 現實 | 我哋嘅處理 |
|---|---|---|
| **主站死 = 68 個 App 一齊死？** | 如果 fail-closed 就會 | **預設 fail-soft**（`data-on-error="local"`）：讀唔到就用 App 自己嘅 `default-mode`，即「同今日一樣」。想嚴格嘅 App 自己設 `closed` |
| **App 開唔到（CSP／擋第三方 script）** | 有可能 | 載入器用 `onerror` 唔可行（`<script>` 失敗唔會 throw 到 inline）→ 所以**保留本機 `store_gate_v1.0.js` 做本體**，載入器只係「攞設定」；本體已喺 repo，唔靠外部 |
| **快取令政策唔即時** | 最壞 5 分鐘＋CDN 5 分鐘 | 急事用 Vercel Pause Project（即時）；或者將 `data-cache-ttl` 設 0（多幾個請求） |
| **被篡改／CDN 污染** | 一份 script 影響 68 個 App | 只載入**我哋自己** origin 嘅檔（唔用第三方 CDN）；如要更嚴可加 SRI（`integrity`）＋版本化檔名 |
| **PWA 離線** | 離線時 fetch 失敗 | fail-soft 已蓋；離線應該照用 App（唔應該因為政策讀唔到而鎖人） |
| **私隱** | 主站會見到每個 App 幾時被開 | 只記 `app`＋時間，唔記 IP／UA；同 [docs/61](61-registration-gate-and-single-session.md) §9 一致 |
| **SEO** | 關站卡唔等於唔被索引 | 全部 App 加 `X-Robots-Tag: noindex`（見 61 §9） |

> **CP5：唔准將「中央設定」當安全邊界。** 佢係**政策方便**，唔係防護。要擋人，靠 [docs/61](61-registration-gate-and-single-session.md) 後端驗票；要擋搜尋引擎，靠 header。識改 `sessionStorage` 嘅人一樣繞得過軟閘（同 [docs/50](50-app-store-whitelist-and-shutdown.md) §5）。

---

## 6. 控制台：加 4 個欄位 ＋ 1 條 RPC ＋ 1 頁（喺 `website` 做，唔開新 repo）

### 6.1 Migration（可重跑，跟 `website/migrations/` 慣例）

```sql
-- migrations/20261126-apps-access-mode.sql（建議放喺 website repo，唔係真理倉）
begin;

alter table public.apps add column if not exists access_mode text not null default 'open';
alter table public.apps drop constraint if exists apps_access_mode_chk;
alter table public.apps add constraint apps_access_mode_chk
  check (access_mode in ('open', 'entry-gate', 'iframe-only', 'closed'));

alter table public.apps add column if not exists access_note text;          -- 例如「暫停至 12 月」
alter table public.apps add column if not exists require_registration boolean not null default false;
alter table public.apps add column if not exists access_updated_at timestamptz not null default now();

comment on column public.apps.access_mode is
  'SG 政策：open 直開／entry-gate 要經白名單入口／iframe-only 只准嵌入／closed 關站。由 gate_remote 載入器讀取。';

commit;

-- 檢查：邊個 App 係公開
-- select slug, name, access_mode, require_registration from public.apps where visible order by access_mode, slug;
```

### 6.2 `gate-config` API（APP STORE 加一個 serverless function）

```js
// api/gate-config.mjs —— 只回政策，唔回敏感資料
export default async function handler(req, res) {
  const slug = String(req.query.app || '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(slug)) return res.status(400).json({ error: 'bad_app' });

  const r = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/apps?slug=eq.${encodeURIComponent(slug)}&visible=eq.true&select=slug,access_mode,require_registration,access_updated_at`,
    { headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` } }
  );
  const rows = await r.json();
  const app = Array.isArray(rows) ? rows[0] : null;
  if (!app) { res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300'); return res.status(404).json({ error: 'unknown_app' }); }

  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  return res.status(200).json({
    schema: 1,
    app: app.slug,
    config: {
      mode: app.access_mode,
      portalIds: ['appstore'],
      silentPortalIds: ['library'],
      allowStandalone: true,
      autoRedirectSeconds: 0,
      titleZh: app.access_mode === 'closed' ? '此網站目前暫時關閉' : '此程式需經 SCOUT APP STORE 開啟',
      titleEn: app.access_mode === 'closed' ? 'This site is temporarily closed' : 'Please open this app from SCOUT APP STORE'
    },
    meta: { updatedAt: app.access_updated_at }
  });
}
```

> `require_registration` 呢個欄位**唔會**由 `gate-config` 執行（佢只管 SG 政策）。要真擋登記，交 [docs/61](61-registration-gate-and-single-session.md) 嘅票據；呢個欄位係畀載入器決定「要唔要順手跳去登記中心」。

### 6.3 後台一頁（`website` 已有 `admin.js`）

| 欄 | 顯示 | 你可以做 |
|---|---|---|
| App（slug／名） | ✅ | 搜尋 |
| 政策 | `access_mode` | 下拉：直開／白名單／只准嵌入／關站 |
| 登記 | `require_registration` | 開／關 |
| 最後改動 | `access_updated_at` | 顯示「幾時、邊個改」 |
| 批量 | — | 「全部改 entry-gate」「全部改 closed」＋**二次確認**（一次影響 68 個 App，唔可以一撳就做） |

**批量操作嘅硬規矩（CP6）**：① 一定要顯示「將會影響 N 個 App」；② 要打返 `CONFIRM` 或 App 數量；③ 每次批量寫入 `access_updated_at` 同操作紀錄；④ 批量只准改政策，**唔准順手 Pause 專案**（Pause 係另一個更高風險動作）。

### 6.4 Vercel API：想由控制台直接 Pause／Resume

- Vercel REST API 可以列專案、Pause／Resume，但**要一支有 `projects` 權限嘅 token**。
- ⚠️ **2026-11-26 實測**：本對話嘅 `vercel` connector `list_projects` **仍然回 `Access denied`**（token 未授權 projects 讀取）。所以今日**唔可以由 Agent／控制台代撳 Pause**；要你自己喺 Dashboard 撳，或者你重新授權一支有 `projects:write` 嘅 token 再叫我做。
- 建議：控制台第一版**只做政策**（`access_mode`，零 Vercel 權限）；Pause 留人手。少一個高風險後門。

---

## 7. 落地次序（每步都停得低，唔會搞死全站）

| 步 | 做乜 | 大約 | 驗收 |
|:--:|---|---|---|
| **0** | 開一個 `apps.access_mode='closed'` 嘅測試 App（例如 `router`）＋ 手動改 JSON 檔模擬 API | 30 分鐘 | 改一個欄位 → 該 App 出關站卡；其他 App 完全冇變 |
| **1** | `website` 加 migration ＋ `api/gate-config.mjs`；`curl` 三個 slug 睇 JSON | 半日 | 未知 slug 回 404（唔係 open） |
| **2** | 3 個示範 App 掛 `gate_remote_v1.0.js`（1 個 Next.js／1 個 Vite／1 個單檔） | 半日 | 真機：改政策 5 分鐘內生效；斷網仍開得（fail-soft） |
| **3** | 批量掛（每個 5 分鐘，可交由 Agent 逐個 repo 做，一次 5–10 個） | 分批 | 每批抽 2 個真機驗 |
| **4** | 後台一頁 ＋ 批量掣（含二次確認） | 1 日 | 批量改 3 個 App → 3 個都生效、其他冇動 |
| **5** | 接 [docs/61](61-registration-gate-and-single-session.md)（登記／1 人 1 session／刪人） | 見 61 | 見 61 §12 |

> **次序陷阱**：**Step 2 之前唔好批量改政策。** 未掛載入器嘅 App 讀唔到政策，你以為「全部關站」，實際上 43 個仍然公開——呢個係最易出事嘅假安全感。

---

## 8. 統管之後，你每日實際會做嘅三件事

1. **睇一頁**：APP STORE 後台「App 狀態」——邊個公開、邊個要登記、邊個關站、邊個未掛載入器（呢個欄位最重要，因為佢代表**政策唔生效**）。
2. **撳一個掣**：出事先全站 `closed`（或個別 App `closed`）；平息後改返。**唔使開 68 個 repo。**
3. **刪一個人**：喺登記中心 `owner_delete`（[docs/61](61-registration-gate-and-single-session.md) §7），一次過斷晒佢喺所有 App 嘅 session。

---

## 9. 唔做／已知限制（交付前照抄，唔准美化）

- ❌ **未實作**：本文只係設計；`gate-config` API、migration、後台一頁、載入器都**未寫入任何 App、未跑過**。載入器範本 [`templates/vercel/gate_remote_v1.0.js`](../templates/vercel/gate_remote_v1.0.js) 亦**未實測**（未喺真機／離線／CSP 環境跑）。
- ❌ **「統管」唔等於「安全」**：政策讀得到、改得到，但**軟閘擋唔到 DevTools**；硬擋只在有後端／middleware 嘅 App（[docs/61](61-registration-gate-and-single-session.md) §6）。
- ❌ **未掛載入器 = 政策唔生效**：呢個係最大盲點，所以要喺後台**明確列出「未掛載」**嘅 App（可以靠 `gate_remote` 上線後嘅統計，或者逐個 repo 查 `<script>`）。
- ⚠️ **Vercel token 未授權 projects**：今日 Agent 代撳 Pause 做唔到（實測 Access denied）；要你手動或重新授權。
- ⚠️ **Cloudflare Access（套餐 A）用戶上限、收費、功能**：要**即時睇官方定價頁**，我唔會靠記憶報數；亦要寫清楚流量經第三方嘅私隱影響。
- ⚠️ **自訂網域**：`*.vercel.app` 屬 PSL，**共用 cookie 一定做唔到**；要真 SSO 就一定要自訂網域（`apps.你的網域`）。買網域＋68 個 project 綁 domain 可以用 API 批次做，但**未試過**，而且改網域會令舊連結／書籤／已裝 PWA 全部要轉（PWA 尤其痛：主畫面 icon 綁 origin）。

---

## 10. 驗收清單（Step 2 完咗逐條剔）

- [ ] 改一個 App 嘅 `access_mode` → **只有佢**變，其他 App 唔受影響
- [ ] 未知 slug → API 回 404，App 用自己 default（**唔會變全開**）
- [ ] 主站模擬 down（改錯 origin）→ App 照開得（fail-soft），Console 有 `[ScoutGate]` 警告
- [ ] 完全斷網 → App 照開得
- [ ] 5 分鐘內改兩次政策 → 最終生效嘅係最新（快取唔會黏死）
- [ ] 批量改 3 個 App → 3 個生效、影響數量顯示正確、有二次確認
- [ ] 後台睇得到「未掛載入器」嘅 App 清單
- [ ] 你自己手機開一個 `closed` 嘅 App → 見到中文告示卡（唔係白屏／英文 500）

---

## 11. 同其他文件嘅分工

| 你想 | 去 |
|---|---|
| 登記／單一 session／刪人（「有冇戶口」） | [docs/61](61-registration-gate-and-single-session.md) |
| 白名單入口／`store_gate`／關站模式（「邊度嚟」） | [docs/50](50-app-store-whitelist-and-shutdown.md) |
| 邊個 App 而家有閘（實查清單） | [docs/51](51-whitelist-rollout-list.md) §0.1 |
| 載入器範本 | [`templates/vercel/gate_remote_v1.0.js`](../templates/vercel/gate_remote_v1.0.js) |
| 閘門本體（唔使改） | [`templates/vercel/store_gate_v1.0.js`](../templates/vercel/store_gate_v1.0.js) |
| Supabase RLS／RPC 寫法 | [docs/08](08-supabase.md) |
