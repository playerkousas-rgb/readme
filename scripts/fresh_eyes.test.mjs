// ✅ 金魚審守護測試（docs/52，2026-11-19）
// 跑：node --test scripts/fresh_eyes.test.mjs
//
// 呢支測試守住「規則唔會喺搬字途中消失」：
//   1. docs/52 有「改寫先行」（唯一捉到『零件齊但駁唔埋』嗰步）
//   2. docs/52 寫明本倉冇 subagent → 金魚＝開新對話（唔准自己審自己）
//   3. 貼用段落存在、可照抄、冇未填 placeholder
//   4. 起手包範本（13e）同 docs/52 指向同一套做法
//   5. guard 嘅 F16/金魚審四處同步檢查真係會因為缺檔／缺字而 FAIL
//
// 註：呢份測試**驗唔到**「有冇真係開新對話審過」—— 嗰件事係人手紀錄，
//     docs/52 §5 已寫明未實測。測試只驗規則同範本冇被人靜靜刪走。
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(path.join(ROOT, ...p), 'utf8');

const DOC = 'docs/52-fresh-eyes-review.md';
const TPL = 'templates/repo-starter/docs/fresh-eyes-review.md';
const GUARD_SRC = path.join(ROOT, 'scripts', 'guard.mjs');

test('docs/52 存在，而且係 docs/ 命名約定（兩位數字前綴）', () => {
  assert.equal(existsSync(path.join(ROOT, DOC)), true, `${DOC} 唔見咗`);
  assert.match(path.basename(DOC), /^\d{2}-[a-z0-9-]+\.md$/);
  assert.match(read(DOC).split('\n')[0], /^# 52 — /);
});

test('核心方法「改寫先行」冇被刪走，而且寫明改寫錯 = finding', () => {
  const t = read(DOC);
  assert.match(t, /改寫/, 'docs/52 一定要保留「改寫先行」');
  assert.match(t, /改寫錯[^\n]{0,20}finding|改寫錯咗，本身就係一個 finding/i);
  // 呢句解釋「點解有效」——列未定義名詞捉唔到「零件齊但駁唔埋」
  assert.match(t, /駁唔埋/);
});

test('冇 subagent 嘅誠實限制寫住：金魚＝開新對話，自己審自己唔算', () => {
  const t = read(DOC);
  assert.match(t, /新對話/);
  assert.match(t, /冇 subagent|無 subagent|冇 Skill tool/i);
  assert.match(t, /唔算/);
});

test('貼用段落存在、可直接 copy，而且冇未填 placeholder', () => {
  const t = read(DOC);
  const m = /```text\n([\s\S]*?)```/.exec(t);
  assert.ok(m, 'docs/52 要有 ```text 貼用段落');
  const block = m[1];
  assert.match(block, /兩段/, '貼用段落要叫 reviewer 先寫兩段改寫');
  assert.match(block, /CRITICAL／HIGH／MEDIUM／LOW/, 'finding 要分嚴重程度（四級，借 Spec Kit /analyze）');
  assert.match(block, /唔准改任何檔案/, 'reviewer 只讀');
  assert.doesNotMatch(block.replace(/<[^>]+>/g, ''), /\{\{[A-Z_]+\}\}/, '貼用段落唔應該有 {{...}} 模板佔位');
});

test('一次 re-audit cap 有寫（防止無限改標點）', () => {
  const t = read(DOC);
  assert.match(t, /re-audit|重審/);
  assert.match(t, /1/);
});

test('起手包 13e 同 docs/52 係同一套做法（唔可以走兩份唔同嘅規則）', () => {
  assert.equal(existsSync(path.join(ROOT, TPL)), true, `${TPL} 唔見咗（起手包第 13e 項）`);
  const tpl = read(TPL);
  assert.match(tpl, /52-fresh-eyes-review\.md/, '範本要指返真理倉 docs/52');
  assert.match(tpl, /改寫/);
  assert.match(tpl, /新對話/);
  assert.match(read('templates/repo-starter/START.md'), /13e/, 'START.md 要列 13e，否則新 repo 抄唔到');
  assert.match(read('templates/README.md'), /fresh-eyes-review\.md/, 'templates/README.md 對照表要有呢一項');
});

test('四處同步：README + docs/README + docs/10 checklist 都指向 docs/52', () => {
  assert.match(read('README.md'), /docs\/52-fresh-eyes-review\.md/);
  assert.match(read('docs/README.md'), /52-fresh-eyes-review\.md/);
  assert.match(read('docs/10-checklists.md'), /52-fresh-eyes-review\.md/);
});

/* ---------- guard：四處同步檢查真係會擋（唔係寫住好聽） ---------- */
function tempRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), 'guard-fresh-'));
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  mkdirSync(path.join(dir, 'docs'), { recursive: true });
  mkdirSync(path.join(dir, 'templates', 'repo-starter', 'docs'), { recursive: true });
  copyFileSync(GUARD_SRC, path.join(dir, 'scripts', 'guard.mjs'));
  writeFileSync(path.join(dir, 'README.md'), '# t\n');
  // 最小 PLAYBOOK／docs 滿足 F16 其他檢查
  writeFileSync(path.join(dir, 'PLAYBOOK.md'), [
    'S1 S7 S12 F4 F14 F15 F16 A1 A7 A14 W1 W6 V1 V6 G1 G11 VL1 X1 U1 C1 C12 C13',
    'L1 L2 L3 L4 L5 L6 SG1 SG2 SG3 SG4 SG5 SG6',
    '5MB 300 EXCEPTION: L1 可豁免', '',
  ].join('\n'));
  for (const f of ['docs/01-slim.md', 'docs/04-settings-super.md', 'docs/09-gemini-canvas.md',
    'docs/10-checklists.md', 'docs/12-copyright-scout-system.md', 'docs/13-versioning.md',
    'docs/14-api-key-injection.md', 'docs/15-resource-index.md', 'docs/18-as-built-gap-audit.md',
    'docs/19-ecportal-troop-case.md', 'docs/20-repo-health-audit.md', 'docs/21-fix-plans.md',
    'docs/22-scout-circulars-agent-handoff.md', 'docs/23-design-resources.md']) {
    writeFileSync(path.join(dir, f), '# t\n');
  }
  return dir;
}

function runGuard(cwd) {
  try {
    return { ok: true, out: execFileSync(process.execPath, [path.join(cwd, 'scripts', 'guard.mjs')], { cwd, encoding: 'utf8' }) };
  } catch (e) {
    return { ok: false, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

test('guard：docs/52 缺檔 → FAIL 而且講得出缺乜', () => {
  const dir = tempRepo();
  try {
    const r = runGuard(dir);
    assert.equal(r.ok, false, '缺 docs/52 應該 FAIL');
    assert.match(r.out, /金魚審/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('guard：docs/52 冇「改寫先行」或冇寫「新對話」→ FAIL（唔准靜靜降級）', () => {
  for (const [mutate, want] of [
    [(t) => t.replace(/改寫/g, '檢視'), /改寫/],
    [(t) => t.replace(/新對話/g, '再問一次'), /新對話/],
  ]) {
    const dir = tempRepo();
    try {
      writeFileSync(path.join(dir, DOC), mutate(read(DOC)));
      writeFileSync(path.join(dir, TPL), read(TPL));
      writeFileSync(path.join(dir, 'README.md'), '# t\n' + DOC + '\n');
      writeFileSync(path.join(dir, 'docs', '10-checklists.md'), '[ ] ' + DOC + '\n');
      const r = runGuard(dir);
      assert.equal(r.ok, false, `改壞「${want.source}」之後仍然 PASS`);
      assert.match(r.out, want);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
});

test('guard：docs/52 + 範本 + README + checklist 齊 → 印出四處同步 OK', () => {
  const dir = tempRepo();
  try {
    mkdirSync(path.join(dir, 'templates', 'repo-starter', 'docs'), { recursive: true });
    writeFileSync(path.join(dir, DOC), read(DOC));
    writeFileSync(path.join(dir, TPL), read(TPL));
    writeFileSync(path.join(dir, 'README.md'), '# t\n' + DOC + '\n');
    writeFileSync(path.join(dir, 'docs', '10-checklists.md'), '[ ] ' + DOC + '\n');
    const r = runGuard(dir);
    assert.match(r.out, /F16\/金魚審：[^]*四處同步/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
