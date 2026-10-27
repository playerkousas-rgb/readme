# templates/canvas/ — Type C 腦殼分離骨架（GS 腦 ＋ HTML 殼）
> 檔名版號：v1.0 · © SCOUT SYSTEM · COPYRIGHT SCOUT SYSTEM

> **定義**：原本 Gemini（Canvas）生嘅一個 HTML，拆做 **`brain_v1.0.gs`**（腦：prompt／規則／紀錄／key，server-side）＋ **`shell_v1.0.html`**（殼：UI only）。
> 用途：**記錄上傳原圖／成品圖／使用紀錄 + 保護 PROMPT 設定**。
> 詳細：[docs/09-gemini-canvas.md](../../docs/09-gemini-canvas.md)（C6–C10）· [W 系列](../../docs/12-copyright-scout-system.md) · [V 系列](../../docs/13-versioning.md)

## 檔案對照（**版本化源檔係唯一真理**）

| 檔 | 角色 | 去邊 |
|----|------|------|
| [brain_v1.0.gs](brain_v1.0.gs) | 🧠 腦源檔：`SYSTEM_PROMPT`、`ACTIONS` 白名單、`RULES`、`appendRecord()`、`api()`、`doGet()` | Git（唯一真理） |
| [shell_v1.0.html](shell_v1.0.html) | 🎨 殼源檔：UI + `google.script.run.api()`；有 meta app-version + 版權頁尾 | Git（唯一真理） |
| [Code.gs](Code.gs) | 部署拷貝（GENERATED from brain_v1.0.gs） | 貼入 Apps Script |
| [index.html](index.html) | 部署拷貝（GENERATED from shell_v1.0.html） | Apps Script HTML file，名必須 `index` |
| [sync_canvas_v1.0.mjs](sync_canvas_v1.0.mjs) | 由源檔產生部署拷貝 + 驗版號一致（V4） | 本機 / CI |
| [contract_v1.0.json](contract_v1.0.json) | 📜 action 白名單規格（`fileVersion` + `copyright`） | Git |
| [PROMPT_v1.0.md](PROMPT_v1.0.md) | 🔒 prompt 內容 + Prompt 版本 p1 + 檔名版號 | Git（**唔好貼入 Canvas 對話**） |
| [RECORDS_v1.0.md](RECORDS_v1.0.md) | 🗂️ 紀錄 schema（原圖／成品圖／使用紀錄 + hash 鏈） | Git + Sheet `RECORDS` |
| [PROMPTS_v1.0.md](PROMPTS_v1.0.md) | 💬 7 條可貼去 Gemini Canvas 嘅 prompt | 對話用 |
| [brain.test.mjs](brain.test.mjs) | ✅ 16 條守護測試（含 W1/W6/V1/V4/V5） | Git + CI |

## 三步起機

```bash
# 1) 本機驗腦 + 產生部署拷貝（零 dependency）
node templates/canvas/sync_canvas_v1.0.mjs
node --test templates/canvas/brain.test.mjs        # 全綠

# 2) Apps Script
#    - 新開 Sheet，改名叫 RECORDS，第一行寫 header（見 RECORDS_v1.0.md）
#    - 貼 Code.gs → 新增 HTML file「index」→ 貼 index.html
#    - ScriptProperties 設 GEMINI_API_KEY、USER_ROLES（見 RECORDS_v1.0.md §3）
#    - 部署 → Web App（執行身分「我」、存取權「任何人」）→ 抄 /exec URL

# 3) 改 UI
#    - 用 PROMPTS_v1.0.md ①「生殼」prompt 叫 Gemini Canvas 改 shell_v1.0.html
#    - 明確講「brain_v1.0.gs 唔准改」
#    - 跑 sync_canvas_v1.0.mjs → 測試 → 貼返入 Apps Script → 管理部署選「新版本」
```

> ⚠️ **身份陷阱**：Web App「任何人」存取時 `Session.getActiveUser().getEmail()` 對匿名訪客通常係空白。
> `USER_ROLES` 只係骨架示範；正式系統要用邀請 ticket／`sig` scope／中央登入驗票（[A4/A7](../../docs/03-security.md)）。

## 鐵則

```
✅ prompt / key / 規則 / 紀錄 → brain_v1.0.gs + RECORDS Sheet + ScriptProperties
✅ 原圖 / 成品圖 → 私有 Drive／Storage，只記 sha256 + fileId（W5）
✅ 所有 client 請求 → google.script.run.api(action, payload) 唯一入口
✅ 只有 api() 同 doGet() 係 public function
✅ 頁尾有 © SCOUT SYSTEM + v1.0（W1/V2）
❌ 唔好用 <?= SYSTEM_PROMPT ?> 注入 HTML
❌ 唔好喺 HTML fetch 外部 API 或者用 localStorage 做唯一紀錄
❌ 唔好直接改 Code.gs / index.html（改源檔再 sync）
❌ 唔好將 brain_v1.0.gs 交俾 Canvas 重新生成
```

## 版號 / 同步（V3 五步）

改任何一個檔就要：
1. 改檔名 `_v1.0` → `_v1.1`
2. 改內文**全部** `v1.0` → `v1.1`（meta / title / 註解 / `APP_VERSION` / 頁尾 / `fileVersion`）
3. 改 `sync_canvas_v1.0.mjs` 嘅 `VERSION` + 測試期望值 + `contract` `fileVersion`
4. 跑 `node templates/canvas/sync_canvas_v1.0.mjs` + `node --test templates/canvas/brain.test.mjs`
5. 更新 [docs/13-versioning.md](../../docs/13-versioning.md) 版本登記表 + `node scripts/guard.mjs`

改 prompt 另外要四處同步（F16）：
`PROMPT_vX.Y.md` → `brain_vX.Y.gs`（`SYSTEM_PROMPT` + `PROMPT_VERSION`）→ `contract_vX.Y.json` → `brain.test.mjs`。
