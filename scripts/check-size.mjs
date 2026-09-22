#!/usr/bin/env node
// 體積守門員：dist <5MB、單檔 <500KB、bundle <2MB (若存在)、圖片 AVIF 優先
import { readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = join(import.meta.dirname ?? '.', '..')
const DIST = join(ROOT, 'dist')

const LIMITS = {
  distMB: 5,
  singleKB: 500,
  bundleKB: 2048, // 2MB
  imageExtAllowed: new Set(['.avif', '.webp', '.svg', '.ico']), // 禁止未壓縮高解析度 jpg/png 未轉 avif (大於 200KB 即告警)
}

let errors = 0
let warns = 0

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name)
    if (ent.isDirectory()) {
      if (['.git', 'node_modules', '.vercel', '.cache'].includes(ent.name)) continue
      walk(full, out)
    } else out.push(full)
  }
  return out
}

function fmt(b) { return b < 1024 ? `${b}B` : b < 1024*1024 ? `${(b/1024).toFixed(1)}KB` : `${(b/1024/1024).toFixed(2)}MB` }

// 1) 若 dist 存在，檢查總體積
if (existsSync(DIST)) {
  const files = walk(DIST)
  const total = files.reduce((s, f) => s + statSync(f).size, 0)
  console.log(`  • dist 體積: ${fmt(total)} (${files.length} 檔)  上限 ${LIMITS.distMB}MB`)
  if (total > LIMITS.distMB * 1024 * 1024) { console.error(`    ✗ 超限！請移除未引用高解析度原圖/重複快取`); errors++ }
  else console.log('    ✓ dist 體積合格')

  for (const f of files) {
    const sz = statSync(f).size
    if (sz > LIMITS.singleKB * 1024) {
      const rel = f.replace(ROOT + '/', '')
      console.error(`    ✗ 單檔超限 ${fmt(sz)} > ${LIMITS.singleKB}KB — ${rel}`)
      errors++
    }
    const ext = extname(f).toLowerCase()
    if (['.jpg', '.jpeg', '.png'].includes(ext) && sz > 200*1024) {
      console.warn(`    ⚠ 圖片未轉 AVIF 且 >200KB — ${f.replace(ROOT+'/', '')} (${fmt(sz)}) 建議轉 AVIF/WebP`)
      warns++
    }
    if (f.includes('bundle') && sz > LIMITS.bundleKB * 1024) {
      console.error(`    ✗ bundle 超限 ${fmt(sz)} > ${LIMITS.bundleKB}KB — ${f}`)
      errors++
    }
  }
} else {
  console.log('  • dist 尚未生成 (執行 npm run build 後會檢查)，跳過總量校驗')
}

// 2) 倉庫本身體積 (不含 .git / node_modules)
const repoFiles = walk(ROOT)
const repoTotal = repoFiles.filter(f => !f.includes('.git/') && !f.includes('node_modules/')).reduce((s, f) => { try { return s + statSync(f).size } catch { return s } }, 0)
console.log(`  • 倉庫工作目錄 (不含 .git/node_modules): ${fmt(repoTotal)}`)
if (repoTotal > 5 * 1024 * 1024) {
  console.warn(`    ⚠ 倉庫本身已 >5MB，雖靠 .vercelignore 不上 Vercel，但建議清理死重檔案 (npm run slim:dead)`)
  warns++
}

// 3) 檢查是否誤提交大檔到 Git (Vercel 也會因 clone 變慢)
for (const f of repoFiles) {
  if (f.includes('.git/')) continue
  try {
    const sz = statSync(f).size
    if (sz > 500*1024 && !f.includes('dist/')) {
      const ext = extname(f).toLowerCase()
      if (['.png','.jpg','.jpeg','.mp4','.zip','.pdf'].includes(ext)) {
        console.warn(`    ⚠ 倉庫內大檔 ${fmt(sz)} — ${f.replace(ROOT+'/', '')} 請確認是否被引用，否則刪除或轉 AVIF`)
        warns++
      }
    }
  } catch {}
}

if (errors) { console.error(`✗ check-size 失敗: ${errors} 項錯誤`); process.exit(1) }
if (warns) console.log(`  ◎ 告警 ${warns} 項 (可接受但建議優化)`)
console.log('  ✓ check-size 通過')
