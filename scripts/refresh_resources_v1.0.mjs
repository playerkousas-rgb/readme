#!/usr/bin/env node
/**
 * refresh_resources_v1.0.mjs — 更新 docs/15-resource-index.md 嘅 API 分類索引
 *
 * 用法：node scripts/refresh_resources_v1.0.mjs   （需要 gh 已登入、有 outbound 去 api.github.com）
 *
 * 由 playerkousas-rgb/api 嘅 data/apis.csv 讀 category / auth / hk_status，
 * 產生 Markdown 表，寫入 docs/15-resource-index.md 嘅 BEGIN/END 標記之間。
 * 只改標記之間嘅內容，其他手寫說明保持不變（F1 單一真理）。
 * 零 dependency（S1）。
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const VERSION = 'v1.0';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = path.join(ROOT, 'docs', '15-resource-index.md');
const REPO = 'playerkousas-rgb/api';
const RAW = `https://github.com/${REPO}/blob/main`;
const BEGIN = '<!-- BEGIN:api-category-index -->';
const END = '<!-- END:api-category-index -->';

const DOC_MAP = [
  [/AI|模型|LLM/i, 'ai.md', 'AI 香港可用'],
  [/封|blocked/i, 'hk-blocked.md', '封港名單'],
  [/膠水|glue/i, 'glue.md', '零成本膠水'],
  [/天氣/i, 'weather.md', '天氣'],
  [/交通/i, 'transport.md', '交通'],
  [/地理|地圖/i, 'geo.md', '地理'],
  [/醫療/i, 'health.md', '醫療'],
  [/戶外/i, 'outdoor.md', '戶外'],
  [/金融/i, 'finance.md', '金融'],
  [/證書/i, 'certs.md', '證書'],
  [/圖標|徽章/i, 'icons.md', '圖標'],
  [/人物素材|素材|avatar/i, 'avatar.md', '人物素材'],
  [/公共設施|設施/i, 'facilities.md', '公共設施'],
  [/3D-AR|遊戲$/i, 'xr-games.md', '3D/AR'],
  [/遊戲化/i, 'gamification.md', '遊戲化'],
  [/教育/i, 'edu-fun.md', '教育'],
  [/媒體/i, 'media.md', '媒體'],
  [/日常/i, 'daily.md', '日常'],
  [/民生/i, 'civic.md', '民生'],
  [/平台/i, 'platform.md', '平台'],
  [/冷門/i, 'niche.md', '冷門'],
  [/童軍/i, 'world-scout.md', '世界童軍'],
];

/* 極簡 CSV parser：處理雙引號包住、入面有逗號嘅欄位 */
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift().map(s => s.trim());
  return rows.filter(r => r.length >= head.length && r.some(Boolean))
             .map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
}

function ghCsv() {
  const b64 = execFileSync('gh', ['api', `repos/${REPO}/contents/data/apis.csv`, '--jq', '.content'],
                           { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).trim();
  return Buffer.from(b64.replace(/\s/g, ''), 'base64').toString('utf8');
}

function docLink(cat) {
  for (const [re, file, label] of DOC_MAP) {
    if (re.test(cat)) return `[${label}](${RAW}/docs/${file}) · [CSV](${RAW}/data/apis.csv)`;
  }
  return `[CSV](${RAW}/data/apis.csv)`;
}

function main() {
  let rows;
  try { rows = parseCsv(ghCsv()); }
  catch (e) {
    console.error(`拎唔到 ${REPO}/data/apis.csv：${e.message}`);
    console.error('檢查 gh auth status 同 outbound 去 api.github.com；本機無網就保留上一版表格。');
    process.exit(1);
  }
  const groups = new Map();
  for (const r of rows) {
    const cat = r.category || '（未分類）';
    if (!groups.has(cat)) groups.set(cat, { n: 0, free: 0 });
    const g = groups.get(cat);
    g.n++;
    if ((r.auth || '').toLowerCase() === 'none') g.free++;
  }
  const sorted = [...groups.entries()].sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0], 'zh-Hant'));
  const out = [
    BEGIN,
    `| 分類 | 條數 | 免 key | 去向 |`,
    `|------|-----:|-------:|------|`,
    ...sorted.slice(0, 15).map(([cat, g]) => `| ${cat} | ${g.n} | ${g.free} | ${docLink(cat)} |`),
    `| 其他 ${sorted.length - 15} 類 | ${sorted.slice(15).reduce((s, [, g]) => s + g.n, 0)} | ${sorted.slice(15).reduce((s, [, g]) => s + g.free, 0)} | [完整 CSV](${RAW}/data/apis.csv) |`,
    `| **合計** | **${rows.length}** | **${sorted.reduce((s, [, g]) => s + g.free, 0)}** | [${REPO}](${RAW}/data/apis.csv) |`,
    END,
  ].join('\n');

  const md = readFileSync(DOC, 'utf8');
  if (!md.includes(BEGIN) || !md.includes(END)) throw new Error('docs/15-resource-index.md 缺 BEGIN/END 標記');
  const next = md.replace(new RegExp(`${BEGIN}[\\s\\S]*?${END}`), out);
  writeFileSync(DOC, next, 'utf8');
  console.log(`✅ 更新 docs/15-resource-index.md：${rows.length} 條 API、${sorted.length} 個分類（${VERSION}）`);
  console.log('下一步：node scripts/guard.mjs');
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) main();
