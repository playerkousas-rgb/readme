# Vercel 瘦身與防爆必讀 — 新建設適用 (future-proof)

> **現狀**：倉庫已極簡 — 工作目錄僅 `BUILD.md`/`EXTERNAL.md`/`README.md` 三份真理，無前端代碼、無 `node_modules`、無圖片。此報告係**未來施工守則**，確保之後加代碼、上 Vercel 都唔會爆儲存。

## 1. 已做嘅預防 (本次新增)

| 檔案 | 作用 |
|------|------|
| `.vercelignore` | **最重要**。阻擋 `.git`/`node_modules`/`.vercel`/`.cache`/`*.bak`/`*.tmp`/`*.log`/`uploads/`/`*.test.*` 上 Vercel。只上傳 `dist` 產物 |
| `.gitignore` | 阻擋同上 + `dist/`/`coverage`/`.env` 入庫，防倉庫肥胖 |
| `vercel.json` | `framework: null` + `outputDirectory: dist` + `installCommand: npm install --omit=dev` + `regions: ["hkg1"]` — 只部署最終靜態產物 |
| `package.json` | `dependencies: {}` 零運行依賴 (`api` 用原生 `fetch`+`crypto`)，建置工具只可入 `devDependencies` |
| `scripts/check-*.mjs` | 本地守門：`dist<5MB`/單檔`<500KB`/無死重資源/無重型依賴 |
| `.github/workflows/slim.yml` | CI 守門：每次 push/PR 自動跑 `check`+`build`，超標即紅 |
| `AGENTS.md` | Agent 級別頂住，防越級亂加功能 (見 §4) |

## 2. 未來加代碼時點樣唔爆

1. **圖片/資源**：一律轉 `AVIF`/`WebP`，單檔 `<500KB`。放 `public/` 後必須喺 `HTML/CSS/JS` 有引用，否則 `npm run slim:dead` 會當死重檔報錯。
2. **備份檔**：嚴禁 `*.bak`/`*.tmp`/`*.old` 入庫 — `.gitignore`/`.vercelignore` 已攔，`check-dead-assets` 雙重攔。
3. **依賴**：`dependencies` 保持空或白名單。`vite`/`tailwind` 等建置工具必須入 `devDependencies`，Vercel 生產用 `npm install --omit=dev` 慳快取。`npm run check` 會攔重型庫誤入 `dependencies`。
4. **上傳測試**：`uploads/` 測試檔唔入庫唔上 Vercel，生產數據走 `Sheet`/`Drive`。
5. **儀表板手動項** (vercel.json 無此欄)：Vercel Dashboard → Settings → General → Preview Deployments 關閉非 `main` 分支；Retention 設 `7` 天。

## 3. 驗證 (零倒退)

```bash
npm run check  # size + dead-assets + deps
npm run lint   # JSON 語法 + BUILD.md 存在
npm run build  # 生成 dist/，內建 <5MB 自檢
```

2026-09-22 實測：`check` / `lint` / `build` 全綠，`dist` 30.6KB (6 檔) 遠低於 5MB 上限，工作目錄 80KB。

核心功能清單 (BUILD.md 定義) 未改一行 — 本次只加治理檔，零倒退。

## 4. Agent 級別 — 唔好咩都做曬

詳見 `AGENTS.md`。重點：

- **進度追蹤**與**通告圖書館**係兩回事。圖書館推送只屬通告模組 (BUILD.md §4 ★)，進度追蹤 UI 豁免、數據可共用 `SHEET` (ecportal 模式)，但**不可**順手加圖書館邏輯。想加 = 先經 `TROOP_MODULES` 登記，旅長批准。
- 五級：`ADMIN` > `TROOP_OPS` > `BRANCH` > `SHEET` > `EXTERNAL`，各守其轄，不得越級改他人 registry/Sheet。

---
*新建設必讀：跟住本檔，Vercel 就唔會爆。*
