# 25 — 自有 Git 項目對「Reverse API／私有 API」嘅可重用盤點

> **研發前調查 P1 記錄**（[PLAYBOOK P1](../PLAYBOOK.md#0-開工前三分類決定做幾多) · [docs/24](24-similar-products.md) 後續）
> 調查日期：**2026-11-02（HKT）** ｜ 範圍：`playerkousas-rgb` **85 個 public repo** ｜ 性質：**檔案／文件盤點，唔係功能實測**
>
> **2026-11-06 補註**：本頁保留當日版本／ repo 盤點；上游而家支援嘅 SDK／輸出語言、HAR 私隱同「改版唔會壞」修正，以 [34 §3](34-ai-workflow-tools.md) 嘅新查證入口為準。呢輪仍冇執行逆向或驗證影片嘅 IKEA 案例。

---

## 0. 一句話結論

**有，而且你已經喺度做緊同一招，只係冇叫佢做 Reverse API。** `scout-circulars` 由 2026-10-30 起就係直接打網站自己嘅後台 endpoint（`getdata.php`）攞資料，唔再 render 個頁；另外有 `contentful_api`、`wordpress_api` 兩類 JSON API client、`api_headers`／`api_params` 設定層、fingerprint／fallback／`error_sources` 防呆。

**全 Git 冇嘅係最上面嗰層**：錄 HAR → AI 讀流量 → 自動生成 typed client。所以 `reverse-api-engineer` 嘅價值係**一次性偵察（搵 endpoint、headers、token flow）**，而唔係將佢生成嘅 `api_client.py` 直接當交付；真正上 production 應該重用自己現有嘅 scrape／proxy／fail-closed／audit 骨架。

---

## 1. P1 記錄：點查、查咗乜、有咩限制

| 項目 | 內容 |
|---|---|
| 日期 | 2026-11-02 |
| 對象 | 自己現有方案（85 個 public repo）＋ 上輪已核實嘅外部工具 `kalil0321/reverse-api-engineer` |
| 方法 | `gh api user/repos`（攞晒 repo／語言／更新日）、`git/trees/<branch>?recursive=1` 逐個攞完整檔案樹、`search/code?q=…+user:playerkousas-rgb`、`contents` raw 讀取選定檔案內容 |
| 關鍵字 | `HAR`、`.har`、`record_har`、`har_path`、`Copy as cURL`、`curlconverter`、`x-client-id`、`api.ingka`、`cdtapps`、`ajax_fragment`、`getdata.php`、`playwright`、`scrape`、`requests.get`、`非官方` |
| 已讀檔案 | 34 份橫跨 `scout-circulars`／`api`／`hkcamping`／`whereami`／`AvianDex`／`skw-birdex2`／`birddex3`／`forward`／`answer`／`MD`／`HM20C`／`scoutworld`／`scoutbadge` |
| 限制 | ① 只查到 public repo（account `public_repos=85`），**private repo 不在範圍**；② `rs_portal`／`gh_portal`／`cubs_portal`／`sc_portal` 四個 tree API 404（空 repo）；③ GitHub code search 係索引結果，可能滯後；④ 本 sandbox 出站只通 `github.com`／`pypi.org`／`registry.npmjs.org`，**冇實際打過 IKEA、scout.org.hk 或任何第三方 endpoint**，全部結論嚟自 repo 內檔案；⑤ 冇安裝／執行 `reverse-api-engineer 0.14.0`，只核實過 GitHub／PyPI／npm 上嘅 metadata 同 README |

---

## 2. 可以直接 reuse 嘅 code（唔使重新寫）

| 優先 | Repo／檔 | 佢其實係乜 | 點接入 Reverse API 場景 |
|:--:|---|---|---|
| ★★★ | [`scout-circulars/core.py`](https://github.com/playerkousas-rgb/scout-circulars/blob/main/core.py) ＋ [`sources.json`](https://github.com/playerkousas-rgb/scout-circulars/blob/main/sources.json) | **活生生嘅 reverse API 案例**：2026-10-30 發現九龍城區 `/circular` 只係空殼，表格由 inline `$.get('https://www.klcscout.hk/cportal/getdata.php')` 注入，於是新增 `type: ajax_fragment` 直接 GET 後台片段，失敗先 fall through Playwright；抽到 0 筆會保留舊 fingerprint + 記入 `error_sources`（唔再「靜靜咁漏通告」） | 呢個就係「接後台唔接畫面」嘅最小實作。`sources.json` 嘅 `fragment_url`／`api_url`／`api_headers`／`api_params` 已經係一層 **config-driven client**，新目標站加一個 source entry 就用到；回歸測試 [`test_klc_fragment_2026_10_30.py`](https://github.com/playerkousas-rgb/scout-circulars/blob/main/test_klc_fragment_2026_10_30.py) 可直接抄 |
| ★★★ | `core.py` 嘅 `contentful_api`／`wordpress_api` 分支 | 直接 `requests.get(api_url, params=…, headers=…)` 食 JSON，再轉成內部 HTML／資產格式；`wordpress_api` 有分頁、403/429/5xx 退避重試（`2.0*attempt + random`）、`verify_ssl`／timeout 設定 | 對應 RAE 生成嘅 `search_products()`：與其用生成 code，不如用呢套已有嘅「打 JSON endpoint → 標準化欄位 → fail-closed」骨架。`sources.json` 入面 4 個 `wordpress_api` + 1 個 `contentful_api` 係現成範例 |
| ★★ | [`scout-circulars/check_sources.py`](https://github.com/playerkousas-rgb/scout-circulars/blob/main/check_sources.py) | 逐來源健康檢查：`OK`／`EMPTY`／`FETCH_FAIL`／`PW_ONLY`，**順序跑 + 來源之間 random 1.5–4.0 秒**（檔頭寫明 5/23 試過連環全量抓被封） | 私有 API 最怕「無聲咁壞」；呢支就係現成嘅 drift／health monitor，亦係 rate limit 嘅實際範本 |
| ★★ | [`scout-circulars/api/pdf_proxy.py`](https://github.com/playerkousas-rgb/scout-circulars/blob/main/api/pdf_proxy.py) | stdlib-only byte bridge：`u` 必須喺 live `cache.json` 白名單、4MB 上限、`%PDF` magic check、fail closed、edge cache 一星期 | 如果 generated client 要由前端行，唔好直接暴露 `authorization`／`x-client-id`；改用呢個 allowlist proxy 形狀（再加 session 驗證，見 [EXTERNAL §3](../EXTERNAL.md)） |
| ★★ | [`AvianDex/api/ebird.js`](https://github.com/playerkousas-rgb/AvianDex/blob/main/api/ebird.js) | Vercel function：`EBIRD_API_KEY` 留 server、`X-eBirdApiToken` header 先至 inject、`Cache-Control: s-maxage=300`、標準化欄位、零第三方依賴 | **直接對應**「token／x-client-id 點收」嘅合規做法（[A1](03-security.md)／[VL](06-vercel.md)）。RAE 生成嘅 client 應該包喺呢層後面 |
| ★ | [`api/examples/python-example.py`](https://github.com/playerkousas-rgb/api/blob/main/examples/python-example.py)、[`birddex3/scripts/fetch_reference_data.py`](https://github.com/playerkousas-rgb/birddex3/blob/main/scripts/fetch_reference_data.py) | urllib + `User-Agent` + timeout 嘅極簡 client／CSV taxonomy 下載 | 比 RAE 生成嘅 `api_client.py` 更貼你哋嘅 **S 瘦身／零依賴** 規矩，可當 generated client 嘅「瘦身版」對照 |
| ★ | [`forward/tools/crawl_emails.py`](https://github.com/playerkousas-rgb/forward/blob/main/tools/crawl_emails.py) ＋ [`data/sources.json`](https://github.com/playerkousas-rgb/forward/blob/main/data/sources.json) | 來源登記 → UA → 抓取 → 結果 JSON，另有 [`tools/optional/api-send.js`](https://github.com/playerkousas-rgb/forward/blob/main/tools/optional/api-send.js) 每 IP 每小時 10 次 rate limit | 手動「F12 → Copy as cURL」路線嘅現成簡化版；**但** 佢 `ThreadPoolExecutor(max_workers=10)` 無延遲，同 `check_sources.py` 嘅防封標準相反，抄之前要改（見 §6） |

---

## 3. 可以當模板／決策依據用嘅文件

| Repo／檔 | 點解有用 |
|---|---|
| [`api/README.md`](https://github.com/playerkousas-rgb/api/blob/main/README.md) ＋ [`data/apis.csv`](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) | **254 條**已分類 API，機讀 CSV 有 `auth`／`hk_status`／`verified`／`note`：176 條唔使 key、61 條免費 key、標埋封港／限流／死 link。**第一步應該先查呢度**，有官方／公開 API 就唔好劫持私有 API。CSV 自己已寫「Yahoo Finance非官方…非官方隨時變 咪做核心依賴」——即係你哋一早有反對 unofficial API 嘅政策 |
| [`api/docs/wosm.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/wosm.md) | 「⛔ 冇官方 API」嘅**實錄格式**：逐條途徑實測（jsonapi 404／RSS 200／sitemap／Wikidata）＋ 四條替代路 ＋ 「尊重 robots.txt、斯文咁 crawl」。正式決定要劫持之前，應該先出一份同款「已查過冇官方 API」紀錄 |
| [`hkcamping/TRANSPORT-API-FEASIBILITY.md`](https://github.com/playerkousas-rgb/hkcamping/blob/main/TRANSPORT-API-FEASIBILITY.md) | **最完整嘅可行性測試模板**：逐端點 smoke test、有冇 key、ToS／署理權、429／數值化配額、瀏覽器 CORS、GitHub Actions 能唔能提供所需新鮮度、最後明確「靜態接入 ✅／即時 ETA ❌」。上一輪我提過嘅「私有 API 會唔會改、限流、bot 偵測」全部有位填 |
| [`hkcamping/AUTOMATION.md`](https://github.com/playerkousas-rgb/hkcamping/blob/main/AUTOMATION.md) | 原則：「官方來源係唯一事實依據；`api` repo 只供搵線索」、fail-closed、保留最後有效資料 + 顯示過期、**唔接受人工覆核當自動化**。直接可以套落私有 API 資料管道 |
| [`hkcamping/scripts/transit-poc.mjs`](https://github.com/playerkousas-rgb/hkcamping/blob/main/scripts/transit-poc.mjs) ＋ [`.github/workflows/transit-poc.yml`](https://github.com/playerkousas-rgb/hkcamping/blob/main/.github/workflows/transit-poc.yml) | 可抄嘅 production wrapper：UA、`RETRY_DELAYS_MS=[1000,3000,7000]`、`429`/5xx 先重試、160MB 下載上限、BOM 處理、JSON/schema 驗證、`# … failed closed` 診斷、30 日 artifact、只 commit 精簡快照 |
| [`whereami/docs/api-audit.md`](https://github.com/playerkousas-rgb/whereami/blob/main/docs/api-audit.md) | **Endpoint drift 監察**：逐部門對照現用入口 vs 新一代 API、即時 `returnCountOnly` 驗筆數、建議每季重跑；[`scripts/build_facilities.py`](https://github.com/playerkousas-rgb/whereami/blob/main/scripts/build_facilities.py) 有「零記錄即 `raise`」閘門。正正補足上一輪講「私有 API 改版一樣會壞」嘅弱點 |
| [`answer/skill/hk-scout-kb/SKILL.md`](https://github.com/playerkousas-rgb/answer/blob/main/skill/hk-scout-kb/SKILL.md) | 你哋已有 **Skill 打包慣例**（frontmatter：name／description／license／compatibility／metadata／disclaimer）。`npx skills add kalil0321/reverse-api-engineer` 唔係新概念；佢入面「三條實測事實 + 只用官方現行版 + sha256 分辨」亦係 source-of-truth 驗證範本 |
| [`MD/.github/workflows/scout-pdf-fetch.yml`](https://github.com/playerkousas-rgb/MD/blob/main/.github/workflows/scout-pdf-fetch.yml) | 由官方站抓原始文件嘅既有 workflow，屬「有官方來源就直接用」嘅實作例 |
| 本 repo：[P1](../PLAYBOOK.md#0-開工前三分類決定做幾多)／[24](24-similar-products.md)／[06 VL7](06-vercel.md)／[03 A12](03-security.md)／[EXTERNAL](../EXTERNAL.md)／[20](20-repo-health-audit.md)／[21](21-fix-plans.md)／[22](22-scout-circulars-agent-handoff.md) | P1 記錄格式、rate limit、私隱、「外部系統零特權」、同 **「可再生 scrape 資料唔好每日 commit 入 git history」** 嘅教訓（改用 `data` 分支單一快照／artifact） |

---

## 4. 全 Git 搵唔到（即係 RAE 先至補到嘅位）

GitHub code search 喺 `user:playerkousas-rgb` 下：`record_har` **0**、`har_path` **0**、`Copy as cURL` **0**、`curlconverter` **0**、`x-client-id` **0**、`api.ingka` **0**、`cdtapps` **0**；`".har"` 嘅 10 個 hit 全部係 `share`／`charset` 之類嘅子串誤中，**冇一份真 HAR 檔、冇網絡流量錄製**。

- Playwright 喺 `HM20C`／`card`／`doll`／`upgrade`／`scout-circulars` 都有，但用途係 **render／smoke test／截圖**，唔係 intercept network traffic。
- 冇 `guest/token` 嗰類 **token 取得＋refresh** 流程，冇 bot-detection 應對，冇「HAR → LLM → typed client」嘅 codegen。
- 冇任何 repo 提過 IKEA／`sik.search.blue.cdtapps.com`／`api.ingka.ikea.com`。上一段影片講嘅兩條 endpoint 同「190 products」**仍然未核實**。

---

## 5. 建議決策（P1 要寫明採用／整合／自建）

1. **先查官方**：目標網站先對照 [`api/data/apis.csv`](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) 同官方條款；有公開 API／官方 feed → **採用**，唔好劫持。
2. **冇官方 API 先留紀錄**：用 [`api/docs/wosm.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/wosm.md) 格式寫「冇 API 實錄」，再用 [`hkcamping/TRANSPORT-API-FEASIBILITY.md`](https://github.com/playerkousas-rgb/hkcamping/blob/main/TRANSPORT-API-FEASIBILITY.md) 表格逐項填 auth／ToS／rate limit／CORS／bot 偵測／更新頻率／fail-closed，先至決定做唔做。
3. **整合，唔自建 client**：`reverse-api-engineer` 只用作一次性偵察（搵 endpoint、headers、token flow、10 種語言輸出參考）；生成品唔直接上線。真正嘅 client 用 `scout-circulars` 嘅 `ajax_fragment`／`contentful_api` 設定層 + `AvianDex/api/ebird.js` server-side key injection + `pdf_proxy.py` allowlist + `check_sources.py` 限速健康檢查 + `whereami` 季度 drift audit。
4. **資料落地跟現有教訓**：`data` 分支單一快照／30 日 artifact，唔好每日 commit 可再生 JSON（[docs/20](20-repo-health-audit.md)／[21](21-fix-plans.md)）；交付前照跑 `node scripts/guard.mjs` 同 `node scripts/final_check_v1.0.mjs --json`。

---

## 6. 順手發現嘅紅旗（建議另外開 issue 跟進）

- **P0｜公開 repo 有硬編碼憑證**：`scout-circulars/sources.json` 嘅新界東地域 `contentful_api` entry 將一個 `Authorization: Bearer …` token 直接寫入 `api_headers`（public repo，本文唔重印 token 值）。呢個正正係上一段文「重點係把 authorization、x-client-id 留低」嘅風險實例，亦撞 [A1](03-security.md)／[W6](12-copyright-scout-system.md#w6--api-key-屬版權資產嘅一部分唔好外洩)。建議 **rotate → 改由 env／secret inject → 喺 guard 加 Bearer token regex**（現有 [`scripts/guard.mjs`](../scripts/guard.mjs) 只認 `sk-*`／`gh*_*`／private key，認唔到呢個形狀）。
- **P1｜`verify_ssl: false`**：`sources.json` 至少兩個 `wordpress_api` 來源關咗憑證驗證；若套落私有 API 會變成可中間人改資料。
- **P2｜並行爬蟲無節流**：`forward/tools/crawl_emails.py` `max_workers=10` 無 delay，同 `check_sources.py` 自己嘅「1.5–4.0 秒順序」防封標準相違；另外佢抓公開電郵，涉及 [A12 PDPO](03-security.md) 嘅資料清單／保留期。
- **P2｜Playwright 體積**：[`scout-circulars/.github/requirements-scrape.txt`](https://github.com/playerkousas-rgb/scout-circulars/blob/main/.github/requirements-scrape.txt) 實測記錄 playwright driver **137MB** 搞到 Vercel 爆容量。RAE manual mode 同樣要 `[manual]` + `playwright install chromium`，撞正 [S 瘦身](01-slim.md)；要用的話只放 CI runner，唔好落部署 bundle。

---

## 7. 未核實／待查（唔好當已完成）

1. 85 個 repo 以外嘅 private repo、以及 4 個 tree API 404 嘅空 repo 未查。
2. 冇實際執行任何 repo 嘅爬蟲／proxy，亦冇打過第三方 endpoint；本文件所有「可用」係**檔案層面可重用**，唔等於現時仍跑得通。
3. `sik.search.blue.cdtapps.com/us/en/search`、`api.ingka.ikea.com/guest/token`、`x-client-id`、`190 products` 全部仍屬影片聲稱，未錄 HAR 驗證。
4. `reverse-api-engineer 0.14.0` 未安裝實測；agent mode 需要 LLM API key、`chrome-mcp` 預設唔存 HAR（要 `auto`／`agent-browser`／manual 先有 HAR）呢兩點只嚟自 [官方 README](https://github.com/kalil0321/reverse-api-engineer#readme)。
5. `api/data/apis.csv` 最後更新 2026-09-29，入面嘅 `verified`／`hk_status` 決策前要重新實測（[P1 明文要求](../PLAYBOOK.md#0-開工前三分類決定做幾多)）。
