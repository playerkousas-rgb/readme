#!/usr/bin/env node
/**
 * Gemini API KEY 自動注入器 — v1.0 · © SCOUT SYSTEM
 *
 * 用法（本機，喺 .gitignore 保護下）：
 *   GEMINI_API_KEY=xxxx node templates/watermark/inject_key_v1.0.mjs <source.html>
 *   → 產生 <source>_local_v1.0.html（已注入，永遠唔入 Git）
 *
 * 鐵則（W6 / A1）：
 *   ① source HTML 只可以有 placeholder `__INJECT_GEMINI_API_KEY__`，**唔可以有真 key**。
 *   ② 注入後嘅檔名帶 `_local_` 標記 → .gitignore + guard 都會擋。
 *   ③ 檔名版號必須同內文 `APP_VERSION` 一致（V1）。
 *   ④ 注入完即刻用，唔好 push／唔好電郵／唔好放公開資料夾。
 *   ⑤ 最安全做法係 Type C（GS server-side 代 call），根本唔使注入。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const PLACEHOLDER = '__INJECT_GEMINI_API_KEY__';
const VERSION = 'v1.0';
const KEY_RE = /^AIza[0-9A-Za-z_-]{30,}$/;

const srcArg = process.argv[2];
if (!srcArg) { console.error('用法：GEMINI_API_KEY=xxx node inject_key_v1.0.mjs <source.html>'); process.exit(2); }
const src = path.resolve(srcArg);
if (!existsSync(src)) { console.error(`搵唔到 ${src}`); process.exit(2); }

let html = readFileSync(src, 'utf8');
const key = process.env.GEMINI_API_KEY || '';

if (!html.includes(PLACEHOLDER)) { console.error(`❌ ${path.basename(src)} 冇 placeholder ${PLACEHOLDER}`); process.exit(1); }
if (!key) { console.error('❌ 冇 set GEMINI_API_KEY；寧願唔注入都唔好用假 key 照跑（F12）'); process.exit(1); }
if (!KEY_RE.test(key)) { console.error('❌ key 格式唔似 Gemini API key（AIza...），拒絕注入'); process.exit(1); }
if (/AIza[0-9A-Za-z_-]{30,}/.test(html)) { console.error('❌ source 入面疑似有真 key（AIza...），唔准注入（A1）'); process.exit(1); }

const m = path.basename(src).match(/_v(\d+\.\d+)\./);
if (!m || `v${m[1]}` !== VERSION) {
  console.error(`❌ source 檔名版號（${m ? 'v' + m[1] : '無'}）同注入器 ${VERSION} 唔夾（V1）`);
  process.exit(1);
}
if (!html.includes(`content="${VERSION}"`) && !html.includes(`'${VERSION}'`)) {
  console.error(`❌ source 內文冇 ${VERSION}（V1 雙版號）`); process.exit(1);
}

html = html.replaceAll(PLACEHOLDER, key);
const out = path.join(path.dirname(src), path.basename(src).replace(/_v(\d+\.\d+)\.html$/, `_local_v$1.html`));
writeFileSync(out, html, 'utf8');

console.log(`✅ 已注入 → ${path.relative(process.cwd(), out)}`);
console.log('⚠️  呢個檔含真 key：只可本機用，唔好 commit / 上載 / 電郵。用完刪。');
console.log('   建議：長期方案改用 Type C（Code.gs server-side 代 call Gemini），frontend 唔使 key。');
