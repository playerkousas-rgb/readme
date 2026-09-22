#!/usr/bin/env node
// 依賴極簡守門員：dependencies 必須為空或僅白名單；重型套件必須在 devDependencies
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname ?? '.', '..')
const pkgPath = join(ROOT, 'package.json')
if (!existsSync(pkgPath)) {
  console.log('  • 無 package.json — 跳過依賴檢查')
  process.exit(0)
}
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const deps = pkg.dependencies || {}
const devDeps = pkg.devDependencies || {}

const HEAVY = ['lodash', 'moment', 'axios', 'webpack', 'babel', 'typescript', 'eslint', 'prettier', 'vite', 'tailwindcss', 'next', 'react', 'vue']
// 白名單：目前 ecportal 要求「api 零依賴」，故 dependencies 應為空；若日後確需 runtime 依賴，請在此白名單登記並附理由
const ALLOWED_RUNTIME = new Set([])

let errors = 0

// 1) dependencies 檢查
for (const [name, ver] of Object.entries(deps)) {
  if (!ALLOWED_RUNTIME.has(name)) {
    console.error(`✗ dependencies 含非白名單套件 "${name}@${ver}" — 請移至 devDependencies 或改用 CDN/原生方案 (體積治理)`)
    errors++
  }
}
// 重型套件誤入 dependencies
for (const h of HEAVY) {
  if (deps[h]) {
    console.error(`✗ 重型套件 "${h}" 在 dependencies (會進生產快取) — 必須移至 devDependencies`)
    errors++
  }
}

// 2) devDependencies 若含重型套件，提示改 CDN/原生
if (Object.keys(devDeps).length > 0) {
  console.log(`  • devDependencies: ${Object.keys(devDeps).join(', ')}`)
  for (const h of ['moment', 'lodash']) {
    if (devDeps[h]) console.warn(`  ⚠ devDependencies 含 "${h}" — 考慮用原生 Intl/date-fns 輕量替代`)
  }
} else {
  console.log('  • dependencies / devDependencies 皆為空 — 極簡合格 (api 零依賴)')
}

// 3) 檢查是否誤把建置工具放 dependencies
const BUILD_TOOLS = ['vite', 'tailwindcss', 'postcss', 'autoprefixer', '@vitejs']
for (const b of BUILD_TOOLS) {
  if (deps[b]) {
    console.error(`✗ 建置工具 "${b}" 在 dependencies — 必須在 devDependencies (Vercel 生產不需快取)`)
    errors++
  }
}

if (errors) { console.error(`✗ check-deps 失敗: ${errors} 項錯誤`); process.exit(1) }
console.log('  ✓ check-deps 通過 (依賴極簡)')
