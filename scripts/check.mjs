#!/usr/bin/env node
// ecportal — 統一檢查入口：check / lint / slim
// 零依賴，Vercel 與本地皆可跑
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const args = process.argv.slice(2)
const isLint = args.includes('--lint')
const isSlim = args.includes('--slim')

function run(script) {
  const res = spawnSync('node', [script, ...args], { stdio: 'inherit' })
  if (res.status !== 0) process.exit(res.status)
}

if (isLint) {
  console.log('▶ lint — 檢查 Markdown / 配置語法 (零依賴)')
  // 輕量語法檢查：JSON 可解析、BUILD.md 存在
  const { readFileSync } = await import('node:fs')
  for (const f of ['vercel.json', 'package.json']) {
    try { JSON.parse(readFileSync(f, 'utf8')); console.log(`  ✓ ${f} JSON 合法`) }
    catch (e) { console.error(`  ✗ ${f} JSON 非法: ${e.message}`); process.exit(1) }
  }
  if (!existsSync('BUILD.md')) { console.error('  ✗ BUILD.md 缺失 (唯一真理不可刪)'); process.exit(1) }
  console.log('  ✓ lint 通過')
  // 繼續往下做 slim 檢查
}

console.log('▶ check — 核心規則校驗')
run('scripts/check-size.mjs')
run('scripts/check-dead-assets.mjs')
run('scripts/check-deps.mjs')

if (isSlim) {
  console.log('▶ slim — 額外瘦身審計完成')
}

console.log('✓ check 全部通過 (零倒退)')
