# 26 — 「自製 API」到底可以點用（用你自己啲 repo 講清楚）

> 接 [25](25-reverse-api-reuse.md) 嘅盤點：上一份講「有乜可以用」，呢份講「究竟做緊乜」。
> 想直接郁手：[`templates/reverse-api-demo/`](../templates/reverse-api-demo/README.md)（`python3 example_usage.py` 已經喺本 sandbox 跑通過）。

---

## 1. 一句話，加一個比喻

**你唔係整一條新 API，你係幫一條「已經存在但冇文件」嘅 API 寫個 client。**

去餐廳食嘢：

| 角色 | 對應 |
|---|---|
| 餐牌／裝修 | 網頁 HTML、CSS |
| 你（顧客） | 瀏覽器 |
| 落單紙 | 瀏覽器打去後台嘅 HTTP request |
| 廚房 | 後台 JSON API |

舊做法（爬蟲）＝**讀餐牌上面印出嚟嘅字**去猜有乜菜；改咗排版就睇唔明。
自製 API ＝**直接攞張落單紙自己填**，繞過咗「印出嚟」嗰層。廚房換餐牌唔關你事，但廚房改菜單／唔認你張紙／要你出示會員證，你一樣要跟。

⚠️ 所以準確講法係「**少咗一層 DOM 依賴**」，唔係「永遠唔會壞」。

## 2. 三個「以前 → 而家」，全部係你 Git 入面嘅真嘢

### 案例 A：九龍城區通告（你已經做咗，2026-10-30）

| | 做法 |
|---|---|
| **以前** | 開 `https://www.klcscout.hk/circular`，等 JS 跑完，用 CSS selector `td` 刮表格；Chromium 有時 jQuery 未 ready，頁面照樣 HTTP 200，結果成個月「指紋相同」靜靜漏通告 |
| **而家** | 睇 inline JS 發現 `$.get('https://www.klcscout.hk/cportal/getdata.php')` → 直接 GET 呢條後台片段（`sources.json` `type: ajax_fragment`），失敗先 Playwright fallback；抽到 0 筆就保留舊指紋 + 記 `error_sources` |

如果當日有 `reverse-api-engineer`，佢只會慳到「由 F12 搵出 `getdata.php`」呢一步；**後面嗰堆 fallback／指紋／錯誤通報，工具唔會幫你寫**，而你一早寫好咗。呢個就係 [25](25-reverse-api-reuse.md) 話「整合，唔自建 client」嘅意思。

原始碼：[core.py `ajax_fragment`](https://github.com/playerkousas-rgb/scout-circulars/blob/main/core.py) · [sources.json 九龍城區](https://github.com/playerkousas-rgb/scout-circulars/blob/main/sources.json) · [回歸測試](https://github.com/playerkousas-rgb/scout-circulars/blob/main/test_klc_fragment_2026_10_30.py)

### 案例 B：營地天氣／交通（官方後台，唔使劫持）

`hkcamping` 個營地頁要顯示天氣同附近巴士站。佢唔係去 parse 天文台個網頁，而係直接 call：

```
https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc
https://static.data.gov.hk/td/routes-fares-geojson/JSON_BUS.json
```

`api` repo 嘅 [`data/apis.csv`](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) 就係呢類「一早搵好、實測過」嘅落單紙目錄（254 條，176 條唔使 key）。**呢個先係最應該用嘅做法**：有官方後台就唔使劫持私有 API。

### 案例 C：IKEA 搜尋（影片嗰個，未核實）

影片話瀏覽器搜 `desk` 時打咗兩支：

```
POST api.ingka.ikea.com/guest/token          → 攞短期 token
POST sik.search.blue.cdtapps.com/us/en/search → 帶 token + x-client-id 攞產品 JSON
```

如果真係咁，client 會長咁（**偽碼，兩條 endpoint 同「190 products」本 sandbox 無實錄 HAR 驗證**）：

```python
def search_products(q: str) -> list[dict]:
    token = _get_guest_token()                       # 第 1 支 request
    r = _post(SEARCH_URL, json={"q": q}, headers={  # 第 2 支 request
        "Authorization": "Bearer " + token,
        "x-client-id": CLIENT_ID,                   # ← 由 env 入，唔好寫死
    })
    return [normalise(p) for p in r["results"]]      # 標準化欄位
```

同 [`templates/reverse-api-demo/api_client.py`](../templates/reverse-api-demo/api_client.py) 嘅 `_get()` 比較：**結構一模一樣**，只係多咗一支 token、method 由 GET 變 POST、多兩個 header。呢個就係「想像唔到」嘅答案 —— 所謂自製 API，產出就係一個幾十行、返 JSON 嘅普通 function。

## 3. 究竟「用喺邊」？決策表

| 你想做 | 用唔用自製 API | 點做 |
|---|---|---|
| 攞香港政府／公開數據 | ❌ 唔使 | 查 [`api`](https://github.com/playerkousas-rgb/api) → 用官方 endpoint（案例 B） |
| 目標站有官方 API 但要 key | ❌ 唔使 | server-side inject（[`AvianDex/api/ebird.js`](https://github.com/playerkousas-rgb/AvianDex/blob/main/api/ebird.js)） |
| 目標站**冇**官方 API，但個頁用 AJAX 載資料 | ✅ 最值 | 抄 `ajax_fragment`：直接打後台片段 + fallback（案例 A） |
| 目標站係 SPA，資料全靠私有 JSON API | ✅ 值 | F12 錄 HAR → 拆四格 → client；但要補 token refresh、bot 偵測、ToS（案例 C） |
| 目標站資料係靜態 HTML／PDF | ❌ 唔值 | 直接抓 HTML／PDF（`MD`、`scout-circulars` 已有） |
| 目標站要登入先睇到 | ⚠️ 通常唔好 | 涉及 session／私隱／ToS；先問授權，唔好當技術問題 |
| 想每日自動同步 | ✅ 但要包殼 | client 只係最內層；外層要 rate limit、fail-closed、快照、audit（[25](25-reverse-api-reuse.md) §2–3） |

**一句判斷**：當你發現自己喺度寫 `soup.select('.product-card .title')`，就應該停低，開 F12 睇下嗰啲 title 究竟係邊支 JSON 送嚟。

## 4. 由零到一，七步（對應影片 3 步）

1. **寫低你要嘅資料**：例如「desk 搜尋結果嘅 name / price / url」，唔好講「攞晒 IKEA」。
2. **開 F12 → Network → Fetch/XHR**，做一次嗰個動作（搜尋 `desk`）。
3. **揀返 JSON 嗰支**，右鍵 `Copy as cURL`；要成個流量就 `Save all as HAR`。
4. **拆四格**：URL+method／headers／query 或 body／認證。填落 [`templates/reverse-api-demo/README.md`](../templates/reverse-api-demo/README.md) Step 1 張表。
5. **寫 client**：抄 [`api_client.py`](../templates/reverse-api-demo/api_client.py)，加 timeout、`Retry-After`、標準化欄位、**零筆即失敗**。
6. **跑一次**：`python3 example_usage.py`（本 sandbox 實跑輸出：repo 資料 + 檔案樹頭 12 條）。
7. **補殼先上線**：token 入 env、allowlist proxy、限速、`data` 分支快照、季度 endpoint audit、ToS 紀錄。

`reverse-api-engineer` 自動化嘅係 **第 2–5 步**；第 1、6、7 步同所有「壞咗點算」仍然要人做，而你 Git 入面已有第 7 步嘅全部零件。

## 5. 會壞嘅位（唔好被「改版都唔壞」呃到）

| 壞法 | 現成防線 |
|---|---|
| 私有 endpoint 改名／加欄位 | `whereami/docs/api-audit.md` 季度對照 + `build_facilities.py`「零記錄即 raise」 |
| token／`x-client-id` 失效、要 refresh | 將 token 取得寫成 client 第一支 call；過期就重取，唔好 cache 到永遠 |
| 429／403／bot 偵測 | `check_sources.py` 隨機 1.5–4.0 秒、`transit-poc.mjs` 退避 `[1000,3000,7000]` |
| 回傳空殼但 HTTP 200 | `core.process_source` 抽到 0 筆保留舊指紋 + `error_sources`（案例 A 嘅教訓） |
| 憑證寫入 Git | [A1](03-security.md)／[W6](12-copyright-scout-system.md)；[25](25-reverse-api-reuse.md) §6 有個真實 P0 例子 |
| 部署包被 Playwright 撐爆 | [S](01-slim.md)；`scout-circulars` 實測 driver 137MB，只放 CI runner |
| 每日 commit 可再生 JSON | [docs/20](20-repo-health-audit.md)／[21](21-fix-plans.md)：改 `data` 分支單一快照／30 日 artifact |

## 6. 對應返你哋嘅規矩

- **P1**：動手前先查 `api` + 寫「冇官方 API 實錄」（[`api/docs/wosm.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/wosm.md)）＋可行性表（[`hkcamping/TRANSPORT-API-FEASIBILITY.md`](https://github.com/playerkousas-rgb/hkcamping/blob/main/TRANSPORT-API-FEASIBILITY.md)）。
- **A／VL7**：`authorization`／`x-client-id` 一律 server-side；[EXTERNAL](../EXTERNAL.md)「外部系統零特權」。
- **F**：fail closed、白名單、零筆即失敗、dry-run。
- **V／W**：交付檔要雙版號 + © SCOUT SYSTEM；第三方素材標來源（W8）。
- **S**：client 用 stdlib／內建 `fetch`，唔好為咗一支 endpoint 加一套 SDK。
