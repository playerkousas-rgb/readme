// ✅ 單一 HTML 審計器守護測試（C13 / C13-g / A1/W6 / V1）
// 跑：node --test scripts/audit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { audit, LIMIT_CANVAS } from './audit_single_html_v1.0.mjs';

const has = (r, id, level) => r.findings.some(f => f.id === id && (!level || f.level === level));
const fails = (r) => r.findings.filter(f => f.level === 'FAIL');

/** 一個最小但完整合格嘅單一 HTML（C13 三軌 + W1 + V1） */
function goodHtml(extra = '') {
  return `<!doctype html><html><head>
<meta name="app-version" content="v1.0"><meta name="copyright" content="© SCOUT SYSTEM">
<title>Tool v1.0 — © SCOUT SYSTEM</title></head><body>
<footer>© SCOUT SYSTEM · <strong>v1.0</strong></footer>
<script>
const APP_VERSION = 'v1.0';
const API_KEY = "";
const safeStore = { get(k){ try { return localStorage.getItem(k); } catch(e) { return null; } } };
function resolveApiKey(){ return API_KEY || safeStore.get('k') || ''; }
function apiUrl(m){ const k = resolveApiKey(); return k ? BASE + m + '?x=1' : BASE + m; }
fetch(apiUrl('generateContent'), { method:'POST', credentials:'include',
  headers: {'Content-Type':'application/json', 'x-goog-api-key': resolveApiKey()}, body:'{}' });
${extra}
</script></body></html>`;
}

test('C13-g：5MB 係硬上限，唔係 2MB／1MB', () => {
  assert.equal(LIMIT_CANVAS, 5 * 1024 * 1024);
  const html = goodHtml();
  const under = Buffer.byteLength(html) + 4 * 1024 * 1024;      // 約 4MB
  const r = audit(html, 'tool_v1.0.html', under);
  assert.equal(has(r, 'C13-g', 'PASS'), true, '4MB 應該過');
  assert.equal(has(r, 'C13-g', 'FAIL'), false, '唔好用 S7 2MB 判 FAIL');
  const over = audit(html, 'tool_v1.0.html', LIMIT_CANVAS + 1);
  assert.equal(has(over, 'C13-g', 'FAIL'), true, '超 5MB 要 FAIL');
});

test('C13-g：最長一行／inline base64／CDN 只做 INFO，唔判 FAIL', () => {
  const long = 'x'.repeat(600000);
  const r = audit(goodHtml(`const blob = '${long}';`), 'tool_v1.0.html');
  assert.equal(has(r, 'C13-g/S', 'INFO'), true);
  assert.equal(has(r, 'C13-g/S', 'FAIL'), false);
  assert.equal(has(r, 'C13-g/S6', 'FAIL'), false);
});

test('C13：三軌自動注入（唯一 slot + credentials 代理 + BYOK）全部 PASS', () => {
  const r = audit(goodHtml(), 'tool_v1.0.html');
  assert.equal(has(r, 'C13', 'PASS'), true);
  assert.equal(has(r, 'C13', 'FAIL'), false);
  assert.equal(has(r, 'C13/F', 'FAIL'), false);
});

test('C13/F：兩處 API_KEY 宣告要 FAIL（平台注入會改錯位）', () => {
  const r = audit(goodHtml('const API_KEY = "";'), 'tool_v1.0.html');
  assert.equal(has(r, 'C13/F', 'FAIL'), true);
});

test('A1/W6：?key= 落 URL 要 FAIL；x-goog-api-key header 就 PASS', () => {
  const withQuery = goodHtml().replace("BASE + m + '?x=1'", "BASE + m + '?key=' + k");
  assert.equal(has(audit(withQuery, 'tool_v1.0.html'), 'A1/W6', 'FAIL'), true);
  assert.equal(has(audit(goodHtml(), 'tool_v1.0.html'), 'A1/W6', 'PASS'), true);
});

test('V1/V3：靜態 HTML 舊版號要 FAIL；全部一致就 PASS', () => {
  const stale = goodHtml().replace('<strong>v1.0</strong>', '<strong>v0.9</strong>');
  assert.equal(has(audit(stale, 'tool_v1.0.html'), 'V1/V3', 'FAIL'), true);
  assert.equal(has(audit(goodHtml(), 'tool_v1.0.html'), 'V1/V3', 'PASS'), true);
});

test('W1：缺 copyright meta 要 FAIL', () => {
  const noMeta = goodHtml().replace('<meta name="copyright" content="© SCOUT SYSTEM">', '');
  assert.equal(has(audit(noMeta, 'tool_v1.0.html'), 'W1', 'FAIL'), true);
});

test('完整合格檔 = 0 FAIL（可以做交付）', () => {
  const r = audit(goodHtml(), 'tool_v1.0.html');
  assert.equal(fails(r).length, 0, JSON.stringify(fails(r), null, 2));
});
