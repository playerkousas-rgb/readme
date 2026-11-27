# 65 — GEMINI Canvas × DrawTheRoute iframe／postMessage 整合計劃

> **狀態：表單 UI 原型已建立；DrawTheRoute bridge 尚未施工，待 AGENT 覆核接口。** `templates/canvas/drawtheroute_trip_form_v0.1.html` 只測試 GEMINI function call 收到表單資料；工具明確回報未連接，沒有路由計算或 mock 距離。本輪沒有修改 `playerkousas-rgb/drawtheroute` 或 `playerkousas-rgb/GEMINI`，亦沒有部署。
>
> **目標個案**：3 日 2 夜、總距離約 40 km；營地涉及猴塘溪及大灘。使用者測試 JSON 曾提供「北潭涌 → 猴塘溪 → 大灘 → 北潭涌」作示範，但該次工具回傳距離為本地 hard-coded mock，**不是實際路線，起終點、露營順序及 CP 座標仍須確認**。

## 1. 一句話方案

先由 Canvas HTML 表單收集結構化行程資料（要行幾多日／公里、起終點、每晚選定營地）；住宿欄位按晚數動態增減。GEMINI Canvas 再用 function calling 理解和修正路線 CP；Canvas bridge 以 `postMessage` 將已確認的起終點與營地送入 DrawTheRoute iframe。DrawTheRoute 使用自身現有的路線計算流程計算及繪圖，再把逐日距離、高程、時間估算、路線品質警告和總覽／逐日地圖圖片以 `postMessage` 回傳 Canvas。

**官方營地清單只作表單選項／候選，不可整份當途經點傳給 route engine。** 只有用戶在表單選中的住宿營地才是必經點；若營地未定，先顯示候選供用戶揀，確認後才計路。

**不先另建公開 route API、不複製 DrawTheRoute 計算邏輯。** 先做同頁 iframe bridge 的 PoC；若 Canvas 的 iframe sandbox／Origin 或 Vercel frame policy 不支援，再退回評估 API／服務端工具路線，唔預先假設一定要 API。

## 2. 已知事實與未知項

### 已知（以本輪讀取的 GitHub `main` 源碼為限）

- `playerkousas-rgb/drawtheroute` 最近讀取的 `main` commit：`bab857de0dd2a94a1eab0332aff8bf4465de7bb2`（2026-11-18）。
- DrawTheRoute 是 Vite／React 前端；現有功能包括 Leaflet 地圖、BRouter hiking-mountain 路由、高程剖面、Naismith 時間估算、路程表、手繪／微調及 GPX 匯入／匯出。
- 未見既有 `postMessage` bridge 或 `/api/route` endpoint。現有路由流程在前端，由 UI／hooks 觸發；要接訊息，須由 DrawTheRoute AGENT 將 bridge 接入真正計算流程，而唔係只在 HTML 加一個 listener。
- 現有 BRouter 失敗時可退回直線幾何／高程備援。若發生 fallback，結果必須明確警告，不能包裝成已驗證山徑。
- `drawtheroute` 在本倉白名單清單中記為已有 `entry-gate`。Canvas iframe 的來源不應假定已在放行名單。
- 用戶提供的 `canvas_v1_0_0.html` 已證明：GEMINI 會回傳 `functionCall`，Canvas 能執行該 HTML 內的本地 `getRouteTool()`。該版本的距離 `13.2 / 14.1 / 12.7 km` 是固定 mock 值；它未測過 iframe、postMessage 或 DrawTheRoute 真實路由。

### 用戶補充觀察（未由 repo／路線計算獨立驗證）

- 用戶觀察到第一次規劃誤差較大，因當時把所有官方營地座標一併交給 GEMINI，結果路線似乎把多個營地都當成要經過的點。
- 本計劃將此視為輸入契約風險：營地資料庫（候選）與已選營地／必經 CP 必須分開；要由 DrawTheRoute AGENT 用測試 payload 確認未選營地不會進入 route stages。

### 未知（必須先實測／由相應 AGENT 確認）

1. GEMINI Canvas 實際執行該 HTML 時的 `location.origin`、iframe sandbox 設定及是否容許外站 iframe。
2. DrawTheRoute Production 目前實際 response headers（尤其 CSP `frame-ancestors`／`X-Frame-Options`）；repo 設定不能代替線上 response 驗證。
3. Canvas origin 是否穩定、可作精確 allowlist；若 sandbox 令來源成為 `null` 或不穩定，不得用 `'*'` 草率放行。
4. DrawTheRoute 現有 route manager 的可呼叫介面、每段計算完成的事件點、平行請求限制及錯誤型態；要由 DrawTheRoute AGENT 實查後決定 bridge adapter 位置。
5. 猴塘溪／大灘營地及北潭涌的精確地圖點、正式可行山徑、行程限制、40 km 誤差容許、每日時間／爬升上限與退出點。目前只有地名和測試用 JSON，未足以定出安全路線。

## 3. 架構與資料流

```text
使用者自然語言＋Canvas 行程表單（days／km／起終點／每晚營地）
        ↓ 驗證並生成結構化 TripRequest；只包含已選營地
GEMINI function call：getRoute({ ...request })
        ↓ Canvas 本地工具 runner（非 DrawTheRoute 計算）
DrawTheRoute iframe.contentWindow.postMessage(route:plan, exactOrigin)
        ↓ 驗證來源、request schema、requestId
DrawTheRoute bridge adapter → 現有 route manager／BRouter／elevation／itinerary
        ↓ route:result + route:map artifact(s) 或 route:error（targetOrigin 精確指定）
Canvas bridge resolve 對應 Promise、顯示地圖預覽／逐日圖
        ↓
將實際結果交回 GEMINI，整理方案、每日路程表、地圖輸出及警告
```

- Canvas HTML 先提供固定、易填的行程表單：步行日數、總距離目標（km）、起點、終點，以及每晚營地；按住宿晚數動態增加／移除營地欄（3 日 2 夜＝兩格；4 日 3 夜＝三格）。若一般行程為 days−1 晚，可預設該數，但容許使用者修正。
- 營地欄用已核實營地清單的搜尋／選擇器；選中後帶入 camp ID＋實際入口座標，另顯示座標／地圖 pin 供確認。若官方清單來源尚未確認，先用地名輸入＋地圖選點確認，不暗中猜座標。
- Canvas 的 `getRouteTool()` 轉為非同步 bridge：建立 `requestId`、等待 iframe ready、送 `route:plan`、等待相同 `requestId` 的結果，遇逾時／錯誤／使用者取消時回傳明確錯誤。表單只把使用者選中的 camps 傳入 `selectedOvernightStops`；未選營地目錄不得變成途經點或一併塞進 route request。
- DrawTheRoute iframe 保留真實地圖與現有 route engine；但**不能只把路線留在細小 iframe 內**。完成計算後，必須把地圖圖片輸出到 Canvas 顯示，令使用者能看清 CP／每日路段位置。40 km 長線至少提供全程總覽圖＋逐日詳細圖（沿用 DrawTheRoute 現有地圖 PNG／分段地圖輸出能力；若實查後該能力不能由 bridge 重用，列為必做改造）。Canvas 提供放大／另開檢視及下載；路線地圖輸出未完成時，不得標示整份結果已交付。
- 此模式下，BRouter／高程服務請求仍由 DrawTheRoute 前端正常發出。跨源 `postMessage` 本身不需要 CORS；但 iframe 載入仍受瀏覽器 frame policy／Canvas sandbox 管制。

## 4. Message contract v1（建議草案，待 DrawTheRoute AGENT 覆核）

### 4.1 共通規則

- 每則訊息須有 `channel: "scout.drawtheroute"`、`version: 1`、`type`、`requestId`。
- `requestId` 用 `crypto.randomUUID()` 或等效安全隨機值，Canvas 只接受與 pending request 相同的 ID，避免舊回覆配錯請求。
- 先定義 JSON Schema／runtime validator；缺欄、型別錯、座標超界、CP 過多，一律拒絕並回傳可讀錯誤。
- 驗證 `selectedOvernightStops.length === nights`（除非明確允許例外）；營地候選 catalog 只存在於 Canvas 表單選擇流程，不得整份放入 `route:plan`；只有已選 camp ID／座標可成為 route waypoint／stage。
- `postMessage` 必須使用已核准的精確 `targetOrigin`；接收端核對 `event.origin`、`event.source === window.parent`（iframe 端）及訊息格式。**禁止 `targetOrigin: "*"`，禁止把 origin 字串當成身份密鑰。**

### 4.2 Handshake

1. DrawTheRoute iframe 載入後傳 `drawtheroute:ready`，帶 bridge／app version、支援的 request schema version。
2. Canvas 只在收到核准來源且版本相容的 `ready` 後開放 GEMINI 呼叫 `getRoute`。
3. Canvas 對 iframe 傳 `canvas:init`，包含協定版本及 parent origin；iframe 再確認 `event.origin` 屬精確 allowlist 才接受後續規劃請求。
4. 任何來源驗證失敗、協定不相容或 ready timeout，都顯示「整合未就緒」，不可 fallback 成 AI 自行估路線。

### 4.3 路線請求

示意（欄位名待 AGENT 定案）：

```json
{
  "channel": "scout.drawtheroute",
  "version": 1,
  "type": "route:plan",
  "requestId": "uuid",
  "plan": {
    "days": 3,
    "nights": 2,
    "targetTotalKm": 40,
    "start": { "label": "北潭涌", "lat": 0, "lon": 0 },
    "stages": [
      { "day": 1, "from": "start", "to": "camp1" },
      { "day": 2, "from": "camp1", "to": "camp2" },
      { "day": 3, "from": "camp2", "to": "finish" }
    ],
    "selectedOvernightStops": [
      { "day": 1, "waypointId": "camp1" },
      { "day": 2, "waypointId": "camp2" }
    ],
    "waypoints": [
      { "id": "camp1", "label": "猴塘溪營地入口", "lat": 0, "lon": 0, "role": "required-overnight" },
      { "id": "camp2", "label": "大灘營地入口", "lat": 0, "lon": 0, "role": "required-overnight" },
      { "id": "finish", "label": "北潭涌", "lat": 0, "lon": 0, "role": "finish" }
    ],
    "constraints": {
      "maxMovingMinutesPerDay": null,
      "maxAscentMPerDay": null,
      "targetDistanceToleranceKm": null
    }
  }
}
```

**營地資料／路線 CP 必須分開**：`candidateCampCatalog` 係「可考慮營地資料庫」，只供 GEMINI／使用者挑選；唔等於路線途經點，絕不可把所有官方營地座標自動塞入 `waypoints`／`stages`。只有 `selectedOvernightStops` 指定的營地 ID 可以成為必經住宿點。今次 3 日 2 夜已指定猴塘溪及大灘時，應只用這兩個已選營地，路線為「起點 → 猴塘溪 → 大灘 → 終點」；其餘官方營地不能被串入路線。若營地未定，GEMINI 先從 catalog 提出候選、讓使用者確認選中兩個，再送 route request。若距離不合 40 km，迭代應調整山徑 CP／日段，而唔係把其他營地逐個加入。

**注意**：以上座標 `0,0` 只是 schema 示意，絕不可直接拿去計路。正式 request 必須帶真實核實的 WGS84 `lat/lon`，或由使用者在地圖上選定的 DrawTheRoute waypoint ID。第一版不應讓工具只憑地名暗中 geocode；如果要 geocode，必須回報匹配點名稱／座標／來源，並讓人確認。另需使用營地實際可到達的入口／路徑接駁點，不可只用營地地名或地圖中心點代替。

### 4.4 回覆

建議 `route:result` 至少包括：

- 每日每段的起訖、實際距離（m）、上升／下降（m）、估算行走時間（分鐘）。
- 總距離、每日結果、計算時間／engine version，及路線是否成功貼上山徑。
- `warnings[]`：BRouter 錯誤、直線 fallback、缺高程、無法完成的 leg、可疑／不完整資料等。
- `criteria[]`：逐一列出哪些已定義的數字條件通過／不通過／未知；不得只回模糊 `pass: true`。
- `humanReviewRequired: true`。
- `mapArtifacts[]` 清單：本次應有的全程總覽圖和每日日程詳細圖種類／day／狀態；地圖圖片成功生成並在 Canvas 可見，先視為交付完成。
- 路線 geometry 可留在 iframe 畫，不必一開始傳大型 GeoJSON；但不可因此省略可視地圖輸出。

對應 `route:error` 必須包括穩定 error code、可讀訊息、可否重試；錯誤不可回傳上一個 request 的舊結果。

### 4.5 地圖圖片回傳（必做）

- DrawTheRoute 重用現有 PNG／分段地圖輸出流程，最少產生：① 全程總覽圖（標示全部 CP、營地、每日分界）；② Day 1／Day 2／Day 3 詳細圖（圖面需足夠比例看清沿途 CP）。若現有輸出工具只會下載而未回傳 Blob，DrawTheRoute AGENT 要抽出可由 bridge 呼叫的 image-export function；不要複製第二套地圖畫圖邏輯。
- 圖片以獨立 `route:map` message 傳送，包含 `requestId`、`artifactId`、`kind`（`overview`／`day-detail`）、`day`（適用時）、`mimeType`、`width`、`height`、建議檔名及 image bytes。避免 base64 塞入 JSON；優先用 `ArrayBuffer` transfer list，或經實測可靠的 `Blob` structured clone。Canvas 收到後建立 Blob URL，顯示 `<img>` 預覽，提供放大／另開及下載；圖片顯示與下載完成後適時 `URL.revokeObjectURL()`。
- image bytes 同樣受精確 `targetOrigin`、來源驗證及 requestId 配對；設合理檔案大小／圖片尺寸限制，超標要回報並縮圖／分頁，不可靜默截斷。
- 地圖磚可能因 CORS／匯出限制缺圖；輸出需檢查並把缺塊、無法 export 等放進 `warnings[]`。有路線摘要但沒有可讀地圖時，顯示「計算完成、地圖輸出失敗」，不得當成完整交付。
- 驗收要以實際 Canvas 顯示結果檢查 CP 標籤、每日分色／分界、比例尺／指北針、文字大小和手機／桌面放大可讀性；40 km 全線 overview 不可取代逐日詳細圖。

## 5. 「啱唔啱」的判定界線

DrawTheRoute 可負責可重現的數字計算和使用者明確提供的門檻比對，例如總 km 是否落在容許範圍、每日時間／爬升是否超標。未有使用者或領隊訂出門檻時，回傳 `unknown`／「待領隊確認」，不得由 AI 自創標準。

以下不屬於程式自動安全認證：路徑是否正式開放、夜行風險、天氣、潮汐、溪澗水位、營地預約、補水、撤退交通、同行者體能與領隊批准。AI 可以整理核實清單和標示來源，但不得把路線計算結果宣稱為「安全／已批准」。

若任何 leg 使用直線 fallback，預設不得標為 `pass`；可以回傳候選預覽，但要明確標示「未完成山徑路由，不可作導航／正式行程表」。

### 5.1 GEMINI 反覆修正路線的停止／繼續規則

**不設固定「最多 3 次」的候選方案上限。** 使用者明確希望 GEMINI 可持續改檢查點、重算和修正距離誤差；因此 `getRoute` 應支援多輪迭代，而唔係只試 3 個候選就結束。

每一輪流程：① GEMINI 提出新的 CP／路段變體；② DrawTheRoute 真正重算；③ GEMINI 讀取各日距離／爬升／時間／fallback 警告；④ 按已定義的硬條件更新最佳候選，再決定是否繼續。**全部硬條件達標先可回 `pass: true`；未達標就繼續，或如遇停止條件，回報最佳候選和仍未達標項目，絕不把「最接近」冒充「合格」。**

持續嘗試係「由 GEMINI 自動繼續，直至達標或明確停止」，唔係允許無限度無監察地重複呼叫。停止／暫停條件：

- 使用者取消、關閉 Canvas，或明確接受目前最佳方案；
- 外部路由服務逾時、回 429／額度限制、連續失敗，或 DrawTheRoute bridge 回報不可重試錯誤；
- GEMINI 重複提出同一組 CP、路線結果循環，或達到由使用者／領隊確認的資源預算；此時列出最佳結果並詢問是否繼續／調整條件；
- 沒有可核實 CP／座標、未定義「合格」門檻，或所有候選都需直線 fallback；此時停止搜索並要求補資料，不可繼續猜。

技術上保留單一同時 route request、每段 timeout、取消與 request 去重；**這些是資源保護，不是固定候選次數上限**。若未設可接受的時間／服務額度預算，先採「遇服務限流就暫停並提示使用者」，不可自動密集重試。

40 km 容差、每日移動時間／爬升等成功條件仍須由使用者／領隊先提供；沒有可測量的停止條件，就無法可靠判斷何時「啱」。

## 6. 嵌入、閘門與資料風險

1. **精確 frame policy**：取得實際 Canvas origin 後，DrawTheRoute 只允許該 origin 嵌入（CSP `frame-ancestors`）；不能用 `*`。移除／避免互相矛盾的 `X-Frame-Options: SAMEORIGIN`。未驗證線上 headers 前，不宣稱 iframe 已可用。
2. **entry-gate**：現有 DrawTheRoute gate 不應因 `?embed=1` 就無條件放行。可設計專用 embed bootstrap：只在 iframe context、精確 parent origin／握手驗證完成後，開放限定的規劃功能；頂層一般入口規則維持原狀。`?embed=1` 是模式選擇，不是授權憑證。
3. **瀏覽器儲存**：跨 `*.vercel.app` iframe 屬跨站情境，localStorage／PWA 等可能分區。須先盤點 DrawTheRoute 儲存資料；iframe 內的偏好或保存路線可能與頂層 DrawTheRoute 不同。第一版不得把 iframe 內成功保存誤稱為已同步至頂層 App。
4. **postMessage 不是安全邊界**：前端 Origin 檢查只保護正常瀏覽器訊息；DrawTheRoute 仍是公開前端時，任何人仍可能直接呼叫前端可用的 BRouter／地圖服務。若有個人資料、權限或需保護的付費／第三方額度，另按後端規則設計，不能靠 bridge 遮罩。
5. **無金鑰流出**：Canvas HTML、message payload、前端 bundle 不放 Gemini API key、BRouter 私鑰或其他 server secret。第一版儘量沿用現有前端公開服務；若需秘密憑證，停止並另作 server-side 設計。
6. **DoS／資源限制**：設 waypoint／days 上限、單一同時 route request、timeout、取消行為、重複 request 去重及可調整的時間／服務額度預算；不設固定候選次數上限，但要防止無監察的緊密迴圈，遇限流就暫停／退避並通知 Canvas。

## 7. 施工分段與責任

### Phase 0 — DrawTheRoute AGENT 先做技術盤點（目前要協調的部分）

- 覆核本計劃與 route hooks 的實際入口，確認可以由 bridge adapter 呼叫而不模擬 UI click。
- 確認 iframe 下可載入地圖、BRouter／高程請求和路程表；取得 production／preview 的 frame headers。
- 在真實 Gemini Canvas 測試頁量度 `location.origin`、iframe sandbox 能力及 `postMessage` 方向。
- 盤點 localStorage／PWA 和外部服務依賴，決定 `embed` mode 的最小 UI。
- 回報不支援項、額度限制、改動檔案及可逆退場方式；未確認前不部署 Production。

### Phase 1 — DrawTheRoute 做可測試 bridge

- 新增 versioned message contract、精確來源 allowlist、schema validator、timeout／cancel／錯誤回覆。
- 接到真實路線管理流程；確保 route result 是地圖／高程／行程表實際運算結果。
- 加入可由 bridge 呼叫的既有 PNG／分段地圖輸出流程，至少可產生全程 CP 總覽圖和每日詳細圖；回傳可供 Canvas 顯示的 image artifacts。
- 加入 `route:ready`、成功、部分失敗、全失敗、fallback、重複 request、地圖 CORS／圖片輸出失敗等測試。
- 保留一般頂層使用方式；embed mode 不得破壞 APP STORE gate、現有地圖操作及 GPX 匯入／匯出。

### Phase 2 — 使用者覆核 route criteria／waypoint

- 確認北潭涌是否為起點和終點、猴塘溪與大灘的住宿先後、實際營地入口座標。
- 確認 40 km 是目標值還是上限／容差、每日最長行走時間及可接受爬升。
- 確認哪些正式山徑必須／不可走、補水／撤退點及領隊核准流程。
- 未有真實座標和上述門檻前，只能驗 bridge，不能驗正式路線安全性。

### Phase 3A — 表單 UI 原型（已建立，尚未驗證 Canvas 執行）

`templates/canvas/drawtheroute_trip_form_v0.1.html` 提供日數、總公里、起終點、住宿晚數及按晚數增減的已選營地欄位，並以 GEMINI function call 傳結構化資料。工具 stub 只 echo 輸入並明確標記 `routeCalculated: false`／`DRAWTHEROUTE_BRIDGE_NOT_CONNECTED`，沒有 mock 路線數字。這是表單／資料契約原型，不代表 DrawTheRoute 整合完成或真實路線測試已通過。

### Phase 3B — DrawTheRoute 配合後的端到端 Canvas 測試頁

DrawTheRoute bridge interface 和 Canvas exact origin 確定後，再把原型升級為 Canvas HTML：選營地後確認實際入口座標；正式 route request 只送已選住宿營地，唔附整份官方營地座標庫。將 `getRouteTool()` stub 換成：

1. 等待 iframe `ready`；
2. 將 GEMINI `functionCall` args 驗證／轉成 `route:plan`；
3. await 匹配 `requestId` 的真實結果；
4. 把 route result 交回 GEMINI；
5. Canvas 顯示逐日摘要／警告，並把 DrawTheRoute 輸出的全程總覽圖＋逐日詳細圖以可見預覽、放大／另開及下載形式交畀用戶；唔可以只留一張太細的 iframe 地圖；
6. 加入 timeout、重試、取消和非 JSON／iframe blocked／地圖輸出失敗的明確提示。

Canvas test page 不得假裝 mock 結果是真路線；mock 模式必須清楚標示 `mock: true`，正式 bridge 回覆需帶 `source: "drawtheroute"` 和 engine/version。

## 8. 驗收標準（Go／No-Go）

### 必須全數通過才可進行 GEMINI 真路線測試

- [ ] Canvas 確認可以載入 DrawTheRoute iframe；blocked 時會明確停止，不回退成 AI 自估。
- [ ] 父子視窗只接受核准的精確 Origin；錯誤 origin、錯誤 `event.source`、錯誤 version 均拒絕。
- [ ] `ready → request → result` requestId 一對一；亂序、重複、逾時、取消不會回錯方案。
- [ ] 迭代搜尋不設固定 3 次上限：用測試個案驗證超過 3 輪仍可繼續修正，直至達明確條件或觸發取消／服務限流／重複循環等停止條件。
- [ ] 達標時回傳所有條件及計算值；未達標停止時回報最佳候選和差距，不得把「最接近」標成 `pass`。
- [ ] 表單以住宿晚數動態顯示營地欄：3 日 2 夜顯示 2 格，4 日 3 夜顯示 3 格；欄位數與 `selectedOvernightStops` 驗證一致。
- [ ] 測試提供多個官方營地候選、但用戶只選 2 個住宿點：送出的 route request／路線只經選中的兩個營地，未選營地座標不進 `waypoints`／`stages`，不能被當成必經 CP。
- [ ] 已知起訖點測試回傳的距離／爬升與 DrawTheRoute 同一 UI 手動計算一致（容差由 AGENT 定義及記錄）。
- [ ] 各 leg 清楚區分正常 BRouter 路線、部分 fallback、完全 fallback；fallback 不可 `pass: true`。
- [ ] Canvas 收到並實際顯示全程總覽圖和逐日詳細圖；用戶可放大／另開／下載，CP 標籤及每日段落可讀，不能只把圖藏在小 iframe。
- [ ] 圖片缺塊／CORS／匯出失敗有明確警告；沒有可讀地圖時不能顯示「完整交付」。
- [ ] 正常 top-level DrawTheRoute、APP STORE 入口和現有 GPX 功能無回歸；embed mode 不會因任意 URL query 自動繞過 gate.
- [ ] 沒有在 HTML、console、message payload 或 Git 中暴露 secret。
- [ ] 「適合遠足／安全」只依人手核實清單和明確數字條件呈現；保留領隊最終確認。

### 必須停止／改方案的情況

- Canvas 不提供穩定可 allowlist 的 Origin，或 iframe sandbox 阻止載入／回訊；
- DrawTheRoute 不能在 iframe 下觸發現有路由計算，或跨站儲存令必要功能失效；
- 為了打通必須用 `postMessage('*')`、放寬所有 Origin、把秘密 key 放前端；
- 路線結果無法判斷 fallback、只得 AI 生成的公里數而無實際路線幾何／計算來源。

遇到以上情況先停，向使用者解釋並比較 server-side API／中介工具方案；不得自行降級成「AI 猜條路」。

## 9. 可交畀 DrawTheRoute AGENT 的簡短說明

> 請先閱讀真理倉 `docs/65-gemini-canvas-drawtheroute-postmessage-plan.md`，只做 Phase 0 技術盤點，暫勿改 Production。目標係先用 GEMINI Canvas HTML 表單收集步行日數、總公里、起終點及每晚由用戶選定的營地（晚數幾多就顯示幾格），再透過 iframe + `postMessage` 將有座標的每日 CP 傳入 DrawTheRoute，呼叫現有路線計算流程，再回傳實際距離、上升／下降、高程／時間估算及 fallback warnings，並把全程總覽圖和逐日詳細地圖圖片回到 Canvas 顯示／下載。官方營地清單只供欄位選擇，未選營地不可變成必經點。使用者不接受固定 3 次方案上限：GEMINI 應可持續修正 CP／重算，直至明確條件達標；只在使用者取消、服務限流／故障、重複循環或資源預算觸發時停止，未達標要回報最佳方案與差距。營地 catalog 必須和 route waypoints 分開；未選中的官方營地絕不可自動串入 route stages。本案如確認 3 日 2 夜入住猴塘溪及大灘，路線只經這兩個已選營地，其餘營地只能作候選資料。請先確認 Canvas 實際 Origin、iframe sandbox、DrawTheRoute frame headers、entry-gate 行為、route manager 可呼叫接口和 localStorage 影響；回覆可行／不可行、阻塞點、建議 message schema、改動範圍及測試方法。**不要以 mock 數字當實際路線，不要用 `targetOrigin: '*'`，不要把 `?embed=1` 當授權，不要修改 Push／白名單／其他 repo；未經使用者同意不部署 Production。**
