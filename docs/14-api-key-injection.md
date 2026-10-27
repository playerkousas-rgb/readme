# 14 — Gemini / Canvas 自動注入 API KEY（已實作做法 ＋ 香港可用路徑）

> **2026-10-27 定案（用戶）**：單一 HTML 嘅自動注入**已經實作、真係用到，呢個就係正確嘅注入方式**。
> 我較早前將佢講成「過時／誤解／降級做法」係錯，已全部改正。
> 另外：單一 HTML / Gemini Canvas app **唔經 Vercel、唔強制瘦身，硬上限 5MB**（C13-g，越輕量 LOAD 越快），
> 同 Vercel `dist` 類嘅 S7/S10 係兩套完全唔同嘅規矩。

---

## 0. 一句結論

```
① 單一 HTML / Gemini Canvas app 嘅**正確自動注入**（你已實作、實測可用）= 三軌同一套：
   C13-① 全檔唯一 const API_KEY = ""; 做平台注入 slot（v3.7.0 實測：重複會改錯位）
   C13-② fetch 加 credentials:'include'；冇 key 時唔加 ?key=，平台請求代理加認證（v3.9.0 實測）
   C13-③ 本機／BYOK 後備：用戶自己入 key，safeStore 保存，離開 Canvas 都用得
② 另一類 app：AI Studio Build 全端 app（有 server route）先至用
   GEMINI_API_KEY 做 server-side secret（§1）—— 同單一 HTML 唔同類，唔好撈亂。
③ 香港可用 = Canvas preview 靠 C13 三軌；要交付永久用就係零 key 單一 HTML
   （drawscout.html 水印解碼器）或者免金鑰 provider（Pollinations）經 server route。
④ 單一 HTML 上限 5MB（C13-g），唔強制瘦身；本機 placeholder 注入器只係另一條本機手動路，
   唔等同 C13 自動注入，亦唔應該被叫做「官方機制」。
```

> 官方依據（全端 app 類）：[Build apps in Google AI Studio — API Key management](https://ai.google.dev/gemini-api/docs/aistudio-build-mode#api_key_management)、
> [Full-stack: Manage secrets securely](https://ai.google.dev/gemini-api/docs/aistudio-fullstack)、
> [Decoded: How AI Studio securely proxies Gemini API requests](https://glaforge.dev/posts/2026/02/09/decoded-how-google-ai-studio-securely-proxies-gemini-api-requests/)。
> 單一 HTML 嘅三軌做法依據係**你嘅實作 + VERSION_LOG 實測**（[16 案例 §2](16-canvas-case-scout-comic.md#2--自動注入你已經實作而且真係用到)）。
> 體積：社群回報 AI Studio app 檔案總量上限 10MB ([2](https://discuss.ai.google.dev/t/10mb-maximum-size-for-apps-google-ai-pro-subscriber/86062))；你實測用 **5MB** 做保守硬上限。

---

## 1. 官方自動注入機制（AI Studio Build / Canvas）

> 「When you create a new web app that uses the Gemini API, AI Studio **automatically configures your Gemini API key as a secret in the app's server-side environment**. … **API keys are injected into the server-side runtime and are never included in client-side code.**」

| 環境 | Key 點嚟 | 前端見到？ | 注意 |
|------|----------|-----------|------|
| **AI Studio Build preview** | 自動設 `GEMINI_API_KEY` 做 server-side secret；Settings → **Secrets** panel 管理 | ❌ | 唔使手動設定就開到工 |
| **Cloud Run deploy** | key 自動帶入 server-side env | ❌ | **所有用戶嘅 call 都計你條 key** |
| **ZIP download／自己 host** | 你要喺 hosting env 設 `GEMINI_API_KEY` | ❌ | call 由 server-side code 發出，key 唔會曝露 |
| **Share app** | 人哋用到，睇唔到 key | ❌ | **用量計你度**；付費 model 有成本 |
| **Android** | Firebase AI Logic + App Check，唔用 raw key | ❌ | 另一套機制 |

其他官方要點：
- **2026-05-14 之前**整嘅 app，下次改 Gemini 功能時 agent 會自動幫你升級做 server-side 做法。
- 分享後用戶見到 **403 Access Restricted**，通常係 privacy extension（Privacy Badger 之類）或者 build issue；可以叫 agent「fix any build issues with the current code」再分享。
- AI Studio app 可以**雙向 sync GitHub**：Build mode → Add files → Import from GitHub；Settings → GitHub tab 連結 repo；push/pull 都有 conflict resolver。

### 對應我哋嘅模板

```
AI Studio server-side secret  ≈  Vercel env GEMINI_API_KEY + /api/proxy（VL1）
                              ≈  GAS ScriptProperties GEMINI_API_KEY + UrlFetchApp（X/C9）
                              ≈  你 prompt repo 嘅 app/api/generate/route.ts（Next.js server route）
```

**即係話**：我哋 `templates/vercel/api/proxy.mjs` 嘅「先 verifySession → 再由 `process.env` inject key」本身就係官方機制嘅本地版。`env.example` 要加返 `GEMINI_API_KEY` 一欄。

---

## 1.1 Canvas 單一 HTML artifact：你已實作嘅三軌自動注入（C13）

> 來源：用戶 `童軍漫畫生成器 v4.2.1` 嘅實際 code + `VERSION_LOG` v3.5.1／v3.7.0／v3.8.0／v3.9.0
> （[16 案例 §2](16-canvas-case-scout-comic.md#2--自動注入你已經實作而且真係用到)）。
> **呢個就係正確嘅注入方式**，唔好再將佢改成本機換 placeholder。

```js
// ✅ 你 app 嘅實際結構（簡化）
const API_KEY = "";                    // C13-①：全檔唯一注入 slot（平台可填入）

function resolveApiKey() {             // C13-③：BYOK 後備（safeStore）
  const cands = [API_KEY, window.GEMINI_API_KEY, window.__GEMINI_API_KEY__,
                 window.__API_KEY__, safeStore.get('drawscout_api_key')];
  for (const c of cands) { /* 揀第一個似 key 嘅 */ }
  return '';                           // 冇 key 唔拋錯，照樣送出請求
}

function apiUrl(model, method) {       // C13-②：冇 key 時唔加 ?key=
  const key = resolveApiKey();
  const base = `${API_BASE}/${model}:${method}`;
  return key ? `${base}?key=${encodeURIComponent(key)}` : base;
}
fetch(url, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body });
//   冇 key → 平台代理加 X-Goog-Api-Key；有 key → 本機 / file:// 直接 call
```

| 軌 | 你做咗乜 | 點解重要 |
|----|----------|----------|
| **C13-① 唯一 slot** | 全檔**只准一處** `const API_KEY = ""` | v3.7.0 實測：兩處相同宣告會令平台注入改錯位，真正宣告仍然空值 |
| **C13-② 平台代理** | `credentials:'include'` + 冇 key 時**唔加 `?key=`** | v3.9.0 實測：平台係靠請求代理加認證；移除「冇 key 就拋錯」，先照樣送出請求 |
| **C13-③ BYOK 後備** | `safeStore`（localStorage try/catch）+ API 狀態徽章 + 缺 key 就地輸入自動續跑 | v3.5.1 實測：Canvas sandbox 存取 localStorage 即拋錯令全 app 停擺 |

**唯一可選加固（唔影響上面三軌）**：C13-③ 嘅 BYOK key 由 `?key=` query 改做
`x-goog-api-key` header（A1/W6 —— key 放 URL 會落 server log／history／referrer）。
其餘注入機制**唔使改**。

| 常見誤解 | 正確 |
|----------|------|
| 「以為要本機換 `__INJECT_GEMINI_API_KEY__` 先叫注入」 | 唔係。你嘅 C13 三軌就係自動注入，已實作可用 |
| 「以為 `const API_KEY = ""` 註解係過時」 | 唔係。佢係 ① 嘅注入 slot，註解正確，只需要保持全檔唯一 |
| 「以為要將 2.04MB HTML 瘦身到 2MB 以下」 | 唔係。**單一 HTML 5MB 上限、唔強制瘦身**（C13-g） |

**點分兩類 app**：有 `server.js`／`/api/*` route／Vite build → §1 server-side secret；
得一個 HTML、`fetch(generativelanguage...)`、`credentials:'include'` → C13 三軌注入。
兩類**都係正確**，只係適用場景唔同。

---

## 2. 香港真正用得到嘅做法（你個水印 HTML 就係）

你 [`api` repo 嘅 `docs/ai.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/ai.md)（2026-09-29）實測：
**Google AI Studio / Gemini API（`ai.google.dev`）香港 IP 直接封**；Gemini **網頁版** 2026-03 開放咗，所以 **Canvas 用得**，但 runtime 直接由香港瀏覽器打 `generativelanguage.googleapis.com` 係唔通。

> ⚠️ **唔好過度推論**：「Canvas 用得」係因為 [1.1 C13 三軌注入](#11-canvas-單一-html-artifact你已實作嘅三軌自動注入c13) 幫你加認證，
> **唔代表**你可以喺 `file://`／自己 host 嘅 HTML 度直接打 Gemini endpoint。
> 你個 `童軍漫畫生成器 v4.2.1` 喺 Canvas preview 正常，就係靠呢條代理；拎咗出嚟就要自己有 key 或轉 server-side。
> 所以**交付**俾香港用戶嘅首選，依然係下面 2.1 嘅零 key 單一 HTML。

### 2.1 首選：零 key 單一 HTML（Type A/B）— 水印解碼器模式

你畀我嘅 `drawscout.html` 就係標準答案：

```
✅ 一個 HTML，純瀏覽器 Canvas + DCT 數學，無 fetch、無 key、無 server
✅ Gemini / Canvas 負責「生成」呢個 HTML；生成完之後唔需要再 call AI
✅ 香港任何瀏覽器、file://、WhatsApp 傳圖都用得
✅ 天然符合 A1（無 secret）、W1（版權頁尾）、V1（雙版號）
```

> **呢個就係香港能用嘅方式**：AI 嘅價值放喺**生成期**，唔係放喺**運行期**。
> 已收錄做 [drawscout_decoder_v1.0.html](../templates/watermark/drawscout_decoder_v1.0.html) 同
> [scout_generator_v1.0.html](../templates/watermark/scout_generator_v1.0.html)。

### 2.2 — 2.4 三條「要 runtime AI」嘅路（揀一條）

| 路 | 做法 | 香港適用 | 注意 |
|----|------|----------|------|
| **2.2 免金鑰 provider（首選）** | `prompt/app/api/generate/route.ts` default = Pollinations，server route 只計 URL 返去，瀏覽器自己抓 | ✅ | 其他供應商先至要 key；避開 serverless timeout |
| **2.3 BYOK** | 用戶自己入 key → `/api/generate` server route → forward → 用完即丟 | ✅ | 唔用你 quota；但 key 經瀏覽器，`localStorage` 有 XSS 風險 → 最少用 `sessionStorage` + 唔好 log（[官方論壇爭議](https://discuss.ai.google.dev/t/ai-studio-keeps-telling-me-that-i-dont-need-to-ask-users-to-provide-their-api-key/96994)） |
| **2.4 server-side secret** | AI Studio Build → Cloud Run / Vercel env `GEMINI_API_KEY` / GAS `ScriptProperties` + `UrlFetchApp` | ⚠️ 開 key 有障礙 | 請求由伺服器發出唔係香港瀏覽器；但 key 本身要喺 AI Studio 攞，而香港封咗 → 替代 Vertex AI／OpenRouter／GitHub Models |

```ts
// 2.2 唯一真理（prompt repo）
const { provider = 'pollinations', apiKey = '', ... } = body;
if (provider !== 'pollinations' && !apiKey) return 400;
```
> 三條路共同點：**key 唔寫檔、唔入庫、唔 `console.log`、唔出現喺回應**。

### 2.5 另一條路：本機手動注入（唔等同 C13 自動注入）

[inject_key_v1.0.mjs](../templates/watermark/inject_key_v1.0.mjs) 嘅 `__INJECT_GEMINI_API_KEY__` + 本機換 key：**只限本機測試**，係一條**手動**後備路，**唔等同**你已實作嘅 C13 三軌自動注入。注入版 `_local_` 永不入 Git。

---

## 3. ⚠️ 真實陷阱：AI Studio export 會靜靜 inline key 入 client bundle

2026-10 有開發者公開報告：AI Studio「Build apps」export 嘅 `vite.config.ts` 用咗

```ts
const env = loadEnv(mode, '.', '');           // 空前綴 = 載入晒所有 OS env var
define: { 'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY) }
```

Vite 預設前綴係 `VITE_`（就係為咗防止非公開 var 入 client），**空前綴關咗呢層保護**，`define` 會喺 build 時做字面替換，key 變成 plain text 入咗 bundle。
佢哋一個**完全冇 AI 功能**嘅內部 ERP 工具，就咁洩漏咗條 key，**94 日被碌咗約 USD 4,010**。
來源：[Google AI Developers Forum — export silently inlines OS-level GEMINI_API_KEY](https://discuss.ai.google.dev/t/ai-studio-build-apps-export-silently-inlines-os-level-gemini-api-key-into-the-client-bundle-loadenv-with-empty-prefix-usd-4-010-in-unauthorized-charges/188776)。

**防線（已加入 `scripts/guard.mjs`）**：
```
✓ export 之後 grep dist/**/*.js 有冇 AIza... → 有即 fail（A1/W6）
✓ vite.config.* 唔准用 loadEnv(..., '') 空前綴 → fail
✓ key 加 restriction：2026-05-28 起 AI Studio 新 key 係 auth key（綁 service account）；
  unrestricted standard key 已被拒（[官方 API key 文件](https://aistudio.google.com/docs/api-key)）
✓ 設 billing alert + 每季 rotate（A2）
```

---

## 4. Gemini Canvas prompt（正確版）

貼去 Canvas 對話，唔好貼真 key：

````text
幫我生一個單一 HTML App，AI 功能用已驗證可用嘅三軌自動注入：
1. 全檔唯一 const API_KEY = ""; 做平台注入 slot，唔好有第二處相同宣告。
2. fetch 加 credentials:'include'；冇 key 時唔好加 ?key=，由平台請求代理加認證。
3. 另外提供本機／BYOK 後備：用戶自己入 key，用 x-goog-api-key header 傳（唔好放 query）。
4. localStorage 一律 try/catch（Canvas sandbox 會拋錯）。
5. 缺 key 時先照樣送出請求（平台可能代理），失敗先顯示清楚原因，唔好一開始就拋錯。
6. 單檔上限 5MB，唔強制瘦身；頁尾 © SCOUT SYSTEM + 檔名／內文雙版號。
7. export／build 之後檢查 dist 無 AIza...；vite.config 唔好用 loadEnv(mode,'.','')。
````

---

## 5. 修正對照（一句版）

| 以為 | 其實 |
|------|------|
| 自動注入 = 本機換 `__INJECT_GEMINI_API_KEY__` | = **C13 三軌**（唯一 slot + 平台代理 + BYOK），已實作可用 |
| `const API_KEY = ""` 係過時 | 係 ① 注入 slot，註解啱，重點係全檔唯一 |
| 單一 HTML 要瘦身到 2MB | **C13-g**：5MB 上限、唔強制瘦身（越輕越快，可選） |
| 香港一定要換 provider | 首選零 key 單一 HTML；Canvas preview 靠 C13 代理 |
| Type B 生成器一定要 call AI | 水印嵌入零 key、可離線；API 按鈕只係示範 |

---

## 6. 驗收 checklist

```
[ ] 交付 HTML 零 key、零 fetch AI endpoint（除非經 server route／Canvas 代理 C13）
[ ] server route 由 env 攞 GEMINI_API_KEY；缺 key 即 CONFIG_MISSING（F12）
[ ] key 用 x-goog-api-key header，唔好 ?key= 落 URL（A1/W6）
[ ] Canvas 單一 HTML：C13 三軌齊（唯一 slot + credentials:'include' + BYOK 後備）、localStorage try/catch
[ ] export/build 後 dist grep 無 AIza...（guard checkBundleLeak 自動驗）
[ ] vite.config 無 loadEnv 空前綴／define API_KEY（guard checkEnvLeakPattern 自動驗）
[ ] key 有 restriction + billing alert + rotation 步驟（A2）
[ ] 香港用戶實測：零 key 路徑完全通；AI 路徑有 fail-closed 提示
[ ] 頁尾 © SCOUT SYSTEM + 檔名／內文雙版號（W1/V1）
[ ] 單一 HTML ≤ 5MB（C13-g，唔強制瘦身）+ node scripts/audit_single_html_v1.0.mjs <檔名> 無 FAIL
[ ] node scripts/guard.mjs 綠
```

---

## 7. 來源

- [Build apps in Google AI Studio（官方，API Key management / FAQ）](https://ai.google.dev/gemini-api/docs/aistudio-build-mode#api_key_management)
- [Develop full-stack apps — Manage secrets securely（官方）](https://ai.google.dev/gemini-api/docs/aistudio-fullstack)
- [Using Gemini API keys（官方，auth key / env var）](https://aistudio.google.com/docs/api-key)
- [Decoded: How AI Studio securely proxies Gemini API requests（server.js inject `X-Goog-Api-Key`）](https://glaforge.dev/posts/2026/02/09/decoded-how-google-ai-studio-securely-proxies-gemini-api-requests/)
- [Forum: export silently inlines key into client bundle（USD 4,010 事件）](https://discuss.ai.google.dev/t/ai-studio-build-apps-export-silently-inlines-os-level-gemini-api-key-into-the-client-bundle-loadenv-with-empty-prefix-usd-4-010-in-unauthorized-charges/188776)
- [Forum: BYOK vs env var 爭議](https://discuss.ai.google.dev/t/ai-studio-keeps-telling-me-that-i-dont-need-to-ask-users-to-provide-their-api-key/96994)
- 你嘅 repo：[`api/docs/ai.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/ai.md)、[`api/docs/hk-blocked.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/hk-blocked.md)、[`prompt/app/api/generate/route.ts`](https://github.com/playerkousas-rgb/prompt/blob/main/app/api/generate/route.ts)
- **你嘅實測證據（C13 唯一真理）**：[16 — 童軍漫畫生成器 v4.2.1 案例](16-canvas-case-scout-comic.md)（`VERSION_LOG` v3.5.1／v3.7.0／v3.8.0／v3.9.0）
- 體積參考：[AI Studio app 檔案總量 10MB 討論](https://discuss.ai.google.dev/t/10mb-maximum-size-for-apps-google-ai-pro-subscriber/86062) — 你用 5MB 做保守硬上限（C13-g）
