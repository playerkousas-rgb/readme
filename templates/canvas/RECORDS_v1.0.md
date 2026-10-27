# 🗂️ RECORDS — 紀錄 schema（保護紀錄）
> 版本：v1.0 · © SCOUT SYSTEM · COPYRIGHT SCOUT SYSTEM

> 原本單一 HTML 會將紀錄放 `localStorage` — 可被改、可被清、無審計、換機即失。
> 腦殼分離之後：**所有重要紀錄落 Sheet，append-only + hash 鏈，client 無得改。**

## 1. Sheet：`RECORDS`（第一行為 header）

| 欄 | 名 | 內容 | 備註 |
|----|-----|------|------|
| A | `ts` | ISO 時間 | server `new Date().toISOString()`，唔信 client 時間 |
| B | `actorHash` | `sha256(email)` | 唔存 email 明文（A12） |
| C | `action` | action 名 | 由 `ACTIONS` 白名單嚟 |
| D | `payloadHash` | `sha256(JSON.stringify(payload))` | **唔存原文**，尤其用戶問 Gemini 嘅內容 |
| E | `resultCode` | `OK` / `AUTH_FAILED` / `BAD_INPUT` / … | 統一錯誤碼（F13） |
| F | `promptVersion` | `p1`、`p2`… | 對照 [PROMPT_v1.0.md](PROMPT_v1.0.md) |
| G | `prevHash` | 上一行 H 欄 | 第一行為空字串 |
| H | `hash` | `sha256(A..G 用 \| 串埋)` | 改任何一格會斷鏈 |

## 2. 寫入規則（C10）

- 只用 `appendRow()`；**`api()` 冇 update / delete 紀錄嘅 action**。
- 只有**非 read action** 留痕（`item.create`／`item.remove`／`gemini.ask`）；`config.get`／`item.list`／`record.list` 唔寫，避免噪音。
- 失敗請求（AUTH_FAILED／BAD_INPUT）**都要留低**，否則暴力試嘢無得查。
- `record.list` 只回傳 metadata（ts／action／resultCode／promptVersion／hash 頭 12 位），**唔回傳 payloadHash 原文以外嘅個人資料**。
- 每月驗 hash 鏈（[docs/10-checklists.md §5](../../docs/10-checklists.md)）。
- 保留 24 個月，之後由管理員人手／定時 purge（A13）；purge 動作本身要寫另一份 audit 摘要。

## 3. 用戶狀態放邊

| 資料 | 位置 | 點解 |
|------|------|------|
| 項目／進度 | ScriptProperties `STATE`（JSON） | server-side，多人共用，唔落 LocalStorage |
| 身份／角色 | ScriptProperties `USER_ROLES`（email → role） | server 驗，唔信前端 role（A6） |
| API key / config | ScriptProperties | A1，.env.example 只寫名 |
| 非敏感 UI 偏好 | 可以 LocalStorage | 例如排序、訂閱分類（[EXTERNAL.md](../../EXTERNAL.md)） |

> ScriptProperties 有配額（[S11](../../docs/01-slim.md)）：狀態太大就搬去 Sheet，DB 只存 pointer。

## 4. 逃生門

- `state.export` action 回傳 `{ json: ... }`（leader 先有），可以人手備份（F10/F11）。
- 正式版要加 `sha256` + `schemaVersion` 驗證先至可以 `state.import`（[docs/02-foolproof.md](../../docs/02-foolproof.md)）。

## 5. 對應測試

`brain.test.mjs` 會驗證：
```
[ ] 寫 action 有 appendRow
[ ] 每行有 promptVersion
[ ] prevHash = 上一行 hash（鏈冇斷）
[ ] 回應／HTML 唔含 SYSTEM_PROMPT 或 GEMINI_API_KEY
```
