// ✅ 守護測試：用 Node vm 直接載入 Code.gs（Apps Script 都係 JS），
// 模擬 PropertiesService / SpreadsheetApp / Session / Utilities / UrlFetchApp。
// 跑：node --test templates/canvas/brain.test.mjs   （零 dependency，S1）
//
// 對應 F14：文件每一句「一定要」都有測試守。
// 呢度守：action 白名單、授權、prompt 唔外洩、紀錄 hash 鏈、合約／版號同步、殼無秘密。

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const here = new URL('./', import.meta.url);
const gs = readFileSync(new URL('./brain_v1.0.gs', import.meta.url), 'utf8');
const html = readFileSync(new URL('./shell_v1.0.html', import.meta.url), 'utf8');
const contract = JSON.parse(readFileSync(new URL('./contract_v1.0.json', import.meta.url), 'utf8'));
const promptMd = readFileSync(new URL('./PROMPT_v1.0.md', import.meta.url), 'utf8');

function sha(s) { return createHash('sha256').update(String(s)).digest('hex'); }

function load({ role = 'leader', email = 'leader@example.test', key = 'test-key' } = {}) {
  const store = {
    USER_ROLES: JSON.stringify({ [email]: role }),
    GEMINI_API_KEY: key,
  };
  const rows = [['ts', 'actorHash', 'action', 'payloadHash', 'resultCode', 'promptVersion', 'prevHash', 'hash']];
  let uuid = 0;

  const sheet = {
    getLastRow: () => rows.length,
    getRange: (r, c) => ({ getValue: () => (rows[r - 1] || [])[c - 1] ?? '' }),
    appendRow: (r) => rows.push(r),
    getDataRange: () => ({ getValues: () => rows.slice() }),
  };

  const ctx = {
    console,
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
        setProperty: (k, v) => { store[k] = String(v); },
      }),
    },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet }) },
    Session: { getActiveUser: () => ({ getEmail: () => email }) },
    HtmlService: { createHtmlOutputFromFile: () => ({ setTitle: () => 'html-output' }) },
    UrlFetchApp: {
      fetch: () => ({ getContentText: () => JSON.stringify({
        candidates: [{ content: { parts: [{ text: '模擬回覆（server-side）' }] } }],
      }) }),
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      computeDigest: (_alg, s) => Array.from(createHash('sha256').update(String(s)).digest()),
      getUuid: () => `id-${++uuid}`,
    },
  };
  vm.createContext(ctx);
  vm.runInContext(gs, ctx, { filename: 'brain_v1.0.gs' });
  return { ctx, rows, store, sheet };
}

/* ---------- 合約 / 版號同步（F16 / F15） ---------- */
test('contract.json 同 Code.gs ACTIONS key 完全一致（F14/F16）', () => {
  const { ctx } = load();
  assert.deepEqual(
    Object.keys(ctx.BRAIN._test.ACTIONS).sort(),
    Object.keys(contract.actions).sort()
  );
});

test('PROMPT_v1.0.md 版號 = brain PROMPT_VERSION（V1）', () => {
  const { ctx } = load();
  const m = promptMd.match(/Prompt 版本[：:]\s*\*{0,2}([A-Za-z0-9._-]+)/);
  assert.ok(m, 'PROMPT_v1.0.md 要寫「Prompt 版本：pX」');
  assert.equal(ctx.BRAIN._test.PROMPT_VERSION, m[1]);
});

/* ---------- 白名單 / 授權 / 驗證（F5 / A6） ---------- */
test('白名單外 action 一律 UNKNOWN_ACTION，而且唔留低寫入紀錄', () => {
  const { ctx, rows } = load();
  const r = ctx.api('debug.dumpPrompt', {});
  assert.equal(r.code, 'UNKNOWN_ACTION');
  assert.equal(rows.length, 1);
});

test('guest 唔可以 item.create（角色 server 計，A6）', () => {
  const { ctx, rows } = load({ role: 'guest', email: 'guest@example.test' });
  const r = ctx.api('item.create', { title: 'x' });
  assert.equal(r.code, 'AUTH_FAILED');
  assert.equal(rows.length, 1);
});

test('缺 title 回 BAD_INPUT；body 可選（0..2000?）', () => {
  const { ctx } = load();
  assert.equal(ctx.api('item.create', {}, {}).code, 'BAD_INPUT');
  assert.equal(ctx.api('item.create', { title: 'A' }).ok, true);
});

/* ---------- 狀態 / tombstone（F7） ---------- */
test('create → list → remove = tombstone，唔真刪', () => {
  const { ctx } = load();
  const c = ctx.api('item.create', { title: '通告 A', body: '內容' });
  assert.equal(c.ok, true);
  assert.equal(ctx.api('item.list', {}).data.length, 1);
  ctx.api('item.remove', { id: c.data.id });
  assert.equal(ctx.api('item.list', {}).data.length, 0, 'UI 唔應該見到');
  assert.equal(ctx.BRAIN._test.getState().items.length, 1, '底層留低 tombstone');
  assert.equal(ctx.BRAIN._test.getState().items[0].deleted, true);
});

/* ---------- 紀錄保護（C10 / A13） ---------- */
test('每個非 read action 留痕：promptVersion + prevHash 鏈冇斷', () => {
  const { ctx, rows } = load();
  ctx.api('item.create', { title: 'A' });
  ctx.api('item.create', { title: 'B' });
  assert.equal(rows.length, 3, 'header + 2 筆');
  for (let i = 1; i < rows.length; i++) {
    assert.equal(rows[i][5], ctx.BRAIN._test.PROMPT_VERSION, '每行要有 promptVersion');
    assert.equal(rows[i][6], i === 1 ? '' : rows[i - 1][7], 'prevHash 要指住上一行 hash');
    assert.equal(rows[i][7], sha(rows[i].slice(0, 7).join('|')), 'hash 要計得啱');
  }
});

test('record.list 只回傳 metadata，唔回傳 payload 原文', () => {
  const { ctx } = load();
  ctx.api('item.create', { title: '秘密標題' });
  const r = ctx.api('record.list', { limit: 5 });
  assert.equal(r.ok, true);
  assert.equal(r.data.length, 1);
  assert.ok(!JSON.stringify(r.data).includes('秘密標題'));
});

/* ---------- Prompt / key 保護（C9 / A1） ---------- */
test('api() 回應唔含 SYSTEM_PROMPT / GEMINI_API_KEY / hash 原文', () => {
  const { ctx } = load();
  const all = JSON.stringify([
    ctx.api('config.get', {}),
    ctx.api('item.list', {}),
    ctx.api('state.export', {}),
  ]);
  const prompt = ctx.BRAIN._test.SYSTEM_PROMPT;
  assert.ok(!all.includes(prompt));
  assert.ok(!all.includes('你係一個旅團'));
  assert.ok(!all.includes('test-key'));
  assert.ok(!all.includes('GEMINI_API_KEY'));
});

test('shell_v1.0.html（殼）grep 唔到 prompt / key / fetch / localStorage 紀錄', () => {
  assert.ok(html.includes('google.script.run'), '殼一定要用 google.script.run');
  assert.ok(!html.includes('你係一個旅團'), '唔好將 prompt 寫入 HTML');
  assert.ok(!html.includes('GEMINI_API_KEY'), '唔好將 key 名/值寫入 HTML');
  assert.ok(!/fetch\s*\(/.test(html), '唔好喺前端 fetch 外部 API');
  assert.ok(!/localStorage\.setItem/.test(html), '紀錄唔好用 localStorage');
  assert.ok(!/<\?=/.test(html), '唔好用 HtmlTemplate scriptlet 注入 server 嘢');
});

test('缺少 GEMINI_API_KEY 即 CONFIG_MISSING（F12），唔會照跑', () => {
  const { ctx, store } = load();
  store.GEMINI_API_KEY = null;
  const r = ctx.api('gemini.ask', { text: '你好' });
  assert.equal(r.code, 'CONFIG_MISSING');
});

test('gemini.ask 只回傳模型輸出，而且有留痕', () => {
  const { ctx, rows } = load();
  const r = ctx.api('gemini.ask', { text: '你好' });
  assert.equal(r.ok, true);
  assert.equal(r.data.answer, '模擬回覆（server-side）');
  assert.ok(!JSON.stringify(r).includes('你係一個旅團'));
  assert.equal(rows.length, 2, 'gemini.ask 要留痕');
  assert.equal(rows[1][2], 'gemini.ask');
});

/* ---------- W / V 通用規則（版權 + 雙版號） ---------- */
test('V1/V2：腦、殼、合約、sync 腳本檔名版號 = 內文版號', () => {
  const { ctx } = load();
  assert.equal(ctx.BRAIN._test.APP_VERSION, 'v1.0');
  assert.equal(ctx.BRAIN._test.COPYRIGHT, '© SCOUT SYSTEM');
  assert.ok(gs.includes("APP_VERSION = 'v1.0'"));
  assert.ok(html.includes('<meta name="app-version" content="v1.0">'));
  assert.ok(html.includes("const APP_VERSION = 'v1.0'"));
  assert.equal(contract.fileVersion, 'v1.0');
  assert.equal(contract.copyright, '© SCOUT SYSTEM');
});

test('V5：部署拷貝 Code.gs / index.html 同源檔版號一致', () => {
  const deployGs = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8');
  const deployHtml = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
  assert.ok(deployGs.includes('GENERATED from brain_v1.0.gs (v1.0)'));
  assert.ok(deployHtml.includes('GENERATED from shell_v1.0.html (v1.0)'));
  assert.ok(deployGs.includes("APP_VERSION = 'v1.0'"));
  assert.ok(deployHtml.includes('<meta name="app-version" content="v1.0">'));
  assert.ok(!deployHtml.includes('SYSTEM_PROMPT'));
});

test('W1：腦同殼都有 © SCOUT SYSTEM 版權標示', () => {
  assert.ok(gs.includes('© SCOUT SYSTEM'));
  assert.ok(html.includes('© SCOUT SYSTEM'));
  assert.ok(html.includes('COPYRIGHT SCOUT SYSTEM'));
});

test('W6：前端零真 API key — 只有 placeholder 或 server-side 讀取', () => {
  assert.ok(!/AIza[0-9A-Za-z_-]{20,}/.test(html), '殼唔可以有真 key');
  assert.ok(!/AIza[0-9A-Za-z_-]{20,}/.test(gs), '腦唔可以有寫死 key');
});
