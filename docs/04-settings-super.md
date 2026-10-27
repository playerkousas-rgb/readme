# 04 — 系統設定層 + 隱藏超管（系統級 app 必備）

> **案例隔離**：本檔係通用規則。檔內 `UNIT_*`／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN` 等只係**中性示例名**；
> ecportal 旅團／進度追蹤嘅具體專案設定全部喺 [19 專案案例](19-ecportal-troop-case.md)（**唔係通用規則，新 app 唔使跟名**）；repo 健康 → [20](20-repo-health-audit.md)。


> **點解要呢份**：工具型 app 可以冇設定；但一叫「系統」，就一定有唔同單位、唔同環境、唔同開關。冇設定層 = 每個改動都要改 code + redeploy；冇超管 = 管理員鎖咗自己出面就成個系統報銷。
> 兩者都要**設計過**，唔係求其加個 `settings` table 或者一個 `admin/admin` 帳號。

---

## 1. 設定層

### 1.1 四層優先序（由低至高）

```
① defaults（code 常數，入 Git）           — 永遠有個安全預設值，fail closed
② env（Vercel env / GAS ScriptProperties）— secret 只可以喺呢層
③ remote config（Supabase table / Sheet）— 可公開嘅開關、名、限額、開關掣
④ per-unit override（旅／團／用戶）      — 只可以收窄，唔可以放大權限
```

**死規矩**：
- **secret 唔落 ③④**。remote config 只可以存「邊條 env 名」嘅 reference（例 `backend_key_ref: "UNIT_DEMO_APIKEY"`），唔可以存 key 本身。
- **④ 只能收窄**：單位可以閂咗某功能，唔可以自己開上級停用嘅功能（`effective = min(upper, lower)`）。
- 每層改動都要 audit（actor、before、after、ts）。

### 1.2 唯一入口 `getConfig()`

```js
// config.mjs — 所有設定只可以由呢度讀
const SCHEMA = {
  'feature.notices':      { type:'boolean', default:true,  failClosed:true },
  'limit.upload.bytes':   { type:'number',  default:5*1024*1024, min:1024, max:10*1024*1024 },
  'session.expMinutes':   { type:'number',  default:30,   min:5,  max:60 },
  'downstream.allowLocal':{ type:'boolean', default:true,  failClosed:true },
  'backend.keyRef':       { type:'string',  default:'UNIT_DEFAULT_APIKEY', secretRef:true },
};

export function getConfig(key, ctx = {}) {
  const def = SCHEMA[key];
  if (!def) throw new Error('UNKNOWN_CONFIG_KEY:' + key);   // F5 白名單
  const raw = ctx.override?.[key] ?? ctx.remote?.[key] ?? process.env[key] ?? def.default;
  const v = coerce(raw, def);
  if (v === null) return def.failClosed ? false : def.default;  // F4 fail closed
  return v;
}
```

要點：
- `SCHEMA` 係唯一真理（F1）：新設定一定要喺度登記，唔准 `process.env.X` 散落各處。
- `coerce` 驗型別 + 範圍；唔合法 = fail closed + 寫一條 WARN log（唔好靜靜用預設）。
- `secretRef` 類型：只可以由 server 解析成真正 env 值，永遠唔回傳前端。
- cache 5 分鐘 + `POST /api/admin/config/flush` 手動失效（要有權限）。

### 1.3 設定分兩類，唔好撈亂

| 類 | 例子 | 邊度改 | 要唔要 redeploy |
|----|------|--------|-----------------|
| **secret** | `API_KEY`、`SUPER_KEY`、`SESSION_SECRET`、Supabase `service_role` | Vercel Dashboard / GAS ScriptProperties | **要**（或 flush + 重新讀） |
| **非 secret 設定** | 單位名、模組開關、限額、日曆顏色、訊息模板 | 管理員 UI → Supabase / Sheet | 唔使（cache TTL 內生效） |

> 常見錯：將 apikey 放入「方便改」嘅 config table → 任何讀到 table 嘅人就拎到 key。見 A1。

### 1.4 開關掣：上游控、下游寫（實戰模式）

```
上游前端掣  ──sig──▶  下游 setLocalLogin / setDownstreamAccess
                       └─ 寫入下游 ScriptProperties: ALLOW_LOCAL_LOGIN
```

- 下游前端**唔可以有**呢個掣（只容許獨立／災難恢復選單），否則兩邊打架。
- 值 fail closed（F4）：只有 `1/true/yes/on/open` = 開。
- **未設定 = 開**（向下兼容）；一旦有值就以上游為準。
- 閂口前必須確認：① 已搬數 ② 上游 sig 轉發路徑已通 ③ 至少一個本地領袖戶 + SUPER 可作災難恢復。

### 1.5 設定服務死咗點算

```
remote config timeout / parse fail
   → 用上一個已知良好 cache（last known good）
   → 進入唯讀模式（拒絕寫入敏感 action）
   → 頂欄顯示「設定服務異常」
   → 絕不 fallback 去「全部開啟」
```

`last known good` 要落本機檔案 / CacheService，唔好只放 memory（重啟即失）。

### 1.6 設定層交付 checklist

```
[ ] SCHEMA 有每個 key 嘅 type / default / min-max / failClosed
[ ] getConfig 係唯一讀取入口（grep process.env 應該只喺 config.mjs 出現）
[ ] 所有 secret 只喺 env，config table 得 reference
[ ] 每個改動有 audit（actor/before/after/ts）
[ ] 有 flush endpoint + 5 分鐘 cache
[ ] 有 kill switch（一個 flag 可以即刻閂晒所有寫入）
[ ] 有 last-known-good + 唯讀降級
[ ] 管理員 UI 有「目前生效值 + 來源層」顯示（方便 debug）
[ ] 每個設定有一條測試（F14）
```

---

## 2. 隱藏超管（Hidden Super Admin）

### 2.1 定位

| 係 | 唔係 |
|----|------|
| **break-glass 工具**：平時唔存在，出事先用 | 唔係日常管理員帳號 |
| 一條 env-only credential + 一條固定端點 | 唔係 DB 入面一行 `role='super'` |
| 三樣權限：重設密碼／解鎖帳號／唯讀診斷 | 唔係「全能後門」 |
| 每次使用留痕 + 告警 | 唔係「唔好俾人知就安全」 |

> **隱藏係為咗 UX 同減低 attack surface，唔係安全本身。** 真安全 = crypto + env + 審計 + 輪換。

### 2.2 點樣「隱藏」

```
❌ 唔喺：選單、導航、用戶名冊、API list、Swagger、README、.env.example 嘅值、前端 bundle
✅ 只喺：Vercel env（SUPER_KEY）、server code 一行固定 URL、runbook（[11-incidents](11-incidents.md)）
```

- `SUPER_KEY` 唔會出現喺任何 API 回應、log、`config` dump。
- `/api/super` 唔列入 sitemap / OpenAPI / health check 回應。
- 缺 `SUPER_KEY` env 時：route 回 **404**（唔係 500，唔好洩漏存在）。
- 正常管理員（unit admin / 單位管理員）完全唔知有呢條路；佢哋用正常 UI 做日常管理。

### 2.3 登入鏈（對齊 VS／RS 實測做法）

```
① 持有者喺一個獨立、低調嘅入口（例如直接打 URL + 一次性啟動碼）產生 ticket
② ticket = AES-GCM( {sub:'super', unit, exp: now+60s, nonce, purpose} , key=SUPER_KEY )
③ GAS / 前端收到 login 帶 super_ticket
④ GAS 回打固定受信端點 SUPER_VERIFY_URL = https://<app>.vercel.app/api/super
⑤ /api/super 驗：解密 → 時窗 60s → nonce 一次性（防重放）→ 綁定單位
⑥ 驗過先發 token（帶 app 專屬標記），並寫 AUDIT_LOG
```

**要點**：
- `SUPER_KEY` 只喺 Vercel env；**GAS / Sheet 永遠收唔到密碼或 hash**。
- 票據一次性 + 60 秒；`nonce` 用 CacheService / KV 記錄 10 分鐘。
- 回打端點係 **server 常數**，唔可以由 request body 指定（A9）。
- 呢條係全系統**唯一**容許嘅「回打」；其他下游一律唔主動打上游。

### 2.4 權限白名單（只得三樣）

| action | 做乜 | 限制 |
|--------|------|------|
| `resetPassword` | 產生臨時碼 + `mustChangePw` | 只可以重設，唔可以讀舊密碼；`pv+1` 踢舊 session |
| `unlockAccount` | 清失敗計數 / 解鎖 | 記原因 |
| `readDiagnostics` | 唯讀 `{version,bytes,sizes,backendVersion,missingEnv}` | **唔含個人資料、唔含 hash、唔含 secret** |

**禁止**：批量匯出個人資料、改 audit、繞過 RLS、直接寫 DB、停用審計、開新超管。

### 2.5 每次使用留痕 + 告警

```json
{
  "ts":"2026-10-26T...", "actor":"SUPER", "via":"breakglass",
  "action":"resetPassword", "targetSub":"<hash>", "unit":"0082",
  "reason":"管理員離任交接", "ip":"...", "ticketNonce":"...",
  "prev_hash":"..."
}
```

- 寫入 append-only AUDIT_LOG（A13）＋ 即時告警（email / webhook）。
- 告警內容唔好帶 ticket 或 key，只帶「有人用咗超管 + 時間 + action」。
- 每月檢討：超管用過幾次？如果成日用 = 日常流程有問題，要修流程唔係修超管。

### 2.6 生命週期

| 時機 | 動作 |
|------|------|
| 建立 | 隨機 32+ 字元，只由一人產生，2FA 保護嘅密碼管理器保存 |
| 日常 | 唔好用；日常管理行正常 admin UI |
| 兩人規則 | 敏感動作（重設單位管理員密碼）要第二個人確認（out-of-band） |
| 每季 | rotate `SUPER_KEY` + 檢查 nonce store |
| 離任 | 持有人離任即 rotate + 查 AUDIT |
| 懷疑濫用 | [11-incidents.md#4-超管通道被濫用](11-incidents.md#4-超管通道被濫用) |

### 2.7 災難恢復配套（超管唔係唯一出路）

```
每個 leaf 至少一個本地領袖戶（下游閂口後仍可用）
+ SUPER（env-only）
+ 下游選單「🔓 開啟本機直接入口」（只作獨立／災難模式）
+ 最近一份 exportAll 備份（可 importAll 還原）
```

四樣都有，先至可以安心閂下游直接入口。

### 2.8 隱藏超管交付 checklist

```
[ ] SUPER_KEY 只喺 env；前端 bundle / Git / Sheet 全無
[ ] /api/super 固定 URL，唔喺任何選單／文件公開值
[ ] 缺 key → 404；錯誤回應統一（A17）
[ ] ticket 60s + AES-GCM + nonce 一次性 + 綁單位
[ ] 三權限白名單，其他 action 一律拒
[ ] 每次使用寫 AUDIT + 告警；告警唔帶 secret
[ ] 唯讀診斷唔含個人資料／hash／secret
[ ] 每季 rotate + 離任即 rotate + 兩人規則
[ ] 測過一次完整流程（用測試帳號），並喺 AUDIT 見到
[ ] DR 四件套齊（本地領袖 + SUPER + 開入口掣 + 備份）
```

---

## 3. 兩者點配合（一張圖）

```
                    ┌──────────── 設定層 getConfig() ────────────┐
管理者 UI ──改──▶  remote config（非 secret）──cache──▶ 所有元件
Vercel env ─────▶  secret（APIKEY / SUPER_KEY）──只由 server 讀
                    └──────────────────┬───────────────────────┘
                                       │ 全部改動
                                       ▼
                                  AUDIT_LOG（append-only + hash 鏈）

出事時：SUPER_KEY ──ticket──▶ /api/super ──▶ resetPassword / unlock / diagnostics
                                      └──▶ AUDIT + 告警
```

**一句總結**：設定層令系統「平時唔使改 code 就管到」；隱藏超管令系統「管理員自己出事時都救得返」；兩者都靠審計鏈兜底。

---

## 4. 可抄嘅碼

- Vercel `/api/super` 骨架：[templates/vercel/api/super.mjs](../templates/vercel/api/super.mjs)
- Vercel `/api/proxy` 骨架：[templates/vercel/api/proxy.mjs](../templates/vercel/api/proxy.mjs)
- GAS 設定／requireAuth 骨架：[templates/gas/Config.gs](../templates/gas/Config.gs)
- env 清單：[templates/vercel/env.example](../templates/vercel/env.example)
