# SCOPE — {{REPO_NAME}} 做乜 / 唔做乜

> 借自 [mattpocock/skills 嘅 SCOPE.md](https://github.com/mattpocock/skills/blob/main/SCOPE.md)：一個 repo 要有條「bar」，先至唔會乜都塞入嚟。

## 收貨條件（兩條都要過）

1. **真實失敗／真實需要**：講清楚邊次實測、邊個工作流程出問題、預期係乜。「如果可以咁就好」唔算。
2. **合乎定位**：唔係一個人嘅 workflow 偏好、唔係為咗某個 agent harness 加分支；呢啲放自己嘅 `AGENTS.md` 或 fork。

## 本 repo 範圍

| 做 | 唔做 |
|---|---|
| {{IN_SCOPE_1}} | {{OUT_OF_SCOPE_1}} |
| {{IN_SCOPE_2}} | {{OUT_OF_SCOPE_2}} |

## 已拒絕（一個概念一個檔）

拒絕過嘅嘢放 [docs/out-of-scope/](docs/out-of-scope/README.md)，寫低「點解唔做 + 日期 + 出處」，免得半年後有人再提多次。提新嘢之前先讀。

## 分類（新嘢放邊）

| 狀態 | 放邊 | 會唔會出現在 README／CI |
|---|---|---|
| 已採用 | 主目錄 | ✅ 要 |
| 測試中 | `in-progress/` | ❌ 唔好 |
| 凍結 | `misc/` | ❌ 唔好 |
| 棄用 | `deprecated/` | ❌ 唔好，但要留返連結 |

> 呢套「bucket」分類法直接對應 Skills／模板／工具嘅收納，詳情見 [docs/29](https://github.com/playerkousas-rgb/readme/blob/main/docs/29-reading-map.md)。

## 判斷唔到

資料唔足 → 一輪提問 + `needs-info` 標籤；{{N}} 日無回覆就 close，唔好晾住。
