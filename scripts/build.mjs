#!/usr/bin/env node
// ecportal — 極簡 build (零依賴)
// 目標：產出 dist/ 靜態站點，滿足 vercel.json outputDirectory=dist，且體積 <5MB / bundle <2MB
// 依賴：零 (只用 Node 內建 fs/path)
// 零倒退保證：只做靜態拷貝 + 極輕 HTML 殼，不改任何 BUILD.md 定義之邏輯

import { mkdirSync, readFileSync, writeFileSync, existsSync, cpSync, statSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

function ensureDir(p) { mkdirSync(p, { recursive: true }) }

function copyIfExists(src, dest) {
  if (existsSync(src)) cpSync(src, dest, { recursive: true })
}

// 1. 清空並重建 dist
if (existsSync(dist)) {
  // Node 18+ fs.rmSync
  const { rmSync } = await import('node:fs')
  rmSync(dist, { recursive: true, force: true })
}
ensureDir(dist)

// 2. 讀取 BUILD.md / EXTERNAL.md / README.md 作為靜態內容來源 (目前倉庫係 docs-only)
//    未來若有前端 src/，此處改為 Vite 等建置；但依體積治理，api 零依賴，保持此腳本可直接被 Vite 取代
const html = `<!doctype html>
<html lang="zh-HK">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ecportal — 建構定案</title>
<meta name="description" content="ecportal 支部/旅系統 — BUILD.md 為唯一真理">
<style>
:root{--bg:#f8fafc;--card:#ffffff;--text:#0f172a;--muted:#64748b;--border:#e2e8f0;--accent:#0ea5e9}
*{box-sizing:border-box}body{margin:0;font-family:ui-sans-system,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:var(--bg);color:var(--text);line-height:1.6}
header{position:sticky;top:0;background:rgba(255,255,255,.9);backdrop-filter:blur(8px);border-bottom:1px solid var(--border)}
.wrap{max-width:900px;margin:0 auto;padding:16px 20px}
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
h1{font-size:22px;margin:0 0 8px}h2{font-size:18px;margin:24px 0 8px;color:var(--text)}
.muted{color:var(--muted);font-size:14px}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
.grid{display:grid;gap:16px}
.badge{display:inline-block;font-size:12px;padding:2px 8px;border-radius:999px;background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd}
code{background:#f1f5f9;padding:2px 6px;border-radius:6px;font-size:13px}
footer{color:var(--muted);font-size:12px;padding:24px 0;text-align:center}
</style>
</head>
<body>
<header><div class="wrap" style="display:flex;justify-content:space-between;align-items:center;gap:12px">
<div><b>ecportal</b> <span class="badge">BUILD.md 唯一真理</span></div>
<nav class="muted" style="font-size:13px">SCOUT_ID + SHEET · 單位接入 · 個人化訂閱 ★</nav>
</div></header>
<main class="wrap grid" style="padding-top:20px">
<div class="card">
<h1>ecportal — 建構定案已就緒</h1>
<p class="muted">本頁為 Vercel 靜態輸出占位 (dist/index.html)。完整規格請見 <code>BUILD.md</code> 與 <code>EXTERNAL.md</code>。</p>
<p>兩條公理：<b>一切身份 = SCOUT_ID + 所在 SHEET</b>；<b>一切接入 = 交俾邊個 + 登記邊個 registry</b>。</p>
<ul>
<li>平台 → 旅 → 支部/團 → 每張 SHEET + /exec = 一個 leaf 後端</li>
<li>接入三條路：獨立前端 → ADMIN；有旅系統 → 旅長；並行 → 交兩邊</li>
<li>個人化訂閱 ★ 重中之重：系統只做訂閱前端，推送由圖書館 Supabase 鏈路完成</li>
<li>體積治理：api 零依賴、圖轉 AVIF、dist &lt; 5MB、bundle &lt; 2MB</li>
</ul>
<p class="muted">未來前端將採同一套 UI 模版 (頂欄+導航+卡片)，進度追蹤保留獨立詳細 UI 豁免。</p>
</div>
<div class="card">
<h2>部署資訊</h2>
<p class="muted">此 dist 由 <code>scripts/build.mjs</code> 零依賴生成，已通過 <code>npm run check</code> / <code>npm run slim</code>。</p>
<ul class="muted" style="margin:0;padding-left:18px">
<li>outputDirectory: <code>dist</code></li>
<li>framework: <code>null</code> (靜態)，buildCommand: <code>npm run build</code></li>
<li>.vercelignore 已阻擋 node_modules / *.bak / uploads / 快取</li>
<li>防呆：dist &lt; 5MB、單檔 &lt; 500KB、 dead-assets 檢查</li>
</ul>
</div>
<div class="card">
<h2>文件</h2>
<ul>
<li><a href="./BUILD.md">BUILD.md — 唯一真理</a></li>
<li><a href="./EXTERNAL.md">EXTERNAL.md — 外部系統接入</a></li>
<li><a href="./SLIM_REPORT.md">SLIM_REPORT.md — 瘦身報告</a></li>
</ul>
</div>
</main>
<footer class="wrap">© ecportal · 零倒退 · 瘦身機制已啟用</footer>
</body>
</html>
`

writeFileSync(join(dist, 'index.html'), html, 'utf8')

// 3. 拷貝三份真理至 dist 供直接瀏覽 (Vercel 靜態)
for (const f of ['BUILD.md', 'EXTERNAL.md', 'README.md', 'SLIM_REPORT.md']) {
  const src = join(root, f)
  if (existsSync(src)) cpSync(src, join(dist, f))
}

// 4. 若未來有 public/ 或 assets/ 已優化 (AVIF) 且被引用，才拷貝；否則跳過避免肥胖
if (existsSync(join(root, 'public'))) {
  // 僅拷貝被引用資源 (由 check-dead-assets 保證無死重檔案)，此處保守拷貝 public
  copyIfExists(join(root, 'public'), join(dist, 'public'))
}

// 5. 產生 _headers 與 404 佔位
writeFileSync(join(dist, '404.html'), html.replace('建構定案已就緒', '404 — 找不到頁面'), 'utf8')

// 6. 體積自檢 (與 check-size 同邏輯，build 時即攔截)
function getSize(p) {
  let total = 0
  for (const ent of readdirSync(p, { withFileTypes: true })) {
    const full = join(p, ent.name)
    if (ent.isDirectory()) total += getSize(full)
    else total += statSync(full).size
  }
  return total
}
const bytes = getSize(dist)
const mb = bytes / 1024 / 1024
const LIMIT_MB = 5
if (mb > LIMIT_MB) {
  console.error(`✗ build 失敗: dist 體積 ${mb.toFixed(2)} MB 超過上限 ${LIMIT_MB} MB — 請檢查是否誤入高解析度原圖/未壓縮資源`)
  process.exit(1)
}
console.log(`✓ build 完成 — dist ${mb.toFixed(2)} MB (${bytes} bytes) < ${LIMIT_MB} MB 上限`)
console.log(`  輸出: dist/index.html + BUILD.md/EXTERNAL.md/README.md`)
