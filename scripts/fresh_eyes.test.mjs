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
    'docs/14-api-key-injection.md', 'docs/15-resource-index.md',
    'docs/57-ecportal-to-vsportal-migration.md', 'docs/58-multilevel-system-patterns.md',
    'docs/20-repo-health-audit.md',
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

test('guard：docs/52 + 範本 + 委託書 + README + checklist 齊 → 印出五處同步 OK', () => {
  const dir = tempRepo();
  try {
    mkdirSync(path.join(dir, 'templates', 'repo-starter', 'docs'), { recursive: true });
    mkdirSync(path.join(dir, 'templates'), { recursive: true });
    writeFileSync(path.join(dir, DOC), read(DOC));
    writeFileSync(path.join(dir, TPL), read(TPL));
    writeFileSync(path.join(dir, 'templates', 'repo-starter', 'FRESH-EYES-REQUEST.md'), read('templates', 'repo-starter', 'FRESH-EYES-REQUEST.md'));
    writeFileSync(path.join(dir, 'templates', 'README.md'), '# t\nFRESH-EYES-REQUEST.md\n');
    writeFileSync(path.join(dir, 'README.md'), '# t\n' + DOC + '\n');
    writeFileSync(path.join(dir, 'docs', '10-checklists.md'), '[ ] ' + DOC + '\n');
    const r = runGuard(dir);
    assert.match(r.out, /F16\/金魚審：[^]*五處同步/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/* ---------- 2026-11-19 自我審查（docs/53）搵到嘅漏洞，要有人守 ---------- */
test('漏洞 #1 唔可以復發：PLAYBOOK 唔可以再叫子 App 用簽票／後端驗票做預設', () => {
  const pb = read('PLAYBOOK.md');
  // SG12／docs/50 §3.8 B 已定案「唔需要」；SG7-a／SG11-b 唔可以建議相反做法
  for (const line of pb.split('\n')) {
    if (!/\|\s*\*\*SG(7-a|11-b)\*\*/.test(line)) continue;
    assert.doesNotMatch(line, /改用簽票|＋\s*§4\.3 簽票\s*＋\s*後端/, `SG 行唔可以再叫簽票：${line.slice(0, 80)}`);
    assert.match(line, /唔准|唔可以/, `${line.slice(0, 40)} 要明寫「唔准」做技術防線`);
  }
  assert.match(read('docs', '50-app-store-whitelist-and-shutdown.md'), /## 3\.8 真正目的[^]*技術防線（唔採用）/);
});

test('漏洞 #2 唔可以復發：有 Web Push 嘅 app 唔准寫成「可以落閘」', () => {
  const cl = read('docs', '10-checklists.md');
  assert.doesNotMatch(cl, /有 Web Push 嘅 app 維持 `open` 或改用/, '唔可以寫「或改用 entry-gate」（等於允許落閘）');
  assert.match(cl, /有 Web Push 嘅 app 一律維持 `open`，唔准落閘/);
});

test('漏洞 #3 唔可以復發：新加 checklist 要跟 PLAYBOOK 原文用語', () => {
  const pb = read('PLAYBOOK.md');
  const cl = read('docs', '10-checklists.md');
  // 每條都抽 PLAYBOOK 原文一句關鍵字，checklist 必須有
  const pairs = [
    ['F17', '先安全底層 → 再功能 → 最後 UI 糖衣'],
    ['W7', '只放 unit／date／hash'],
    ['A18', '外部系統零特權'],
    ['S5', 'grep `public/images/assets`'],
    ['V5', '可由成品圖反查版本'],
  ];
  for (const [id, kw] of pairs) {
    assert.ok(pb.includes(kw), `PLAYBOOK ${id} 原文應該有「${kw}」`);
    assert.ok(cl.includes(kw), `docs/10 ${id} checklist 要跟原文用「${kw}」，唔可以自創講法`);
  }
});

test('漏洞 #6 唔可以復發：docs/52 要講「重審完仍有 CRITICAL 點算」', () => {
  const t = read('docs', '52-fresh-eyes-review.md');
  assert.match(t, /仍然有 CRITICAL[^。]*改結構/, '重審完仍有 CRITICAL 要有出口，否則會無限審');
});

test('docs/53 自我審查報告存在，而且明寫「唔算金魚審」（唔准扮做過）', () => {
  const t = read('docs', '53-self-audit-2026-11-19.md');
  assert.match(t, /唔係\*{0,2}金魚審|唔算\*{0,2}金魚審/, '要老實講呢份唔係金魚審');
  assert.match(t, /捉唔到/, '要列出新檢查嘅上限');
});

/* ---------- 2026-11-19：Arena 優勢 ＋ 委託書（用戶指出新對話模型可能唔同） ---------- */
test('docs/52 要寫明 Arena 優勢：新對話可能連模型都唔同（隔離更徹底）', () => {
  const t = read('docs', '52-fresh-eyes-review.md');
  assert.match(t, /可能換埋底層模型|底層模型都可能唔同/, '要講明 Arena 換對話＝可能換模型');
  assert.match(t, /更強|更徹底/, '要講明隔離比上游強');
});

test('docs/52 要寫「唔同模型」嘅代價同對策（唔會以為廣東話係錯）', () => {
  const t = read('docs', '52-fresh-eyes-review.md');
  for (const k of ['冇檔案系統', '唔知本倉慣例', '會用另一套審美']) {
    assert.ok(t.includes(k), `要有代價「${k}」同對策`);
  }
  assert.match(t, /當噪音/, 'reviewer 講「改英文／改正式啲」要當噪音');
});

test('委託書存在，而且 7 條規矩齊（唔准建議改法／改語言／改檔案）', () => {
  const t = read('templates', 'repo-starter', 'FRESH-EYES-REQUEST.md');
  for (const k of ['唔准建議改法', '唔准建議改語言', '唔准改任何檔案', '改寫', 'CRITICAL', '50 條']) {
    assert.ok(t.includes(k), `委託書缺「${k}」`);
  }
  // 要有「開新對話」同「貼全文」（新 AGENT 可能冇檔案系統）
  assert.match(t, /開一個新對話/);
  assert.match(t, /全文/);
  // 唔可以叫人喺原本對話貼
  assert.match(t, /唔好.*喺原本嗰個對話貼/s);
});

test('guard：委託書缺規矩／缺 README 指針 會 FAIL（唔係寫住好聽）', () => {
  const dir = tempRepo();
  try {
    writeFileSync(path.join(dir, DOC), read(DOC));
    writeFileSync(path.join(dir, TPL), read(TPL));
    mkdirSync(path.join(dir, 'templates'), { recursive: true });
    writeFileSync(path.join(dir, 'templates', 'README.md'), '# t\n');
    writeFileSync(path.join(dir, 'README.md'), '# t\n' + DOC + '\n');
    writeFileSync(path.join(dir, 'docs', '10-checklists.md'), '[ ] ' + DOC + '\n');
    // ① 完全冇委託書
    let r = runGuard(dir);
    assert.equal(r.ok, false, '缺委託書應該 FAIL');
    assert.match(r.out, /FRESH-EYES-REQUEST/);
    // ② 有委託書但缺「唔准建議改語言」
    writeFileSync(path.join(dir, 'templates', 'repo-starter', 'FRESH-EYES-REQUEST.md'),
      read('templates', 'repo-starter', 'FRESH-EYES-REQUEST.md').replace(/唔准建議改語言/g, '可以建議改語言'));
    r = runGuard(dir);
    assert.equal(r.ok, false, '委託書缺語言規矩應該 FAIL');
    assert.match(r.out, /唔准建議改語言/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
