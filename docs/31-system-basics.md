# 31 — 有身份系統嘅基本功能 ＋ ADMIN 回報系統

> **2026-11-02 補**。適用：[PLAYBOOK §0](../PLAYBOOK.md) 三分類嘅**第三類「系統（多層／有身份）」**，同 [28](28-repo-taxonomy.md) 嘅 18 個「後台／多層系統」；30 個「輕」工具、知識倉、資料管道**唔適用**。
> **呢份係通用底線，唔係專案案例**：具體團號／檔名／數值全部只係例子，案例隔離去 [19](19-ecportal-troop-case.md) 同 `BUILD.md`。
> 配套：[03 安全 A3–A5／A17](03-security.md) · [04 設定層＋隱藏超管](04-settings-super.md) · [10 §1 開新 app](10-checklists.md) · [27 起手包](27-repo-starter.md) · [30 L0 gate](30-repo-health-check.md)

---

## 1. 先答「有冇記低」

| 你問嘅 | 之前狀態 | 而家 |
|---|---|---|
| **忘記密碼等基本功能** | ⚠️ **有，但散**：[`BUILD.md §2`](../BUILD.md) 第 47 行（EMAIL 帳號一次性連結、用一次即廢、統一回應防枚舉）、[03 A5](03-security.md)（登入閘表）、[PLAYBOOK A17](../PLAYBOOK.md)（防枚舉）。**無一張開局 checklist，亦無寫入起手包** | 收埋做 §2 一張 8 格表 + [`docs/system-basics.md`](../templates/repo-starter/docs/system-basics.md) 可抄 tick list |
| **ADMIN 回報系統** | ❌ **完全無**：只有資料管道嘅 `error_sources`（[25](25-reverse-api-reuse.md)／[26](26-reverse-api-walkthrough.md)）同 [`GEMINI`](https://github.com/playerkousas-rgb/GEMINI) repo 自己嘅回報收件箱，**未升做通用底線** | §3 定義成**所有有身份系統都要有**嘅通用功能（你講得啱：呢個係通用） |

> **唔開新 A-ID**：全部掛返現有 `A3/A4/A5/A8/A12/A13/A17` + `VL7` + `A18`，避免要改 `PLAYBOOK`／`guard`／`templates` 四處同步（F16）而走雞。呢份係**驗收清單**，唔係新規則。

## 2. 帳號生命週期：8 樣基本功能（有身份系統硬性）

| # | 功能 | 最低要求 | 規則 | 常見走雞位 |
|:--:|---|---|---|---|
| 1 | 開戶／邀請 | 白名單／邀請 ticket；**唔好公開自助開管理員戶**；公開報名頁另按 A8 待批 | A6/A8/A18 | 任何人 `POST /api/users` 就變管理員 |
| 2 | 首次登入 | 臨時碼 ＋ `mustChangePw`；期間**只放行改密碼 API** | A5 | 臨時碼 `1234` 永遠唔使改 |
| 3 | 登入／登出 | HttpOnly Secure SameSite=Lax、exp ≤30min、`jti`、`pv`；登出 server-side 廢 session | A4/A5 | 只清前端 cookie，舊 token 仲用得 |
| 4 | 失敗鎖定 | 5 次失敗鎖 15 分鐘；解鎖要領袖／留 reason | A5 | 只喺前端數，refresh 就重置 |
| 5 | 改密碼 | 自己驗舊改新；任何改／重設 → `pv+1` 踢走所有舊 session | A3/A5 | 改完密碼舊機仲 login 住 |
| 6 | **忘記密碼** | **一次性連結、有時限、用一次即廢**；回應同「帳號唔存在」一模一樣、時序相近；唔好喺回應／URL 洩漏帳號是否存在；寄送失敗都唔好報錯 | A17/A12 | 「呢個電郵未登記」＝送俾人一份成員名冊 |
| 7 | 上級／SUPER 重設 | **只可重設，唔可讀舊密碼**；`mustChangePw` + `pv+1` + `AUDIT_LOG`（actor／reason／target hash） | A14/A13 | 超管變「改人密碼嘅後門」而無留痕 |
| 8 | 停用／離任／交接 | `setStatus`、撤 branch_access／override、ownership 轉名、rotate 受影響 key、按 A12 purge | A2/A12/A15 | 離任管理員隔半年仲入到去 |

> 密碼本身：`PBKDF2-SHA256 ≥100k` + per-user salt + timing-safe compare，hash 只存 server（[A3](03-security.md)）。**唔好自己發明 hash，唔好喺前端做授權判斷。**

**唔使加（除非 P1 比較後有需要）**：OAuth 第三方登入、MFA／SMS、密碼強度計、CAPTCHA、自助註冊審批流 —— 呢啲係成本同 attack surface，唔係「正常系統一定要有」。要加先做 [P1](../PLAYBOOK.md) 記錄同 [EXTERNAL](../EXTERNAL.md) 零特權評估。

## 3. ADMIN 回報系統（通用，唔只 `GEMINI`）

### 3.1 點解通用

任何有使用者、有 admin 嘅系統，都要有一條**由使用者去到管理員**嘅通道：壞連結、資料錯、疑似濫用、私隱投訴、功能建議。冇呢條通道，問題只會去 WhatsApp／口傳，admin 永遠唔知，亦無得計「幾多人中招」。**呢個同係咪有 Gemini Share Link 無關**，所以列做通用底線。

### 3.2 最小集合（8 格，逐格剔）

| # | 要有 | 最低要求 | 規則 |
|:--:|---|---|---|
| 1 | **回報入口** | 用戶／訪客撳到「回報」；揀**類別** + 補充文字（設上限，例 300 字）；帶 `source_page`／版號，方便追 | A11 |
| 2 | **ADMIN 收件箱** | 後台列表 + 查看 + 刪除；**只有 admin 睇到**，唔好回顯俾其他用戶 | A6/A10 |
| 3 | **狀態機** | `new → triaged → resolved → closed`，每次轉變記 actor + ts | A13 |
| 4 | **限流** | 每人／每 IP／每日上限（例 20 則）；爆額回統一訊息，唔好洩漏有冇收過 | A8/VL7/A17 |
| 5 | **保留期 + 清理** | 定一個期限（例 90 日）自動清；用**原子鎖每日一次**，唔好每筆寫入都跑清理；清理本身留一條 metadata | A12/S |
| 6 | **私隱** | 寫明收集乜、同意、保留期；**log 只記 metadata**（id／category／ts），唔記完整內容／email／電話；內容唔落入 `AUDIT_LOG` | A12/A13 |
| 7 | **通知／升級** | 新回報 → admin 通知；短時間大量同類 → 升級做 [11 incident](11-incidents.md)，唔好靜靜食咗 | F/VL7 |
| 8 | **唔逐筆燒 serverless** | 可以 DB／RPC 直連 + 按日聚合（點擊統計同理），避免 VL7 爆額度；要 network 就計成本 | VL7/S |

### 3.3 資料模型最小欄位

| 欄 | 用途 | 注意 |
|---|---|---|
| `id` | 冪等鍵 | 去重，防止重送變兩筆（F6） |
| `created_at` | 排序／保留期 | HKT 或 UTC 要寫明 |
| `category` | 路由 | 固定 enum，唔好收自由文字當分類 |
| `body` | 補充 | ≤300 字；**唔好收密碼／身份證／token**；前端提示 |
| `status` | §3.2 #3 | 只由 admin server-side 改（A6） |
| `source_page` / `app_version` | 追邊個版本出事 | 配合 [V 雙版號](13-versioning.md) |
| `actor_hash` | 限流／去重 | hash，**唔好存明文識別** |
| `retained_until` | 清理 | = `created_at + 保留期`，清理只 `WHERE retained_until < now()` |

### 3.4 收貨測試（人手實測，PREFLIGHT 驗唔到）

```
[ ] 匿名／登入用戶各提交一次 → admin 收件箱見到，一般用戶見唔到
[ ] 同一人第 21 則 → 被限流，回應同正常提交一致（A17）
[ ] 提交「<script>」／超長字 → 被消毒或拒，頁面無 XSS（A11）
[ ] admin 改狀態 → AUDIT_LOG 有 actor + ts + prev_hash
[ ] 將一筆嘅 created_at 改做 91 日前 → 每日清理一次清走，唔會清走 89 日嗰筆
[ ] 同時兩筆寫入 → 清理只執行一次（原子鎖），資料無重複
[ ] 回報內容冇出現喺任何 log／AUDIT_LOG／告警訊息（A12）
```

### 3.5 既有案例（只作參考，唔係新標準）

[`GEMINI`](https://github.com/playerkousas-rgb/GEMINI) 個 README 寫咗一套：類別 ＋ 最多 300 字、每日 20 則上限、90 日自動清理、每日首筆互動用 DB 原子鎖觸發一次清理、admin 收件箱可查看／刪除、統計同回報經 Supabase RPC 直連唔經 Vercel serverless。**呢啲數值係佢自己嘅選擇，未實測、未覆核**；§3.2 只借「要有邊幾格」，數值要按自己風險同 A12 定。

資料管道嗰邊嘅對應係 `error_sources`（[25](25-reverse-api-reuse.md)）：抽到 0 筆保留舊 fingerprint + 記低失敗來源，唔靜靜漏通告。**同一種思考，唔同層**：一個係「人去報」，一個係「機去報」。

## 4. 落到開局（邊度剔）

| 邊 | 加咗乜 |
|---|---|
| [10 §1.4 功能](10-checklists.md) | 兩格 tick：帳號生命週期 8 樣 ＋ ADMIN 回報系統 8 樣 |
| [`templates/repo-starter/docs/system-basics.md`](../templates/repo-starter/docs/system-basics.md) | 可抄 tick list（新 repo `docs/system-basics.md`） |
| [27 起手包](27-repo-starter.md) §2 | P1「系統」欄加呢兩份；`START.md` 列做**第 14 項（有身份系統先加）** |
| [30 §6 人手對](30-repo-health-check.md) | 兩格：基本功能實測、回報系統閉環 |

> ⚠️ **`preflight_v1.0.mjs`／`guard.mjs` 係靜態檢查，驗唔到呢啲功能有冇寫、能唔能跑**。呢份係**人手閘 + runtime 實測**，唔好見到 8/8 PASS 就當已完成（[30 §6](30-repo-health-check.md)）。

## 5. 邊啲唔適用

| 類型 | 點算 |
|---|---|
| 工具（stateless／單一 HTML） | ❌ 兩份都唔使；無身份、無後台、無儲存 |
| App（有資料但無登入） | ⚠️ 只需要一個**簡單聯絡／回報入口**（可指向 GitHub Issues），唔使 admin 收件箱、狀態機、限流；但要講清楚 issue 係公開定私人 |
| 知識／索引倉、資料管道、空殼 | ❌ 唔使；資料管道用 `error_sources` 就夠 |
| **系統（多層／有身份）** | ✅ §2 + §3 全部係硬性，同設定層／隱藏超管／registry／審計鏈一齊驗收 |

## 6. 對照現有規則（無新增 ID）

| 功能 | 掛邊 |
|---|---|
| 密碼 hash／登入閘／防枚舉 | [A3/A5/A17](03-security.md) |
| Session／`pv` | A4 |
| 匿名可寫面／限流／輸入消毒 | A8/A11 |
| 授權 server-side／RLS／最小權限 | A6/A10/A18 |
| 私隱同意／保留期／log 唔記 PII | A12 |
| 審計鏈／留痕 | A13 |
| 隱藏超管重設／災難恢復 | [A14/A15](04-settings-super.md) |
| 點擊統計／回報唔燒 function | [VL7](06-vercel.md) |
| 版號追溯 | [V](13-versioning.md) |
| 研發前比較、唔跟風加功能 | [P1](../PLAYBOOK.md) |

## 7. 未核實／限制

- 呢份係**要求清單**，本倉無 runtime、無資料庫、無寄信服務；所有數值（300 字／20 則／90 日／5 次 15 分鐘／30 分鐘 session）係既有規則或個別案例嘅數，**唔係新訂通用標準**，要按自己風險重定並寫入 `SCOPE.md`。
- `GEMINI` 嘅回報系統只讀過 README，**未 clone 實測、未驗 Supabase RPC／原子鎖行為**。
- 寄送一次性連結涉及第三方郵件服務：ToS、rate limit、PDPO、費用要另外核（[EXTERNAL](../EXTERNAL.md)／[P1](../PLAYBOOK.md)），唔好當「正常系統」就順手接。
- 「回報系統」唔等於 GitHub Issues；用 Issues 做後備時要寫明**公開 vs 私人**，同埋邊個負責 triage。
