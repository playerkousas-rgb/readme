# `v2/` — README 2.0 規格包（入口）

> **呢個資料夾係 2.0 嘅唯一真相**（根 `README.md` 講 1.0，凍結中，等 2.0 上線才改）。
> 對象：你（決策）＋ Agent（開工）。

---

## 1. 讀嘅次序（Agent 開工只讀 3 份）

| # | 檔案 | 幾時讀 | 你會得到 |
|:--:|---|---|---|
| 1 | [`00-OVERVIEW.md`](00-OVERVIEW.md) | 第一次 | 八層係乜、L0 四件、唔買網域嘅後果、一次上架點做 |
| 2 | [`03-CATALOG.md`](03-CATALOG.md) | 要知道「呢個 App 叫乜編號」 | 編號規則、合併表、待確認清單 |
| 3 | [`02-APP-SPEC.md`](02-APP-SPEC.md)＋[`apps/<slug>.md`](apps/) | 開工前 | 14 節模板、scope 對照、驗收清單 |

補充（有需要才讀）：
- [`01-DECISIONS.md`](01-DECISIONS.md)：13 條定案＋已否決 8 條＋後續已答覆（admin／跨支部／集會／BADGE）。**唔准再建議已否決嘅方案。**
- [`04-BUILD-ORDER.md`](04-BUILD-ORDER.md)：M0–M8 施工順序、每步驗收、上架 runbook。
- [`../docs/readme-2.0-inventory.csv`](../docs/readme-2.0-inventory.csv)：91 個 repo 逐個對照（可篩）。

---

## 2. 一頁現況（2026-11-26）

| 里程碑 | 狀態 | 下一步 |
|:--:|---|---|
| **M0 規格凍結** | ✅ 完成：五份核心文件＋4 份示範 spec | 本輪 4 項補充答案已記錄；可開始 M1 |
| M1 身份 | ⬜ | 下一步：按 `04-BUILD-ORDER` 開工 |
| M2 ADMIN | ⬜ | 卡 M1 |
| M3 通告 | ⬜ | 卡 M1 |
| M4–M6 生態＋工具 | ⬜ | 卡 M1／部分資料待確認 |
| M7 AI 定位 | ⬜ | 只需文件 |
| M8 營運＋上架 | ⬜ | 卡全部 |

**規模**：91 個 public repo → **約 70 個 App**（26 個 repo 合併成 9 個、1 個退役）＋ 2 個全新（身份核心、ADMIN）。

---

## 3. 已寫嘅 App 規劃書（示範）

| 檔案 | 編號 | 示範咩 |
|---|---|---|
| [`apps/store.md`](apps/store.md) | PLAT-01 | L0 殼＋硬閘＋目錄／自訂版面＋新表 |
| [`apps/identity.md`](apps/identity.md) | PLAT-02 | 高敏感度、後端判角色、1 部機、票、v1.1 遷移 |
| [`apps/admin.md`](apps/admin.md) | PLAT-03 | 後台／審計／最小權限／「未通知」隊列 |
| [`apps/book.md`](apps/book.md) | TRP-04 | **合併族示範**：4 repo → 1 App、`config` 差異、schema 對照 |
| [`apps/_template.md`](apps/_template.md) | — | 空白模板（結構唔准改） |

> 其餘 66 個 App **未有 spec**。按 [`04-BUILD-ORDER`](04-BUILD-ORDER.md) 逐個補，唔准邊做邊想。

---

## 4. 三條鐵律（貼喺最前，因為最易違反）

1. **一個 App 一層、一份 spec、一個編號。**
2. **App 只讀票上嘅 claims，唔准自己查 DB 判角色。**
3. **前端閘門唔等於安全邊界**；個人資料／權限／額度一定要後端驗。

---

## 5. 唔准做（違反即打回）

- ❌ 改根 `README.md`（等 2.0 上線一次過改）
- ❌ 建議已否決方案：自助註冊／Email OTP／Magic Link／Google 登入／邀請碼／買網域／通告公開／owner 2 部機／GEMINI 做入口／68 合 monolith／逐個 App 推 2.0／為改名而改 repo 名
- ❌ 未寫 `apps/<slug>.md` 就寫 code
- ❌ 冇 schema 對照就合併舊 repo
- ❌ 自創 App 編號或 scope
