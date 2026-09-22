#!/usr/bin/env node
// 安裝瘦身防呆 Git hooks (本地執行一次即可，不影響 Vercel)
import { writeFileSync, existsSync, mkdirSync, chmodSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname ?? '.', '..')
const hookDir = join(root, '.git', 'hooks')
const hookPath = join(hookDir, 'pre-commit')

const content = `#!/bin/sh
# ecportal 瘦身防呆 — 提交前自動攔截肥胖
echo "▶ pre-commit: npm run check (size/dead/deps)"
npm run check || { echo "✗ 瘦身檢查失敗，禁止提交。請修復後重試。"; exit 1; }
# 額外阻擋 *.bak/*.tmp/*.old 誤提交 (雙重防呆)
if git diff --cached --name-only | grep -Eq '\\.(bak|tmp|old|log)$'; then
  echo "✗ 發現 *.bak/*.tmp/*.old 備份檔在暫存區，請刪除後再提交"
  exit 1
fi
`

if (!existsSync(hookDir)) mkdirSync(hookDir, { recursive: true })
writeFileSync(hookPath, content, { mode: 0o755 })
try { chmodSync(hookPath, 0o755) } catch {}
console.log(`✓ 已安裝 pre-commit hook → ${hookPath}`)
console.log('  之後每次 git commit 前會自動跑 npm run check')
