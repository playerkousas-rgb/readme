# 5 分鐘示範：咩叫「自製 API」

> 對應 [docs/26](../../docs/26-reverse-api-walkthrough.md) · 零依賴 · 可以直接跑
> `cd templates/reverse-api-demo && python3 example_usage.py`

## 呢度有乜

| 檔 | 對應影片／工具入面嘅 | 實際係 |
|---|---|---|
| `api_client.py` | RAE 生成嘅 `api_client.py` | 人手寫、stdlib-only、兩支 function |
| `example_usage.py` | RAE 生成嘅 `example_usage.py` | 跑一次睇輸出 |
| 本 README | RAE 生成嘅 `README.md` | 由「點搵」到「點寫」嘅步驟 |

**講明先**：呢個 demo 用 GitHub **官方** API 做替身，因為本 sandbox 出站只准 `github.com`／`api.github.com`／`pypi.org`／`registry.npmjs.org`。真正「劫持官網私有 API」時，下面每一步都一樣，只係 endpoint 冇文件、要靠 HAR 自己搵，而且可能要 `Authorization`／`x-client-id`／guest token。

## Step 0 — 先有個心智模型

```
你開網頁  ──►  瀏覽器幫你打幾十支 request  ──►  後台回 JSON  ──►  JS 砌成畫面
                        ▲
                        └── 「自製 API」就係將其中一支抄返出嚟，自己打
```

你唔係發明新 API，係**幫一個已有但冇文件嘅 API 補返個 client**。

## Step 1 — F12 睇瀏覽器做緊乜（對應「錄 HAR」）

1. 開 `https://github.com/playerkousas-rgb/readme`（或任何目標頁）
2. F12 → **Network** → Filter 揀 **Fetch/XHR**
3. 撳重新整理，揀一支 **回傳 JSON** 嘅 request
4. 右鍵 → **Copy → Copy as cURL**（Chrome）／**Save all as HAR**（要成個流量）
5. 貼落文字檔，淨係抽出四格：

| 格 | 例子 | 點用 |
|---|---|---|
| `URL` + method | `GET https://api.github.com/repos/…` | `BASE` + `path` |
| `headers` | `Accept: application/vnd.github+json`、`User-Agent`、`X-GitHub-Api-Version` | `Request(headers=…)` |
| `query / body` | `?recursive=1` | `urlencode(params)` |
| 認證 | `Authorization: Bearer …` | **只放 server env，唔入 Git** |

## Step 2 — 變成兩支 function

`api_client.py` 入面 `_get()` 做晒上面四格；`repo_info()`／`list_files()` 就係你要嘅「API」。
睇下 `example_usage.py`，呼叫端只係 `repo_info("playerkousas-rgb", "readme")`，**唔使知網頁 HTML 長乜樣**。

## Step 3 — 換目標站要改幾多？

只改 `api_client.py` 兩格：`BASE` 同 `headers`。`example_usage.py` 同所有下游程式唔使改。
呢個就係「IKEA 改版頁面，程式照跑」嘅真正意思：**少咗 DOM 呢層依賴**，但私有 API 自己改版／換 token／加 bot 偵測一樣會壞（見 docs/26 §5）。

## Step 4 — 上 production 前補四樣（你哋 repo 已有範本）

| 要補 | 現成範本 |
|---|---|
| token 收喺 server | `AvianDex/api/ebird.js` 嘅 env inject |
| allowlist + fail-closed | `scout-circulars/api/pdf_proxy.py` |
| 限速／退避／健康檢查 | `scout-circulars/check_sources.py`、`hkcamping/scripts/transit-poc.mjs` |
| endpoint 改版監察 | `whereami/docs/api-audit.md` |

## 唔好做

- 唔好將 HAR 入面嘅 `Authorization`／cookie／`x-client-id` 直接 commit（[W6](../../docs/12-copyright-scout-system.md)）。
- 唔好無限咁跑：加 `User-Agent`、`Retry-After` 退避、cache、尊重 ToS／robots.txt。
- 唔好假設 JSON schema 唔會變：要有「零筆即失敗」同每季 audit。
