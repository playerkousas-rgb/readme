# {{REPO_NAME}} — Architecture Map

> **D1 — 設計地圖（本 App 的設計意圖入口）**：由設計者／負責 Agent 根據已確認的需求直接繪製，讓之後接手的 Agent 先看懂本 App 邊界、元件、資料流與依賴，再開始改 code。這是本 App 的設計來源，不是由 Graphify 或其他工具反推而成。每次架構變更同步更新；不要只留在對話。
> 最後核對：{{DATE}} · 對應 commit：{{COMMIT_OR_UNCOMMITTED}}

## 1. 一句定位與邊界

- **目的**：{{APP_PURPOSE}}
- **包含**：{{IN_SCOPE}}
- **不包含**：{{OUT_OF_SCOPE}}

## 2. 本 App 地圖

> 用 Mermaid、ASCII、圖片或其他清楚易讀方式。每個方塊寫元件／責任，箭頭標資料或控制方向。純前端小工具亦要畫出「使用者 → UI → 本機處理 → 輸出」等實際路徑；沒有後端／外部服務就明寫「無」，不要留空。

```mermaid
flowchart LR
  User[使用者] --> UI[前端／入口：{{UI_OR_ENTRY}}]
  UI --> Logic[核心流程／責任：{{CORE_LOGIC}}]
  Logic --> Data[資料源／儲存：{{DATA_SOURCE_OR_NONE}}]
  Logic --> External[外部服務：{{EXTERNAL_SERVICE_OR_NONE}}]
```

## 3. 元件與資料責任

| 元件／服務 | 責任（做乜／唔做乜） | 資料 owner／source of truth | 讀取／寫入對象 | 程式位置 |
|---|---|---|---|---|
| {{COMPONENT}} | {{RESPONSIBILITY}} | {{OWNER_OR_NONE}} | {{READ_WRITE}} | {{PATH}} |

## 4. 關鍵流程

按實際產品列出最重要流程（例如登入／讀取／新增或更新資料／匯出／跨 App 跳轉）。每個流程寫明起點、經過的元件、資料讀寫及成功／失敗結果；不適用時寫「無」及原因。

1. **{{FLOW_NAME}}**：{{START}} → {{STEPS}} → {{RESULT_OR_FAILURE}}。

## 5. 身份、權限與信任邊界

- **身份來源／角色**：{{IDENTITY_AND_ROLES_OR_NONE}}
- **Secret／權限邊界**：{{SERVER_CLIENT_EXTERNAL_BOUNDARIES_OR_NONE}}
- **不可跨越的資料／系統邊界**：{{TRUST_BOUNDARIES_OR_NONE}}

## 6. 跨 App／外部依賴

| 對象 | 關係／用途 | 本 App 可做乜 | 不可做乜／故障處理 | 官方入口／合約 |
|---|---|---|---|---|
| {{DEPENDENCY_OR_NONE}} | {{RELATION}} | {{ALLOWED}} | {{FORBIDDEN_AND_FAILURE}} | {{URL_OR_CONTRACT}} |

## 7. 已確認決策與待確認項

- **已確認的重要設計決策**：{{DECISIONS_OR_ADR_LINKS}}
- **未知／待用戶確認**：{{OPEN_QUESTIONS_OR_NONE}}

> 未知項目要標「待確認」並指出影響；不得由 Agent 猜成既定架構。若改動會跨越本圖的邊界，先更新地圖／SCOPE，並取得需要的用戶決定。
