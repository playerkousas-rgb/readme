#!/usr/bin/env node
/**
 * Type C 部署拷貝同步器 — v1.0 · © SCOUT SYSTEM
 *
 * 點解要呢個檔：Apps Script 硬性要求 HTML file 叫 index.html，
 * 但通用規則 V1 要求「檔名 + 內文都有版號」。
 * 解法：Git 入面版本化源檔（brain_v1.0.gs / shell_v1.0.html）做唯一真理，
 *       本腳本產生部署拷貝（Code.gs / index.html），內文版號同源檔一致。
 *
 * 用法：node templates/canvas/sync_canvas_v1.0.mjs
 * 更新版本：改源檔名 + 內文全部 vX.Y + 跑呢個腳本 + 跑測試 + 更新 docs/13-versioning.md
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const VERSION = 'v1.0';

function findLatest(re) {
  const hits = readdirSync(DIR).map(n => n.match(re)).filter(Boolean)
    .map(m => ({ file: m[0], v: `v${m[1]}` }))
    .sort((a, b) => b.v.localeCompare(a.v, undefined, { numeric: true }));
  if (!hits.length) throw new Error('搵唔到版本化源檔');
  return hits[0];
}

function build(srcName, outName, header) {
  const src = readFileSync(path.join(DIR, srcName), 'utf8');
  const v = srcName.match(/_v(\d+\.\d+)\./)[1];
  const tag = `v${v}`;
  if (!src.includes(tag)) throw new Error(`${srcName} 內文冇 ${tag}（V1 雙版號）`);
  if (src.includes('__INJECT_GEMINI_API_KEY__')) throw new Error(`${srcName} 有未注入嘅 API KEY placeholder`);
  writeFileSync(path.join(DIR, outName), header(tag, srcName) + src, 'utf8');
  return { srcName, outName, version: tag, bytes: src.length };
}

const brain = findLatest(/^brain_v(\d+\.\d+)\.gs$/);
const shell = findLatest(/^shell_v(\d+\.\d+)\.html$/);
if (brain.v !== shell.v) throw new Error(`腦(${brain.v}) 同殼(${shell.v}) 版號唔一致（V1）`);
if (brain.v !== VERSION) console.warn(`⚠️ sync 腳本 ${VERSION} 同源檔 ${brain.v} 唔同，考慮更新注入器版號`);

const r1 = build(brain.file, 'Code.gs', (v, s) => `// GENERATED from ${s} (${v}) — 唔好直接改；改源檔再跑 sync_canvas_v1.0.mjs\n// © SCOUT SYSTEM · COPYRIGHT SCOUT SYSTEM\n`);
const r2 = build(shell.file, 'index.html', (v, s) => `<!-- GENERATED from ${s} (${v}) — 唔好直接改；改源檔再跑 sync_canvas_v1.0.mjs · © SCOUT SYSTEM -->\n`);

console.log(`✅ ${r1.srcName} → ${r1.outName} (${r1.version}, ${r1.bytes} B)`);
console.log(`✅ ${r2.srcName} → ${r2.outName} (${r2.version}, ${r2.bytes} B)`);
console.log('下一步：node --test templates/canvas/brain.test.mjs && node scripts/guard.mjs');
