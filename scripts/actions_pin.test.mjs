// ✅ Actions pin SHA 守護測試（A16 / G）
// 跑：node --test scripts/actions_pin.test.mjs
// 來源：docs/43 §5 源碼評審吸收清單 — 「CI actions 釘 SHA」要有測試守（F14），
//       唔可以淨係改自己個 workflow 就算（範本一抄出去就要同樣安全）。
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GUARD_SRC = path.join(ROOT, 'scripts', 'guard.mjs');
const SHA_A = '11d5960a326750d5838078e36cf38b85af677262';
const SHA_B = '49933ea5288caeca8642d1e84afbd3f7d6820020';

/**
 * 起一個最小 app repo（無 PLAYBOOK = 非真理倉），淨係放 workflow 嚟試 pin 檢查。
 * guard 用 import.meta.url 定位 ROOT（唔係 cwd），所以一定要將 guard 抄入 temp repo
 * 嘅 scripts/ 先至驗到嗰個 repo；就咁改 cwd 會仍然驗緊本倉（實測過呢個陷阱）。
 */
function withRepo(workflow, fn) {
  const dir = mkdtempSync(path.join(tmpdir(), 'guard-actionspin-'));
  try {
    writeFileSync(path.join(dir, 'README.md'), '# test\n');
    writeFileSync(path.join(dir, '.gitignore'), '.env\nnode_modules/\ndist/\n');
    writeFileSync(path.join(dir, '.vercelignore'), 'node_modules/\n.git/\n.cache/\n*.bak\n*.log\ndocs/\n');
    mkdirSync(path.join(dir, 'scripts'), { recursive: true });
    copyFileSync(GUARD_SRC, path.join(dir, 'scripts', 'guard.mjs'));
    if (workflow !== null) {
      mkdirSync(path.join(dir, '.github', 'workflows'), { recursive: true });
      writeFileSync(path.join(dir, '.github', 'workflows', 'ci.yml'), workflow);
    }
    return fn(dir);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

/** guard 用 exit 1 表示 FAIL，所以要接住非零 exit 攞 stdout */
function runGuard(cwd) {
  const guard = path.join(cwd, 'scripts', 'guard.mjs');
  try {
    return { ok: true, out: execFileSync(process.execPath, [guard], { cwd, encoding: 'utf8' }) };
  } catch (e) {
    return { ok: false, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

const wf = (uses) => `name: ci
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
${uses.map(u => `      - uses: ${u}`).join('\n')}
`;

test('A16：浮動 tag @v4 要 FAIL（tag 可以被人移位）', () => {
  withRepo(wf(['actions/checkout@v4']), (dir) => {
    const r = runGuard(dir);
    assert.equal(r.ok, false, '浮動 tag 唔可以過 guard');
    assert.match(r.out, /A16：.*actions\/checkout@v4 未釘 commit SHA/);
  });
});

test('A16：branch 名（@main）同短 SHA 都要 FAIL', () => {
  for (const ref of ['actions/checkout@main', 'actions/checkout@11d5960']) {
    withRepo(wf([ref]), (dir) => {
      const r = runGuard(dir);
      assert.equal(r.ok, false, `${ref} 唔可以過 guard`);
      assert.match(r.out, /A16：.*未釘 commit SHA/);
    });
  }
});

test('A16：40-hex SHA + 版號註解要 PASS（Dependabot 靠註解認版本）', () => {
  withRepo(wf([`actions/checkout@${SHA_A} # v4.4.0`, `actions/setup-node@${SHA_B} # v4.4.0`]), (dir) => {
    const r = runGuard(dir);
    assert.equal(r.ok, true, r.out);
    assert.match(r.out, /A16：.*2 個外部 action 全部釘 SHA/);
  });
});

test('A16：本機 composite action ./ 唔使 SHA；docker:// 要 sha256 digest', () => {
  withRepo(wf(['./.github/actions/setup', `actions/checkout@${SHA_A}`]), (dir) => {
    const r = runGuard(dir);
    assert.equal(r.ok, true, r.out);
    assert.match(r.out, /1 個外部 action 全部釘 SHA/);   // 本機嗰個唔計
  });
  withRepo(wf(['docker://alpine:3.20']), (dir) => {
    assert.equal(runGuard(dir).ok, false, 'docker tag 唔可以當已釘');
  });
  withRepo(wf([`docker://alpine@sha256:${'a'.repeat(64)}`]), (dir) => {
    assert.equal(runGuard(dir).ok, true, 'docker digest 應該當已釘');
  });
});

test('A16：冇 workflow 嘅 repo（純 HTML 工具）唔應該被誤判 FAIL', () => {
  withRepo(null, (dir) => {
    const r = runGuard(dir);
    assert.equal(r.ok, true, r.out);
    assert.match(r.out, /A16：無 workflow/);
  });
});

test('A16：本倉 workflow + templates/github 範本全部已釘 SHA（範本一抄出去就安全）', () => {
  for (const f of ['.github/workflows/guard.yml', 'templates/github/guard.yml']) {
    const txt = readFileSync(path.join(ROOT, f), 'utf8');
    const refs = [...txt.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)/gm)].map(m => m[1]);
    assert.ok(refs.length > 0, `${f} 應該有 uses`);
    for (const ref of refs) assert.match(ref, /@[0-9a-f]{40}$/, `${f} 有未釘 SHA 嘅 ${ref}`);
    assert.match(txt, /# v\d+\.\d+\.\d+/, `${f} 要有版號註解畀 Dependabot 升`);
  }
});

test('F16：寫入結果狀態規則四處同步（PLAYBOOK + docs/02 + docs/10 + docs/43）', () => {
  const pb = readFileSync(path.join(ROOT, 'PLAYBOOK.md'), 'utf8');
  const f6 = readFileSync(path.join(ROOT, 'docs', '02-foolproof.md'), 'utf8');
  const cl = readFileSync(path.join(ROOT, 'docs', '10-checklists.md'), 'utf8');
  const src = readFileSync(path.join(ROOT, 'docs', '43-api-anything-codegraph.md'), 'utf8');
  for (const state of ['not_sent', 'not_applied', 'accepted', 'may_have_applied', 'applied']) {
    assert.ok(f6.includes(state), `docs/02 F6-b 缺狀態 ${state}`);
    assert.ok(pb.includes(state), `PLAYBOOK F6 缺狀態 ${state}`);
  }
  assert.match(f6, /F6-b/, 'docs/02 要有 F6-b 節');
  assert.match(pb, /02-foolproof\.md#f6-b/, 'PLAYBOOK 要指向 F6-b 詳情');
  assert.match(f6, /readback/, 'F6-b 要講 readback');
  assert.match(cl, /F6-b/, 'docs/10 施工 checklist 要引用 F6-b');
  assert.match(src, /may_have_applied/, 'docs/43 源碼證據要保留狀態名');
  // 老實邊界：guard 驗唔到 backend 有冇真做 readback，文件要寫明係人手實測
  assert.match(f6, /人手|runtime/, 'F6-b 要標明驗收係人手／runtime，唔係 guard');
});
