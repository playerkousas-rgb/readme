# 64 — README 2.0 規劃：八層分類、你漏咗嘅十四項、權限模型

> **2026-11-26 用戶定案**：「我打算重起整個計劃，要準備好 README 2.0；所有 App 會由 2.0 開始重建，所以要先做好 2.0 的規劃和分類。」並列出五項：① 中央 PORTAL 圈（區／服務平台／管理／訓練班／專章秘書）② 旅團 PORTAL 圈（旅／支部×5／進度×4／BOOK×4）③ 普通 App（領袖 vs 成員權限，登入時已記入）④ APP STORE 統一入口 ⑤ ADMIN 統一回報／意見；另問「有冇漏？」同「GEMINI 系統」。
> **狀態：規劃文件，未動任何 App、未改根 README**（用戶要求：2.0 定案後才改 README）。
> **配套**：91 個 public repo 嘅逐個分類對照 → [`readme-2.0-inventory.csv`](readme-2.0-inventory.csv)（用途欄係**推測**，`信心`欄標 H/M/L，L 要你確認）。
> 相關：[docs/63](63-system-blueprint-six-parts.md)（六部分藍圖）· [docs/62](62-one-control-plane-for-all-apps.md)（政策控制面）· [docs/61](61-registration-gate-and-single-session.md)（後台開戶／1 部機）· [docs/50](50-app-store-whitelist-and-shutdown.md)（入口閘）

---

## 0. 先答你：你嘅五項，對應 2.0 八層；**漏咗嘅係「橫向部件」**

| 你講嘅 | 我建議放喺 | 狀態 |
|---|---|---|
| ④ APP STORE 統一入口 | **L0 平台：APP STORE 殼** | ✅ 你已有雛形（`website`） |
| （你講「登入時已記入權限」） | **L0 平台：身份核心** | ⚠️ 你當佢係「登入功能」，但佢**係一個獨立部件**（帳戶／角色／票據／1 部機／刪人） |
| ⑤ ADMIN 統一回報／意見 | **L0 平台：ADMIN** | ✅ 建議同 APP STORE 同一 repo 另一個路由（[docs/63](63-system-blueprint-six-parts.md) §5） |
| （你今次冇提 😯） | **L0 平台：通告中心（圖書館＋通知渠道）** | ❗**漏咗**：`scout-circulars` 係你嘅 Push 主場、家長入口 |
| ① 中央 PORTAL 圈（5 個系統） | **L1 中央生態圈** | ✅ 方向清楚 |
| ② 旅團 PORTAL 圈（旅／支部／進度／BOOK） | **L2 旅團生態圈** | ✅ 方向清楚 |
| ③ 普通 App（領袖／成員） | **L3 工具 App** | ✅ 但要先定**權限模型**（§3），否則 68 個 App 各自一套判斷 |
| — | **L4 內容與素材**（圖卡／PPT／連結／投稿／素材庫） | ❗漏咗（`website` 已有 `pages`／`categories`／投稿） |
| — | **L5 基礎設施**（API 代理／轉駁器／備份／監控／Agent／測試） | ❗漏咗（`api`、`router`、`AGENT`…） |
| — | **L6 AI（GEMINI）** | ❗你最後補問：見 §2 |
| — | **L7 治理（真理倉 `readme`）** | ❗漏咗：規則／範本／審計／版號，2.0 一樣要有 |

**一句**：你數嘅係「**系統**」，漏咗嘅係「**平台與橫向能力**」——冇呢幾樣，2.0 一樣會走返 1.0 嘅路（68 份重複、政策漂移、冇備份、冇監控）。

---

## 1. 2.0 分類樹（八層，定稿建議）

```
L0 平台層（4 件，全部由 APP STORE 一個 repo 出）
   ├─ ① APP STORE 殼      /            唯一入口、目錄、搜尋、最愛、我的 App
   ├─ ② 身份核心          /login /api/ticket   帳戶、密碼、角色、票據、1 部機
   ├─ ③ ADMIN             /admin       開戶、政策、回報、意見、審計
   └─ ④ 通告中心          （圖書館＋通知渠道：Push／WhatsApp）

L1 中央生態圈（你嘅 PORTAL-1；5 個系統，各自獨立、互不依賴）
   ├─ 區系統               scout-district-portal（+ 區徽章 dbs3.0）
   ├─ 服務平台（成員系統）  member-portal（4 本 BOOK 入口、服務申請）
   ├─ 管理系統             scout-admin（待確認範圍）
   ├─ 訓練班系統           course（+ CERT 證書產生）
   └─ 專章秘書系統         BadgeHouse（推測）

L2 旅團生態圈（你嘅 PORTAL-2；三條子線）
   ├─ 旅系統               troop-portal / troop_portal（+ troop-attendance 點名）
   ├─ 支部系統 ×5          gh_portal（小）／cubs_portal（幼）／sc_portal（童）
   │                       ／vs_portal（深資）／rs_portal（樂行）
   ├─ 進度追蹤 ×4          幼／童／深資／樂行（小童軍冇）
   └─ BOOK ×4              CUBSBOOK／SCOUTBOOK／VSBOOK／ROVERBOOK（可獨立當 App）

L3 工具 App（領袖／成員功能有少許分別）
   48 個（見 CSV）：圖鑑、地圖、繩結、摩斯、定向、遊戲、相片、簡報…

L4 內容與素材
   ├─ 圖卡／PPT／連結       website 的 pages／categories
   ├─ 投稿／分享           website 的 submissions（已存在）
   └─ 素材庫               Materials／PPTMAKER／MD

L5 基礎設施
   ├─ API 代理             api（`/api/proxy`）
   ├─ 轉駁器               router／troop-router
   ├─ Agent 指令           AGENT
   └─ 營運：備份／監控／測試環境／成本（2.0 新增，見 §2）

L6 AI
   └─ GEMINI（你 private repo）——**2.0 定位要你決定**（§2.9）

L7 治理（真理倉 readme）
   規則（S/F/A/W/V/L/I/SG/MG）／範本／審計／版號／私隱聲明
```

**分類原則（三條，唔好破）**：
1. **一個 repo 只屬一層**，唔准「又係 portal 又係 App」。（1.0 嘅混亂源頭：`member-portal` 既係入口又係應用。）
2. **L0 只可以有 4 件**，多一件就代表有嘢未想清楚。
3. **L1／L2 各自一個生態圈，互相只經 L0 溝通**（唔准 L1 直接寫 L2 嘅 DB）。

---

## 2. 你漏咗嘅 14 項（每項：為何要數、放邊、漏咗會點）

| # | 漏項 | 為何一定要數 | 2.0 放邊 | 漏咗會發生乜 |
|:--:|---|---|:--:|---|
| 1 | **通告中心（圖書館）** | 你嘅 Push 主場、家長唯一入口 | L0-④ | 登記閘一開，Push 訂閱斷、家長流失（[docs/63](63-system-blueprint-six-parts.md) §4） |
| 2 | **身份核心（票據／角色）** | 「登入時記入權限」需要一個地方簽票同放 claims | L0-② | 68 個 App 各自判斷角色 → 一定有 App 判斷錯 |
| 3 | **角色與單位模型** | 同一個人可以係「21旅支部領袖＋區職員＋家長」 | L0-② | 單一 `role` 欄位一定唔夠（§3） |
| 4 | **帳戶生命週期** | 幼童軍升童軍、轉旅、畢業、離團、領袖退任 | L0-②＋L2 | 資料跟你一世；離任領袖仍然有權限（**最危險**） |
| 5 | **公眾／訪客** | 有啲內容應該公開（通告、簡介），有人一世都唔會開戶 | L0-①④ | 全部要登入 = 冇新血 |
| 6 | **內容與投稿** | `website` 已有投稿／分類／上架／下架 | L4 | 2.0 重建時漏咗，投稿功能消失 |
| 7 | **統計與分析** | `clicks／stars／hearts`、每個 App 用量 | L0-③ | 你唔知邊個 App 有人用、邊個可以退役 |
| 8 | **通知渠道** | 你唔用 email → **WhatsApp／Push 更重要** | L0-④ | 忘記密碼、系統公告冇渠道通知 |
| 9 | **已下架／退役** | `retired_apps` 已有概念；2.0 會淘汰一堆 App | L4／L0-③ | 舊 `?app=` 連結變 404 死連 |
| 10 | **備份與災難恢復** | Supabase／repo／自訂網域 DNS／環境變數 | L5 | 一次誤刪就係全部（我今日就係幫你查「邊個有閘」，靠嘅係 Git） |
| 11 | **監控與錯誤** | Uptime、Vercel logs、錯誤回報 | L5＋L0-③ | 用戶話「開唔到」你唔知，靠人 WhatsApp 你 |
| 12 | **私隱與法務** | PDPO、家長同意、版權／水印（W1–W8）、無障礙 | L7 | 你持有未成年人資料，出事唔止技術問題 |
| 13 | **教學／FAQ／新手引導** | 2.0 全部用戶要重新學一次 | L0-①＋L4 | 「點解入唔到」變你日常 |
| 14 | **名冊匯入／資料遷移** | 1.0 的 BOOK／進度資料要搬去 2.0 | L2＋L5 | 分兩次輸入，一定有人唔做 |

**另外三個「你未講但一定會撞」**：
- **收費／收據**：如果訓練班／活動要收錢，就多一個「付款＋對帳」部件（今日冇，唔好假設永遠冇）。
- **測試／預覽環境**：2.0 重建期間，舊版要繼續服務；冇 preview 就係「邊改邊壞」。
- **成本／配額**：Vercel／Supabase 免費額度上限（Edge 呼叫、DB、Storage），要有一個地方睇。

---

## 3. 權限模型（**2.0 最重要嘅一個決定**）

### 3.1 唔可以「一個 user 一個 role」

你嘅實況：同一個人可以同時係——

| 身份 | 例子 |
|---|---|
| 支部領袖 | 第 21 旅 幼童軍支部領袖 |
| 旅職員 | 同一旅嘅旅務委員 |
| 區職員 | 區徽章秘書 |
| 家長 | 自己個仔喺另一旅 |
| 成員 | 自己都係深資童軍 |

→ **必須「人 × 單位 × 角色」多對多**：

```
members(id, username, password_hash, display_name, status, must_change_pw, …)
memberships(id, member_id, unit_type, unit_id, role, valid_from, valid_to)
   unit_type: 'district' | 'troop' | 'branch' | 'course' | 'badge-sec' | 'hq'
   role:      'member' | 'leader' | 'admin' | 'owner'
```

### 3.2 票據要帶 claims，App **只讀 claims**

```
票 payload = {
  sub: <member id>,
  sid: <session id>,
  units: [{ t: 'branch', id: 'cubs-21', r: 'leader' }],
  scopes: ['book:cubs:read','book:cubs:write','progress:cubs:read'],
  exp: iat + 60
}
```

- **App 唔准自己查 DB 判斷角色**（68 個 App 各自一套 = 一定有錯；而且每加一個角色要改 68 次）。
- App 只寫一份「**功能 ↔ scope** 對照表」：例如 BOOK 內「可以編輯進度」＝ `progress:cubs:write`。
- 「功能上有小許分別」＝**用 scope 控制顯示／隱藏**，唔好散落 `if (role === 'leader')`。
- **預設最小權限**：成員只讀自己支部；寫入要 leader；跨支部／全區要 admin。

### 3.3 5 個支部 vs 4 個進度／BOOK（你應該想確認呢點）

我從 repo 名推斷：**5 個支部 ＝ 小童軍（`gh`）／幼童軍／童軍／深資／樂行**，而**進度、BOOK、徽章只有 4 個**（小童軍冇）——所以「5 支部、4 進度、4 BOOK」係**一致**嘅，唔係漏數。

| 支部 | 支部 portal | 集會 | 徽章 | 進度 | BOOK |
|---|:--:|:--:|:--:|:--:|:--:|
| 小童軍（`gh`） | ✅ `gh_portal` | ✅ `ghmeeting` | — | — | — |
| 幼童軍 | ✅ `cubs_portal` | ✅ `cubsmeeting` | ✅ `cubsbadge` | ✅ | ✅ `CUBSBOOK` |
| 童軍 | ✅ `sc_portal` | ✅ `scoutmeeting` | ✅ `scoutbadge` | ✅ | ✅ `SCOUTBOOK` |
| 深資童軍 | ✅ `vs_portal` | ✅ `vsmeeting` | ✅ `vsbadge` | ✅ | ✅ `VSBOOK` |
| 樂行童軍 | ✅ `rs_portal` | ✅ `rsmeeting` | ✅ `roverbadge` | ✅ | ✅ `ROVERBOOK` |

> ⚠️ 呢個表係**我推斷**（repo 名 + 你講嘅數字），`rsmeeting`／`rs_portal`／`gh_portal`／`cubs_portal`／`sc_portal` 都**未部署**。**請確認**：① 5 個支部係咪呢 5 個？② 小童軍真係冇進度／BOOK？③ 集會得 4 個（樂行冇集會 App）定係你未做？

### 3.4 「登入時已記入」嘅正確定義

你講「從 APP STORE 當（登）記時已記入」——正確做法係：

1. **開戶時**你（或旅團管理員）設定：屬於邊個單位、咩角色（可多條）。
2. **登入時**身份核心把該人**所有有效 memberships** 砌成 scopes 放入票。
3. **App 開頁**只讀票 → 決定顯示咩；寫入時**後端再驗**（唔可以只靠前端隱藏）。
4. **角色改變**（升支部／退任）→ 你改 `memberships` → 舊票 60 秒後自然失效（或即時踢 session）。

---

## 4. README 2.0 骨架草案（可以直接貼落新 README）

> 原則：**README 只放「分類＋規則＋入口」**，唔放 68 個 App 嘅細節（指針去各 App repo）。長度目標 **≤ 400 行**，其餘去 `docs/`。

| 章 | 標題 | 內容（一句） |
|:--:|---|---|
| 0 | 一句定位 | 「一個入口、一個身份、一套政策：童軍生態的網站與工具平台」 |
| 1 | 2.0 全景圖 | §1 嘅八層圖（L0–L7） |
| 2 | 邊個用邊個 | 角色 × 系統對照（成員／領袖／旅／區／管理員／公眾） |
| 3 | 入口規則 | 唯一入口、登入票、PWA、`noindex`、分享連結只指 APP STORE |
| 4 | 帳戶與權限 | 後台開戶、1 部機、角色 model、如何申請、如何刪 |
| 5 | App 目錄 | **由 `readme-2.0-inventory.csv` 生成**（唔手寫，避免過時） |
| 6 | 中央生態圈（L1） | 5 個系統各一句 + 入口 |
| 7 | 旅團生態圈（L2） | 旅／支部×5／進度／BOOK 的關係圖 |
| 8 | 工具 App（L3） | 分類清單（圖鑑／地圖／技能／遊戲／相片…） |
| 9 | 內容與素材（L4） | 投稿流程、上架／下架、版權 |
| 10 | 基礎設施與營運（L5） | 備份、監控、配額、事故處理 |
| 11 | AI（L6） | GEMINI 定位 |
| 12 | 開發規範（L7） | S/F/A/W/V ＋ L（雙語）＋ I（PWA）＋ 版號＋金魚審 |
| 13 | 命名與網域 | repo／slug／網域規則（§5） |
| 14 | 1.0 → 2.0 遷移 | 邊個保留、邊個合併、邊個退役、舊連結點算 |
| 15 | 未做／限制 | 誠實清單（[docs/47](47-readme-discipline.md) 原則） |
| 16 | 變更紀錄 | 只記「架構級」變更，細節留各 repo |

**要唔要保留現有 README？** 建議：唔好就地改。開 `README-2.0.md` 寫到「M3 完成」先切換，舊 README 留做 1.0 紀錄（並加一行「2.0 進行中 → 見 README-2.0」）。

---

## 5. 命名規則（2.0 建議，唔好為改名而改名）

| 對象 | 規則 | 理由 |
|---|---|---|
| **現有 91 個 repo** | **唔改名**（改名會壞所有連結、Vercel 專案、舊 commit 參照） | 用 `readme-2.0-inventory.csv` 做分類真相 |
| **新 repo** | `<family>-<thing>`，例 `branch-cubs-portal`、`tool-knot`、`plat-appstore` | 一眼睇到屬邊層 |
| **slug（`?app=`）** | 沿用現規則：細楷 ASCII、2–40 字、`unique` | 分享／QR 穩定（SG9） |
| **網域** | 理想：`apps.<你的網域>`（子網域）→ cookie 可共用、真 SSO | `*.vercel.app` 屬 PSL，永遠做唔到共用 cookie |
| **版本** | 全生態 `v2.x`；每個 App 自己 `vX.Y`（雙版號照舊） | 生態版號 ≠ App 版號 |
| **App ID** | 建議分類 + 序號：`L3-041`（對照 CSV），方便你講「第 41 號工具」 | 避免用中文名做 ID |

---

## 6. 重建順序（M0–M8，**唔好一次過重寫 91 個**）

| 階段 | 做乜 | 完成定義 | 唔做住嘅代價 |
|:--:|---|---|---|
| **M0** | 答 §7 嘅 12 條（定案寫入本文件） | 全部有答案 | 之後每次都要重新討論 |
| **M1** | L0-① APP STORE 殼 + L0-② 身份核心（開戶／登入／票／1 部機） | 你＋3 個測試帳戶用得到；子 App 未接都得 | 冇身份就冇得做任何閘 |
| **M2** | L0-③ ADMIN（開戶、政策、回報、審計） | 你唔開 DB editor 都管到日常 | 你永遠係瓶頸 |
| **M3** | L0-④ 通告中心分層（公開 feed／會員工具）＋ Push link 改指 APP STORE | 舊訂閱者仍收到通知並撳得入 | 一開閘就流失讀者 |
| **M4** | L1 五個系統：逐個接 L0 身份（先 1 個 pilot：`member-portal`） | 1 個系統用同一個帳戶入到 | L1 各自一套帳戶 = 身份永遠唔統一 |
| **M5** | L2 旅團生態：先 **1 個支部（幼童軍）** 全條線（portal＋集會＋徽章＋進度＋BOOK） | 一個支部完整行得通 | 一次過 5 個支部 = 5 倍 bug |
| **M6** | L3 工具 App：先接 3 個示範，再分批；**合併同族**（BOOK 家族先） | 每批抽驗 10% | 68 個永遠有一半冇閘 |
| **M7** | L6 GEMINI 定位（§7 問題 10） | 一句話講清楚佢係入口定工具 | 永遠「多一個身份源」 |
| **M8** | L5 營運：備份／監控／配額／測試環境 | 你收到警報、可以一鍵回滾 | 出事唔知、救唔返 |

---

## 7. 要你答嘅 12 條（答完就可以開工 M1）

| # | 問題 | 我嘅建議 |
|:--:|---|---|
| 1 | **5 個支部**係咪 小童軍／幼童軍／童軍／深資／樂行？ | 係（§3.3 表），請確認 |
| 2 | **小童軍**真係冇進度／BOOK／徽章？ | 係（睇你數字，5/4/4 一致） |
| 3 | **樂行集會**（`rsmeeting`）要唔要做？ | 要做，否則 5 支部唔齊 |
| 4 | **GEMINI** 喺 2.0 係「入口」定「工具」？ | **工具（L6）**；唔好再當入口，否則多一個入口＝違背「唯一入口」 |
| 5 | **通告**公開定要登記？ | 「通告公開、工具要登入」（[docs/63](63-system-blueprint-six-parts.md) §4 方案①） |
| 6 | **角色**要邊幾種？ | `member`／`leader`／`admin`（區／旅）／`owner`（你） |
| 7 | **開戶**由邊個做？只有你，定區／旅管理員都得（只限自己單位）？ | 先只有你（M1），M4 後開畀區／旅 admin |
| 8 | **1 部機**定 2 部？ | 成員 1 部、你自己 2 部 |
| 9 | **網域**買唔買？ | 有預算就買（一次解決 cookie／SSO／品牌） |
| 10 | **合併**邊幾個家族？ | 先 BOOK×4（要 schema 對照），其餘觀察 |
| 11 | **1.0 資料**要唔要搬去 2.0？ | BOOK／進度一定要搬（否則用戶重打）；小遊戲分數可以唔搬 |
| 12 | **舊 App** 幾時退役？ | 2.0 對應功能上線 + 30 日後，出「已下架」頁（`retired_apps` 概念） |

---

## 8. 誠實限制（交付前照抄）

- ❌ **全部未實作**：本文件只係規劃；`memberships`、票據 claims、ADMIN、`reports` 表全部未寫。
- ⚠️ **CSV 嘅分類係推測**：91 個 repo 之中有一批（`BP`、`DGA`、`forward`、`upgrade`、`Veritas*`、`answer`、`bookkeeping`、`ceremony`、`code`、`event`、`BadgeHouse`、`scout-admin`、`course`、`scoutapp`）我**只靠名字推測**，`信心` 欄標 L／M；**唔好當已核實**。
- ⚠️ **5 支部 vs 4 嘅對應表係推斷**（repo 名 + 你給嘅數字），未開每個 repo 核對功能。
- ⚠️ **合併同族未做 schema 對照**：4 本 BOOK／4 個 meeting 嘅資料結構我未逐個比，合併前必須另做一次審查。
- ⚠️ **「唯一入口」需要全部 App 接閘才成立**：今日 21 有閘、43 未接（[docs/51](51-whitelist-rollout-list.md) §0.1）。
- ⚠️ **2.0 重寫 ≠ 全部由零**：建議「重分類 + 重建 L0 + 分批接線」，唔好真係 91 個 repo 全部由零寫（成本極高，而且你會失去現有可用工具）。

---

## 9. 分工

| 你想 | 去 |
|---|---|
| 逐個 repo 分類對照（可篩可排序） | [`readme-2.0-inventory.csv`](readme-2.0-inventory.csv) |
| 六部分藍圖／單體 vs 分散 | [docs/63](63-system-blueprint-six-parts.md) |
| 帳戶、密碼、1 部機、刪人 | [docs/61](61-registration-gate-and-single-session.md) |
| 一次統管政策（`access_mode`） | [docs/62](62-one-control-plane-for-all-apps.md) |
| 入口白名單／關站 | [docs/50](50-app-store-whitelist-and-shutdown.md) |
| 邊個 App 而家有閘 | [docs/51](51-whitelist-rollout-list.md) §0.1 |
