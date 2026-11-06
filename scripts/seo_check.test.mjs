// ✅ SEO/GEO 靜態檢查器守護測試
// 跑：node --test scripts/seo_check.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { check, VERSION } from './seo_check_v1.0.mjs';

const has = (r, id, level) => r.findings.some(f => f.id === id && (!level || f.level === level));

function goodHtml(extra = '') {
  return `<!doctype html><html lang="zh-Hant"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>童軍活動報名 — SCOUT SYSTEM</title>
<meta name="description" content="童軍活動報名同資料查詢，一個入口睇晒集會、活動同通告，支援手機同桌面。">
<link rel="canonical" href="https://example.vercel.app/">
<meta property="og:title" content="童軍活動報名">
<meta property="og:description" content="一個入口睇晒集會、活動同通告。">
<meta property="og:image" content="https://example.vercel.app/og.png">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"SCOUT"}</script>
${extra}</head><body><h1>童軍活動報名</h1><img src="a.png" alt="活動海報"></body></html>`;
}

test('版本常數同檔名一致（V1）', () => {
  assert.equal(VERSION, 'v1.0');
});

test('齊料嘅公開頁應該 0 FAIL', () => {
  const r = check(goodHtml(), 'index.html');
  assert.equal(r.ok, true);
  assert.equal(has(r, 'SEO/title', 'FAIL'), false);
  assert.equal(has(r, 'GEO/jsonld', 'PASS'), true);
});

test('冇 title／冇 description 要 FAIL（唔係 WARN 就算）', () => {
  const r = check('<!doctype html><html><head></head><body><p>hi</p></body></html>');
  assert.equal(r.ok, false);
  assert.equal(has(r, 'SEO/title', 'FAIL'), true);
  assert.equal(has(r, 'SEO/description', 'FAIL'), true);
});

test('壞 JSON-LD 要 FAIL，唔好靜靜當冇事', () => {
  const r = check(goodHtml('<script type="application/ld+json">{broken json</script>'));
  assert.equal(has(r, 'GEO/jsonld', 'FAIL'), true);
  assert.equal(r.ok, false);
});

test('相對 og:image／冇 canonical 只 WARN，唔好誤判 FAIL', () => {
  const html = goodHtml().replace('https://example.vercel.app/og.png', '/og.png')
    .replace(/<link rel="canonical"[^>]*>/, '');
  const r = check(html);
  assert.equal(has(r, 'GEO/og', 'WARN'), true);
  assert.equal(has(r, 'GEO/canonical', 'WARN'), true);
  assert.equal(r.ok, true);
});

test('noindex 要出聲：公開頁唔好唔小心叫人唔好收錄', () => {
  const r = check(goodHtml('<meta name="robots" content="noindex">'));
  assert.equal(has(r, 'SEO/robots', 'WARN'), true);
});

test('連續 check 唔好累積上一次結果', () => {
  check('<!doctype html><html><head></head><body></body></html>');
  const r = check(goodHtml());
  assert.equal(has(r, 'SEO/title', 'FAIL'), false);
});
