// ✅ 最終實測 orchestrator 守護測試（六角度）
// 注意：唔好喺測試入面呼叫 collect() —— 佢會跑 node --test，造成無限遞歸。
import test from 'node:test';
import assert from 'node:assert/strict';
import { ANGLES, MANUAL, VERSION } from './final_check_v1.0.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ROOT = new URL('..', import.meta.url).pathname;

test('六個角度一個都唔少（Vercel/Git/程序員/架構師/AI Agent/用戶）', () => {
  assert.equal(ANGLES.length, 6);
  assert.deepEqual(ANGLES.map(a => a.id), ['vercel', 'git', 'dev', 'arch', 'agent', 'user']);
  for (const a of ANGLES) {
    assert.ok(a.name && a.care, `角度 ${a.id} 要有名同關心事項`);
  }
});

test('人手實測清單存在（機器代唔到嘅嘢唔好假裝自動化）', () => {
  assert.ok(MANUAL.length >= 7);
  assert.ok(MANUAL.some(s => /手機/.test(s)));
  assert.ok(MANUAL.some(s => /斷網/.test(s)));
  assert.ok(MANUAL.some(s => /解碼器|水印/.test(s)));
});

test('案例教訓：本地回歸綠唔算完成，MANUAL 要有「真機跑一次」', () => {
  assert.ok(MANUAL.some(s => /真機/.test(s) && /302|Drive|Script Properties/.test(s)));
});

test('版本常數同檔名一致（V1）', () => {
  assert.equal(VERSION, 'v1.0');
});

test('案例隔離：6 份 ecportal 案例已刪 + 57/58/20/22 留 + R1–R8 喺 58 而唔係 PLAYBOOK', () => {
  const { readFileSync, existsSync } = require('node:fs');
  const { execFileSync } = require('node:child_process');
  const path = require('node:path');
  const root = path.resolve(ROOT);
  // 2026-11-19：ecportal 退役，6 份案例檔已刪；改為守 57（退場）／58（可選模式）／20／22。
  for (const f of ['docs/57-ecportal-to-vsportal-migration.md',
                   'docs/58-multilevel-system-patterns.md',
                   'docs/20-repo-health-audit.md',
                   'docs/22-scout-circulars-agent-handoff.md']) {
    assert.ok(existsSync(path.join(root, f)), `退役後仍要留 ${f}`);
    assert.ok(readFileSync(path.join(root, 'README.md'), 'utf8').includes(f), `README 未指向 ${f}`);
  }
  for (const g of ['BUILD.md', 'EXTERNAL.md', '進度追蹤旅系統升級版.md',
                   'docs/18-as-built-gap-audit.md', 'docs/19-ecportal-troop-case.md',
                   'docs/21-fix-plans.md']) {
    assert.equal(existsSync(path.join(root, g)), false, `ecportal 案例檔應該已刪：${g}`);
  }
  const pb = readFileSync(path.join(root, 'PLAYBOOK.md'), 'utf8');
  const patterns = readFileSync(path.join(root, 'docs/58-multilevel-system-patterns.md'), 'utf8');
  assert.ok(pb.includes('docs/58-multilevel-system-patterns.md'), '通用 PLAYBOOK 要指向 58（可選模式）');
  for (const id of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8']) assert.ok(patterns.includes(id), `58 缺可選模式 ${id}`);
  assert.ok(patterns.includes('唔係通用底線'), '58 要標明可選模式唔係通用底線');
  const out = execFileSync(process.execPath, [path.join(root, 'scripts', 'guard.mjs')], { cwd: root, encoding: 'utf8' });
  assert.match(out, /ecportal 已退役/);
});

test('回歸：單一 HTML 內嵌解碼器唔應該被 guard 判「缺 decoder/codec」', () => {
  const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
  const { tmpdir } = require('node:os');
  const { execFileSync } = require('node:child_process');
  const path = require('node:path');
  const dir = mkdtempSync(path.join(tmpdir(), 'guard-selfcontained-'));
  try {
    writeFileSync(path.join(dir, 'README.md'), '# test\n');
    writeFileSync(path.join(dir, '.gitignore'), '.env\nnode_modules/\ndist/\n');
    writeFileSync(path.join(dir, '.vercelignore'), 'node_modules/\n.git/\n.cache/\n*.bak\n*.log\ndocs/\n');
    writeFileSync(path.join(dir, 'tool_v1.0.html'), `<!doctype html><html><head>
<meta name="app-version" content="v1.0"><meta name="copyright" content="© SCOUT SYSTEM">
<title>Tool v1.0</title></head><body><footer>© SCOUT SYSTEM · v1.0</footer>
<script>const APP_VERSION='v1.0'; const MARK='DRAWSCOUT|v1'; const STEP = 32;</script></body></html>`);
    const out = execFileSync(process.execPath,
      [path.join(ROOT, 'scripts', 'guard.mjs')], { cwd: dir, encoding: 'utf8' });
    assert.match(out, /GUARD PASS/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
