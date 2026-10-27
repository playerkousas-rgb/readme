# templates/watermark/ — 隱形水印 ＋ COPYRIGHT SCOUT SYSTEM（Type B）

> 對應：[docs/12-copyright-scout-system.md](../../docs/12-copyright-scout-system.md)（W 系列）、[docs/13-versioning.md](../../docs/13-versioning.md)（V 系列）、[docs/14-api-key-injection.md](../../docs/14-api-key-injection.md)（API KEY 注入）。
> 來源：用戶提供嘅 `drawscout.html`（2026-10-26），保留 `MARK='DRAWSCOUT|v1'`、`STEP=32`、8×8 DCT 中頻 (2,3)、多數決投票，向後兼容。

## 檔（**檔名同內文都有同一個版號**，V1）

| 檔 | 角色 |
|----|------|
| `scout_watermark_codec_v1.0.mjs` | 🧠 演算法唯一真理：`embed()` / `decode()` / `makePayloadV2()`，純 JS 無 DOM |
| `drawscout_decoder_v1.0.html` | 🔍 解碼器（你原本嗰個，加 v2 payload、XSS escape、雙版號、版權頁尾） |
| `scout_generator_v1.0.html` | 🖼️ Type B 生成器示範：上圖 → 嵌水印 → 下載成品圖；含 API KEY placeholder |
| `inject_key_v1.0.mjs` | 🔑 本機 API KEY 注入器（placeholder → `_local_v1.0.html`，永不入 Git） |
| `watermark.test.mjs` | ✅ 10 條測試：v1/v2 round-trip、**真實 app v4.2.1 legacy embed 互通**、魯棒性、payload 消毒、雙版號 |

```bash
node --test templates/watermark/watermark.test.mjs        # 全綠
node ../../scripts/audit_single_html_v1.0.mjs scout_generator_v1.0.html   # 交付前靜態審計（C13-f）
```

> 📏 **體積（C13-g）**：單一 HTML 唔經 Vercel、**唔強制瘦身**，硬上限 **5MB**；S7 嘅 2MB／S10 嘅 1MB 唔適用。

> 🇭🇰 **香港點用（重要）**：**水印嵌入同解碼完全唔需要 API key** —— 呢個就係
> [docs/14 §2.1](../../docs/14-api-key-injection.md#2-香港真正用得到嘅做法你個水印-html-就係) 講嘅「零 key 單一 HTML」：
> AI 用喺**生成期**，runtime 純瀏覽器 DCT 數學，香港任何瀏覽器／`file://`／WhatsApp 傳圖都用得。
> 生成器個「測試呼叫 Gemini API」按鈕同 `brain_v1.0.gs` 嘅 endpoint 只係**可選示範**；
> 你個 [`api/docs/ai.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/ai.md) 實測香港 IP 直接打
> `generativelanguage.googleapis.com` 係封咗。要 runtime AI：喺 Canvas preview 靠 C13 請求代理，
> 或者轉 Type C／Vercel server-side secret；唔好假設 `file://` 直打得通。

## 三步用

```bash
# ① 生成器（Type B）直接開 scout_generator_v1.0.html，或交俾用家
#    上圖 → 撳「嵌入水印並下載成品圖」→ 得到 xxx_scout_v1.0_wm.png

# ② 驗證：開 drawscout_decoder_v1.0.html，揀成品圖 → 「檢測水印」
#    v1 → DRAWSCOUT|v1；v2 → SCOUTSYSTEM|v2|0082|20261026|A1B2

# ③ 如果要喺前端 call Gemini API（可選，唔建議長期）：
GEMINI_API_KEY=AIza... node templates/watermark/inject_key_v1.0.mjs templates/watermark/scout_generator_v1.0.html
# → 產生 scout_generator_local_v1.0.html（含真 key；本機用完即刻刪）
```

## 水印 payload

| 版本 | payload | 位元數 | 內容 |
|------|---------|--------|------|
| v1 | `DRAWSCOUT\|v1` | 104 | 向後兼容你原本解碼器 |
| **v2（預設）** | `SCOUTSYSTEM\|v2\|<unit4>\|<yyyymmdd>\|<hash4>` | 264 | 版權歸屬 + 單位 + 日期 + 校驗 |

- `© SCOUT SYSTEM` 係版權主張，payload 用 `SCOUTSYSTEM` 前標；可見頁尾亦要有（W1 雙軌）。
- **唔好放個人資料**（W7）：只有 unit / date / hash，無 會員 ID／email／姓名。
- `hash` 由「原圖名 + 日期 + 單位」計，用嚟對照使用紀錄（Type C）。

## 限制（一定要同用家講，W4）

```
✅ 頂到：一般 JPEG 重新壓縮、輕微噪訊、部分裁切（因為 payload 循環重複寫入）
❌ 頂唔到：大幅縮放／旋轉／重度壓縮／平台重新編碼／AI 重繪
⚠️ 陰性結果唔代表圖片一定唔係本系統生成 — 水印係來源標記，唔係加密／DRM／法律證據
```

## 更新版號（V3）

改任何一個檔，就要：
1. 改檔名 `_v1.0` → `_v1.1`
2. 改內文 **全部** `v1.0` → `v1.1`（`meta` / `APP_VERSION` / `<title>` / 頁尾 / 註解）
3. 改 codec `VERSION`、解碼器／生成器常數、測試期望值
4. 跑 `node --test templates/watermark/watermark.test.mjs`（V1/V2/V3 測試會捉到漏改）
5. 同步 [docs/13-versioning.md](../../docs/13-versioning.md) 嘅版本登記表
