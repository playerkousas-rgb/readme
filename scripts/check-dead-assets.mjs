#!/usr/bin/env node
// 死重檔案守門員：掃描 public/images/assets 等靜態目錄，若有檔案從未被引用則報錯
// 策略：全文 grep 檢查 HTML/CSS/JS/MD 對檔名的引用，未命中即視為死重
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs'
import { join, extname, basename } from 'node:path'

const ROOT = join(import.meta.dirname ?? '.', '..')
const ASSET_DIRS = ['public', 'images', 'assets', 'static', 'uploads']
const CODE_GLOBS = ['.html', '.css', '.js', '.ts', '.tsx', '.jsx', '.mjs', '.json', '.md']

function walk(dir, out=[]) {
  if (!existsSync(dir)) return out
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name)
    if (ent.isDirectory()) {
      if (['node_modules','.git','.vercel','dist'].includes(ent.name)) continue
      walk(full, out)
    } else out.push(full)
  }
  return out
}

const assetFiles = []
for (const d of ASSET_DIRS) {
  const full = join(ROOT, d)
  if (existsSync(full)) assetFiles.push(...walk(full))
}
// 備份檔亦視為死重
const allFiles = walk(ROOT)
const backupFiles = allFiles.filter(f => /\.(bak|tmp|old|log)$/i.test(f) && !f.includes('.git/'))
if (backupFiles.length) {
  console.error('✗ 發現開發備份檔 (應刪除，勿入庫亦勿上 Vercel)：')
  for (const f of backupFiles) console.error('  - ' + f.replace(ROOT+'/', ''))
  console.error('  → 請刪除或加入 .gitignore/.vercelignore')
  process.exit(1)
}

if (assetFiles.length === 0) {
  console.log('  • 未發現 public/images/assets 等靜態資源目錄 — 無死重檔案 (符合目前 docs-only 極簡狀態)')
  console.log('  ✓ check-dead-assets 通過')
  process.exit(0)
}

// 收集所有代碼文本用於引用檢查
const codeFiles = allFiles.filter(f => CODE_GLOBS.includes(extname(f).toLowerCase()) && !f.includes('.git/') && !f.includes('dist/') && !f.includes('node_modules/'))
let corpus = ''
for (const f of codeFiles) {
  try { corpus += '\n' + readFileSync(f, 'utf8') } catch {}
}

let dead = []
for (const af of assetFiles) {
  const base = basename(af)
  const rel = af.replace(ROOT+'/', '')
  // 若檔名出現在任一代碼中，視為被引用；否則死重
  // 同時檢查無後綴名引用 (如 CSS url)
  if (!corpus.includes(base) && !corpus.includes(rel)) {
    // 例外：允許 .gitkeep
    if (base === '.gitkeep') continue
    dead.push({ file: rel, size: statSync(af).size })
  }
}

if (dead.length) {
  console.error(`✗ 發現 ${dead.length} 個未被引用之死重資源 (高解析度原圖/孤立測試檔)：`)
  for (const d of dead) console.error(`  - ${d.file} (${(d.size/1024).toFixed(1)}KB)`)
  console.error('  → 請確認是否真的未引用，若無用請刪除；若有用請在代碼中引用或移至正確目錄')
  process.exit(1)
}

console.log(`  • 掃描 ${assetFiles.length} 個資源檔，全部有被引用`)
console.log('  ✓ check-dead-assets 通過')
