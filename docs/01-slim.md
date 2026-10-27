# 01 — 瘦身（S1–S12）

> 目標：**唔好用嘅嘢一件都唔部署**。瘦身唔止慳 quota，仲直接影響冷啟動、CI 時間、attack surface。
> 硬數字來自 ecportal 實戰（[BUILD.md §10](../BUILD.md)）；所有數字都由 `scripts/guard.mjs` 或 CI 把守。

---

## S1 — `api/` 零 runtime 依賴

```js
// ✅ 得
import { createHmac, timingSafeEqual } from 'node:crypto';
const r = await fetch(url, { method: 'POST', body });

// ❌ 唔得
import axios from 'axios'; import _ from 'lodash'; import moment from 'moment';
```

理由：Vercel Function 每個 dependency 都增加冷啟動同 bundle；Serverless 上 `fetch` / `crypto` 已經夠。
真係要用重型 lib → 只可以入 `devDependencies` 或用 CDN 動態載入（唔入 serverless bundle）。

---

## S2 — `.vercelignore` 係最重要嗰個檔

Vercel 上傳**整個工作目錄**（除非 ignore）。少呢個檔 = 上傳 `node_modules` + `.git` + 測試 + 舊檔 = 儲存配額即爆。

```gitignore
# .vercelignore（範本：templates/vercel/vercelignore）
node_modules/
.git/
.vercel/
.cache/
coverage/
__tests__/
tests/
docs/
operations/
uploads/
*.md
*.bak
*.tmp
*.old
*.log
.env*
```

> **`.md` 都要擋**：維運文件只留 Git，唔部署到公開網站（[進度追蹤旅系統升級版.md §9](../進度追蹤旅系統升級版.md) 已有呢條教訓）。

---

## S3 — `package.json` 極簡

```json
{
  "private": true,
  "type": "module",
  "scripts": { "build": "...", "check": "node scripts/guard.mjs", "test": "..." },
  "dependencies": {},
  "devDependencies": { "vite": "6.x" }
}
```

配 `vercel.json`：`"installCommand": "npm install --include=dev"`。
> ⚠️ **2026-10-27 勘誤**：舊版寫 `--omit=dev`，係**錯**。Vercel 官方講明 build 階段要裝 `devDependencies`（`vite` 喺度）[2](https://vercel.com/docs/builds/configure-a-build)；
> `NODE_ENV=production` 會令 npm 跳過 devDeps，出現 `vite: command not found` [4](https://vercel.com/kb/guide/dependencies-from-package-json-missing-after-install)。
> `--include=dev` 強制裝，唔受 Dashboard 設定影響。**S1「`dependencies` 空白」約束嘅係 runtime，唔係 build。**

---

## S4 — `vercel.json` 只部署最終產物

```json
{
  "framework": null,
  "outputDirectory": "dist",
  "installCommand": "npm install --include=dev",
  "cleanUrls": true,
  "regions": ["hkg1"]
}
```

- `framework: null` 防止 Vercel 自動偵測後幫你跑多餘 build。
- `regions: ["hkg1"]`：香港用戶延遲最低；同時避免多地區複製 log／artifact。
- 完整範本：[templates/vercel/vercel.json](../templates/vercel/vercel.json)

---

## S5 — 死重檔案零容忍

```bash
# 搵無人引用嘅圖／檔（每個 repo 都應該有 npm run slim:dead）
grep -R "images/" --include='*.html' --include='*.css' --include='*.js' . || true
find public assets -type f -printf '%s %p\n' | sort -nr | head -20

# 即刻刪
find . -name '*.bak' -o -name '*.tmp' -o -name '*.old' -o -name '*.log' | xargs -r rm
```

**規則**：`*.bak` / `*.tmp` / `*.old` / `*.log` / `*.zip` / `*.psd` / 高清原圖一律唔入 Git。
要保留舊版 → 用 Git tag / commit，唔好用 `index_v2_final_FINAL.html`。

---

## S6 — 圖片同媒體

| 項目 | 上限 |
|------|------|
| 格式 | AVIF（優先）／WebP；PNG 只留 icon／transparent |
| 單檔（部署資源） | `< 500KB` |
| 上載單檔 | `≤ 5MB` |
| 每筆上載 | 3 張 |
| 每單位每日總量 | server 端計，超即拒（見 A8） |

```bash
# 批量轉 AVIF
for f in public/images/*.{jpg,png}; do
  magick "$f" -resize '1600x1600>' -quality 45 "${f%.*}.avif" && rm "$f"
done
```

---

## S7 — CI 硬攔體積

> ⚠️ **適用範圍（2026-10-27 定案，C13-g）**：呢條係 **Vercel / `dist` 部署類**嘅規則。
> **單一 HTML / Gemini Canvas app 完全唔同類**：唔經 Vercel、**唔強制瘦身**，
> 唯一硬上限係 **Gemini Canvas 5MB**（用戶實測保守值；社群有講 app 檔案總量 10MB）。
> **但上限唔係目標**：越輕量 LOAD 越快 —— 減無用 base64／外置大圖係建議，唔係 CI fail 條件。
> 所以 `dist < 5MB` / `bundle < 2MB` / `圖 < 500KB` **唔好套落單一 HTML**；
> inline base64 角色圖、最長一行幾長、CDN 幾個都只係 INFO，唔判 FAIL。
> 見 [docs/09 C13-g](09-gemini-canvas.md#c13--單一-html-體積同自動注入2026-10-27-定案) 同 [docs/16 案例](16-canvas-case-scout-comic.md)。

```yaml
- name: Size gate
  run: |
    BYTES=$(du -sb dist | cut -f1)
    echo "dist = $BYTES bytes"
    [ "$BYTES" -lt 5242880 ] || { echo "::error::dist >= 5MB (S7)"; exit 1; }
    find dist -type f -size +2M -print | grep . && { echo "::error::bundle >= 2MB (S7)"; exit 1; } || true
```

`dist < 5MB`、`單一 bundle < 2MB`。**CI fail = 唔准 deploy**，唔好靠人眼睇。

---

## S8 — 部署衛生

| 設定 | 值 | 點解 |
|------|-----|------|
| Preview Deployment（非 main） | **關閉** | 每個 branch 一份 artifact = 配額殺手 |
| Deployment Retention | **7 日** | 舊 deployment 永久保留會累積儲存 |
| Production branch | `main` only | 其他 branch 只跑 CI，唔出 deployment |
| Cron / 定時 job | 一個 project 一條 | 避免重複跑 push / scrape |

位置：Vercel Dashboard → Project → Settings → Git / Deployment Protection / Retention。

---

## S9 — 上載面配額（server 計，唔信前端）

```js
const LIMITS = { maxBytes: 5*1024*1024, perRecord: 3, perUnitPerDay: 50*1024*1024 };
const ALLOWED = new Set(['image/avif','image/webp','image/jpeg','image/png','application/pdf']);
// 先驗 MIME + size → 再查當日累計 → 先至寫入待批表
```

前端限制只係 UX；**真正攔截一定要喺 server**。

---

## S10 — Git 瘦身

```gitignore
# .gitignore（範本：templates/git/gitignore）
node_modules/ dist/ build/ .vercel/ .cache/ coverage/
.env .env.* !.env.example
*.log *.bak *.tmp *.old
*.zip *.tar.gz *.psd *.ai *.mp4 *.mov
.DS_Store Thumbs.db
```

- 每個檔案 `< 1MB` 為原則（`scripts/guard.mjs` 會掃 >1MB 檔）。
  - **例外 C13-g**：`.html` 單一 HTML / Gemini Canvas 交付檔上限 **5MB**，guard 會對 HTML 用 5MB 而非 1MB。
- 真係要 binary → Git LFS，且只放 `assets/`，唔好放 `public/` 直接部署。
- 誤 commit 大檔：用 `git filter-repo --strip-blobs-bigger-than 1M` 清歷史，再 force push（**要通知所有協作者重新 clone**）。
- `git count-objects -vH` 定期睇 repo 大小。

---

## S11 — 平台 payload 瘦身

### Google Apps Script
- request/response body `≤ 900KB`（`sig` 驗證亦以此為上限，見 [03-security A7](03-security.md)）。
- 一律 `getRange().setValues()` 批量，唔好逐格 `setValue()`。
- 大庫分件 `saveDbPart` / 分段 `loadDbPart`（每段核 version）。
- `CacheService`  cache 5 分鐘；`ScriptLock` 只鎖寫入，唔好鎖全表讀。
- log 只記 metadata（ts、action、bytes），**唔好 `Logger.log(整個 db)`**。

### Supabase
- 禁 `select *`；只揀需要欄位；所有 list 要 `.range(0, 99)` 分頁。
- log / notification 表每日 purge，保留 24 個月（A13）。
- 檔放 Storage，DB 只存 path；唔好 base64 入 text column。
- 推送訂閱表只存 `endpoint_hash` / `client_token_hash`（唔存身份），見 [08-supabase](08-supabase.md#u9--推送訂閱個人化訂閱基建)。

---

## S12 — 自動化（唔靠記性）

```bash
node scripts/guard.mjs        # 本機
```

CI 跑同一條（[.github/workflows/guard.yml](../.github/workflows/guard.yml)）。守：

- 必需檔存在
- 疑似 secret（sk_live / ghp_ / AKIA / eyJ / 私鑰 header）
- 大檔、禁用副檔名、dist 體積
- `.vercelignore` 內容完整
- Markdown 內部連結有效

> 每週一次 CI scheduled run，就算冇 commit 都會掃一次，防止「靜靜变肥」。

---

## 瘦身驗收（一分鐘版）

```
[ ] api/ 零 dependency
[ ] .vercelignore 存在 + 內容齊
[ ] dependencies 空白 / devDependencies 放建置工具
[ ] du -sb dist < 5MB
[ ] 無 *.bak/tmp/old/log、無 >1MB 檔入 Git（單一 HTML 例外：5MB，C13-g）
[ ] 圖全部 AVIF/WebP 且 <500KB（Vercel/dist 類；單一 HTML 唔使）
[ ] Preview 關 + retention 7
[ ] guard 綠
```
