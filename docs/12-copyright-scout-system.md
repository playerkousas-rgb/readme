# 12 — COPYRIGHT SCOUT SYSTEM（W1–W8）

> **案例隔離**：本檔係通用規則。檔內 `UNIT_*`／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN` 等只係**中性示例名**；
> ecportal 旅團／進度追蹤嘅具體專案設定全部喺 [19 專案案例](19-ecportal-troop-case.md)（**唔係通用規則，新 app 唔使跟名**）；repo 健康 → [20](20-repo-health-audit.md)。


> **呢個係通用規則，同瘦身 S 同级**：所有我整嘅 app（A 全開放／B 隱藏水印／C 腦殼分離）都要守。
> 核心：**版權要講出口（可見）＋ 寫入圖（隱形）＋ 留紀錄（可查）**，三軌並行。

---

## W1 — 每個交付檔都要有可見版權標示

```
必備三處：
① <meta name="copyright" content="© SCOUT SYSTEM">
② 可見頁尾：© SCOUT SYSTEM · COPYRIGHT SCOUT SYSTEM · <app名> <vX.Y>
③ 檔頭註解／README：版本 + © SCOUT SYSTEM
```

- **全開放（Type A）唔等於放棄版權**：可以俾人隨便用，但仍然要標明出處同授權條款。
- 成品圖（Type B/C）除咗隱形水印，右下角要有細小可見 `© SCOUT SYSTEM · v1.0` 字（雙軌）。
- 授權條款要寫清楚（例如「可自由使用／改作，須保留版權標示；不得移除水印」），並放 `LICENSE` 或 README。

---

## W2 — 所有生成圖片要落隱形水印

| 版本 | payload | 位元 | 用途 |
|------|---------|------|------|
| v1 | `DRAWSCOUT\|v1` | 104 | 向後兼容用戶原本嘅 `drawscout.html` |
| **v2（預設）** | `SCOUTSYSTEM\|v2\|<unit4>\|<yyyymmdd>\|<hash4>` | 264 | 版權 + 單位 + 日期 + 校驗 |

**演算法**（唯一真理：[scout_watermark_codec_v1.0.mjs](../templates/watermark/scout_watermark_codec_v1.0.mjs)）：
```
8×8 區塊 DCT 中頻 (u=2, v=3)，B = A[2]·A[3]·COS[2][y]·COS[3][x]（ΣB² = 1）
STEP = 32；每區塊寫 1 bit；payload 循環重複（多數決投票）
嵌入：q = round(coef/32)；若 (q&1) ≠ bit 就 q+1；delta = q·32 - coef；RGB 全部加 delta·B
解碼：逐區塊 round(coef/32)&1 → 投票 → confidence > 0.58 先算找到
```

```js
import { embed, decode, makePayloadV2 } from '../templates/watermark/scout_watermark_codec_v1.0.mjs';
const payload = makePayloadV2({ unit:'0082', date:'20261026', hash:'A1B2' });
embed(imageData, payload);          // 原地改
decode(imageData);                   // → { found, version, payload, copyright, unit, date, hash, confidence }
```

**驗收**：`node --test templates/watermark/watermark.test.mjs` → 全綠（v1/v2 round-trip）。

---

## W3 — 解碼器要向後兼容，而且要老實

- [drawscout_decoder_v1.0.html](../templates/watermark/drawscout_decoder_v1.0.html) 同時解 v1（104 bit）同 v2（264 bit），自動揀信心度高嗰個。
- 解碼器顯示：payload、信心度、單位、日期、校驗、圖片尺寸。
- **陰性結果嘅文案一定要寫**：「未能確認標記，可能唔係本系統圖片，亦可能係裁切／縮放／壓縮造成解碼失敗。水印唔係法律證據。」
- 解碼內容嚟自圖片 = 不可信輸入，**必須 escape 先入 `innerHTML`**（A11）。你原本個 decoder 直接 `${decoded}` 入 HTML，已喺 v1.0 版修正。

---

## W4 — 水印唔係加密／DRM／法律證據

```
✅ 頂到：一般 JPEG 重新壓縮、輕微噪訊、部分裁切（payload 循環重複寫入）
❌ 頂唔到：大幅縮放／旋轉／重度壓縮／平台重新編碼／AI 重繪／截圖再壓
```

| 唔好講 | 要講 |
|--------|------|
| 「呢張圖一定係我哋嘅」 | 「讀到水印 = 高概率嚟自本系統」 |
| 「讀唔到 = 假圖」 | 「讀唔到可能係被處理過，陰性結果唔代表唔係本系統」 |
| 「水印防盜圖」 | 「水印係來源標記，唔阻止複製，只協助追溯」 |

真正要追溯，靠 Type C 嘅 **RECORDS**（原圖 hash／成品圖 hash／時間／單位／promptVersion），水印只係第一層線索。

---

## W5 — 原圖／成品圖／使用紀錄（Type C 必做）

```
RECORDS（append-only + prev_hash 鏈）：
  ts | actorHash | action | unit | promptVersion | watermarkPayload |
  originalHash | originalFileId | outputHash | outputFileId | bytes | resultCode | prevHash | hash
```

- **原圖**：上傳即計 `sha256`，存 Drive 私有資料夾／Supabase private bucket，只記 `fileId` + hash。
- **成品圖**：生成後同樣計 hash + 存一份；記低 `watermarkPayload`（可由解碼器反查紀錄）。
- **使用紀錄**：邊個單位、幾時、邊個 action、幾多 bytes、成功／失敗 code；失敗都要記。
- **唔好**將圖 base64 塞入 Sheet（S11）；唔好用長期公開分享連結（A9）。
- 下載用短時效 signed URL；圖檔保留 12 個月後 purge（A12），metadata 留 24 個月（A13）。

---

## W6 — API KEY 屬版權資產嘅一部分：唔好外洩

- 單一 HTML（Type A/B）要 call Gemini API → 用 **C13 三軌自動注入**（唯一 `API_KEY` slot + `credentials:'include'` 平台代理 + BYOK 後備，已實作可用）；本機 placeholder 注入器只係另一條手動本機路。
- **注入版檔名帶 `_local_`**，`.gitignore` 同 guard 都會擋；永遠唔入 Git／唔分享／唔電郵。
- **千祈唔好**將真 key 貼入 Gemini 對話叫佢寫入 HTML —— 對話紀錄、分享連結、Canvas 原始碼全部會見到。
- 長期方案 = Type C：`GEMINI_API_KEY` 放 ScriptProperties，`Code.gs` `UrlFetchApp` 代 call，前端零 key。
- 完整 C13 三軌 + 全端 app server-side secret + prompt → [14-api-key-injection.md](14-api-key-injection.md)。

---

## W7 — 水印同紀錄唔好放個人資料（PDPO）

| 可以放 | 唔好放 |
|--------|--------|
| 單位代號（4 位） | 會員 ID／姓名／電郵／電話／身份證 |
| 日期（yyyymmdd） | 相中人物身份 |
| 內容 hash（4–8 位 hex） | 完整 prompt／用戶輸入原文 |
| `payloadHash`／`actorHash` | 可還原嘅個人識別碼 |

- 相片涉及人物 → 要有家長／當事人同意（[A12](03-security.md)）；相簿公開發佈要領袖剔確認 + 記審計。
- `payloadHash` 只供對照，唔好用嚟還原輸入。

---

## W8 — 第三方素材要標來源

- 用咗第三方圖／字型／icon／模型輸出，要喺 README 或 `CREDITS.md` 列明來源同授權。
- **唔好**將第三方素材落自己水印當原創。
- Tailwind CDN、Google Fonts、Gemini API 等要註明；CDN 依賴亦係供應鏈風險（A16）。

---

## 違規後果

任何一條 W 違規 = regression，CI / code review 直接擋。例外要用 `EXCEPTION: W<n> — 原因 — 補償 — 復原日期` 寫喺 PR，並登記喺 [10-checklists §8](10-checklists.md)。

## 對應檢查

```
[ ] node --test templates/watermark/watermark.test.mjs（全綠）
[ ] node --test templates/canvas/brain.test.mjs（全綠，含 W1/W6）
[ ] node scripts/guard.mjs（W1 版權字串、W6 真 key scan、V 雙版號）
[ ] 每次出圖：可見版權 + 隱形水印 + RECORDS 三軌齊
```
