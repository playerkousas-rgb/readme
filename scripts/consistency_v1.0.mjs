#!/usr/bin/env node
/* 全倉一致性審計（一次性 AGENT gate，唔係 CI）。零第三方依賴。
   方法借自用戶畀嘅兩個 GIT：
     mattpocock/skills  -> AGENTS 分類憲法 / SCOPE 兩條 bar / GLOSSARY 術語 / code-review 兩軸（Standards + Spec）
     Leonxlnx/taste-skill -> strict frontmatter / UTF-8 / node --check / critique「望成品唔望 code」
   用法： node scripts/consistency_v1.0.mjs [repo-path] [--json]
   任何 FAIL -> exit 1；WARN/INFO 入 backlog，唔阻塞。
*/
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const VERSION = 'v1.0';
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const root = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const findings = [];
const add = (level, axis, id, file, line, detail) =>
  findings.push({ level, axis, id, file, line: line || 0, detail });

const SKIP = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '__pycache__', '.cache', '.venv', 'Unselected files']);
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    if (SKIP.has(n)) continue;
    const p = path.join(dir, n);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const all = walk(root);
const rel = (p) => path.relative(root, p).replace(/\\/g, '/');
const textOf = (p) => { try { return readFileSync(p, 'utf8'); } catch { return ''; } };
const mdFiles = all.filter((p) => p.endsWith('.md'));
const textFiles = all.filter((p) => /\.(md|txt|json|yml|yaml|html|css|js|mjs|cjs|ts|tsx|gs|py|sql|example|gitignore|vercelignore)$/i.test(p));
const lineOf = (txt, idx) => txt.slice(0, idx).split('\n').length;

/* ============ 1. MECHANICS（taste-skill：strict / UTF-8 / syntax / frontmatter） ============ */
const MOJIBAKE = new RegExp('[\\u00C3\\u00C2][\\u00A9\\u00A8\\u00AA\\u00B0\\u00BC\\u00BD\\u00BE].');
for (const p of textFiles) {
  const t = textOf(p);
  if (t.includes('\uFFFD') || MOJIBAKE.test(t)) add('FAIL', 'Mechanics', 'utf8', rel(p), 0, '雙重編碼／壞 UTF-8');
  if (/\{\{[A-Z0-9_]+\}\}/.test(t) && !rel(p).startsWith('templates/') && !rel(p).includes('repo-starter') && !rel(p).includes('LICENSE-MIT'))
    add('FAIL', 'Mechanics', 'placeholder', rel(p), 0, '非模板檔有未填 {{...}}');
}
for (const p of all.filter((f) => f.endsWith('.mjs'))) {
  const r = spawnSync(process.execPath, ['--check', p], { encoding: 'utf8' });
  if (r.status !== 0) add('FAIL', 'Mechanics', 'syntax', rel(p), 0, 'node --check 失敗');
}
const SECRET = [
  [/AIza[0-9A-Za-z_-]{30,}/, 'Google API key'],
  [/sk-(live|proj)-[A-Za-z0-9_-]{16,}/, 'OpenAI key'],
  [/gh[pousr]_[A-Za-z0-9]{20,}/, 'GitHub token'],
  [/Bearer\s+[A-Za-z0-9._~+/-]{24,}/, 'Bearer 字面值'],
];
for (const p of all.filter((f) => /\.(json|yml|yaml|js|mjs|cjs|ts|tsx|gs|py|html|env|example)$/i.test(f))) {
  const t = textOf(p);
  for (const [re, name] of SECRET) {
    const m = re.exec(t);
    if (m) add('FAIL', 'Mechanics', 'secret', rel(p), lineOf(t, m.index), `疑似 ${name}（呢個 pattern guard.mjs 未必捉到）`);
  }
}
const cs = path.join(root, 'scripts', 'check_skills_v1.0.mjs');
if (existsSync(cs)) {
  const r = spawnSync(process.execPath, [cs, root, '--json'], { encoding: 'utf8' });
  try { const j = JSON.parse(r.stdout); if (!j.ok) for (const e of j.errors) add('FAIL', 'Mechanics', 'frontmatter', 'SKILL.md', 0, e); }
  catch { add('WARN', 'Mechanics', 'frontmatter', 'SKILL.md', 0, 'check_skills 輸出唔到 JSON'); }
}
for (const p of all.filter((f) => /_v\d+\.\d+\.mjs$/.test(f))) {
  const tag = p.match(/_v(\d+\.\d+)\.mjs$/)[1];
  if (!new RegExp(`VERSION\\s*=\\s*['\"]v${tag.replace('.', '\\.')}['\"]`).test(textOf(p)))
    add('FAIL', 'Mechanics', 'script-version', rel(p), 0, `檔名 v${tag} 但內文無 VERSION = 'v${tag}'`);
}

/* ============ 2. STANDARDS（mattpocock：一個事實一次、索引、章節、術語） ============ */
const docsDir = path.join(root, 'docs');
const docFiles = existsSync(docsDir) ? readdirSync(docsDir).filter((n) => /^\d{2}-.*\.md$/.test(n)) : [];
const docByNum = new Map(docFiles.map((n) => [n.slice(0, 2), path.join(docsDir, n)]));
const idxTxt = textOf(path.join(docsDir, 'README.md'));
for (const n of docFiles) if (!idxTxt.includes(n)) add('FAIL', 'Standards', 'index-coverage', 'docs/README.md', 0, `docs/${n} 無索引行`);
const navTxt = textOf(path.join(root, 'README.md'));
const navNums = [...docByNum.keys()].filter((n) => parseInt(n, 10) >= 25);   // 由檔案樹推導，加 docs/33 都自動跟
for (const num of navNums) {
  if (!navTxt.includes(`docs/${num}-`)) add('FAIL', 'Standards', 'nav-coverage', 'README.md', 0, `根 README §1 無 docs/${num} 導覽`);
}
// 章節號順序 + 同檔重複標題（GitHub 錨點會撞）
for (const p of mdFiles) {
  const t = textOf(p); const seen = new Map(); let last = -1;
  for (const line of t.split('\n')) {
    // 只計 ## 章節（### 13d 呢類「項目號」唔當章節，否則會假陽性）
    const h = /^##\s+(\d+)([a-z])?(?:\.|\s)/.exec(line);
    if (h) { const n = parseInt(h[1], 10); if (n < last) add('WARN', 'Standards', 'section-order', rel(p), 0, `章節號倒退：${last} → ${n}`); last = n; }
    // CHANGELOG 每個版本都有 ### Added 係 Keep a Changelog 標準格式，唔當混亂
    if (rel(p).startsWith('templates/') || /CHANGELOG/i.test(rel(p))) continue;
    const hd = /^#{1,6}\s+(.+)$/.exec(line);
    if (hd) {
      const slug = hd[1].trim().toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, '').replace(/ /g, '-');
      if (seen.has(slug)) add('WARN', 'Standards', 'anchor-duplicate', rel(p), 0, `標題重複「${hd[1].trim()}」，錨點會撞`);
      seen.set(slug, true);
    }
  }
}
// 文字式章節指針：[28](...) §6 / [27 §2b](...) 要有對應標題
const headingKeys = new Map();
for (const [num, p] of docByNum) {
  const keys = new Set();
  for (const line of textOf(p).split('\n')) {
    const m = /^#{2,3}\s+(\d+[a-z]?(?:\.\d+)?)(?:\.|\s|$)/.exec(line);
    if (m) keys.add(m[1]);
  }
  headingKeys.set(num, keys);
}
for (const p of mdFiles) {
  const t = textOf(p);
  const refs = [];
  for (const m of t.matchAll(/\[(\d+)\]\(([^)]+\.md)\)\s*§(\d+[a-z]?(?:\.\d+)?)/g)) refs.push([m[1], m[3], m.index, m[2]]);
  for (const m of t.matchAll(/\[(\d+)\s*§(\d+[a-z]?(?:\.\d+)?)\]\(([^)]+\.md)\)/g)) refs.push([m[1], m[2], m.index, m[3]]);
  for (const [num, key, at, link] of refs) {
    const keys = headingKeys.get(num);
    if (keys && !keys.has(key)) add('WARN', 'Standards', 'section-ref', rel(p), lineOf(t, at), `指去 docs/${num} §${key}，但嗰份無 ## ${key} 標題`);
    void link;
  }
}
// 數字聲稱：同一個事實全倉要一致（一個事實只寫一次）
const CLAIMS = [
  { name: '輕', re: /(\d+)\s*個「輕」/g, canon: 30 },
  { name: '中', re: /(\d+)\s*個「中」/g, canon: 21 },
  { name: '重', re: /(\d+)\s*個「重」/g, canon: 34 },
  { name: '有後台', re: /(\d+)\s*個有後台/g, canon: 30 },
  { name: '空殼', re: /(\d+)\s*個空殼/g, canon: 12 },
  { name: 'AI', re: /(\d+)\s*個同 Gemini／AI 有關/g, canon: 17 },
];
for (const p of mdFiles) {
  const t = textOf(p);
  for (const c of CLAIMS) for (const m of t.matchAll(c.re)) {
    const v = parseInt(m[1], 10);
    if (v !== c.canon) add('FAIL', 'Standards', 'numeric-claim', rel(p), lineOf(t, m.index), `「${c.name}」寫 ${v}， canon 係 ${c.canon}`);
  }
}
// 舊講法指紋（上一版內容分類 / 未修正數字）
const STALE = [
  [/31 個「輕」|31 個有後台|18 個同 Gemini|13 個空殼/g, '舊版數字'],
  [/兩軸分類|主題 × 性質|11 類參考/g, '上一版內容分類講法'],
  [/§6 陷阱表/g, '陷阱表喺 §7，唔係 §6'],
  [/\[28\]\([^)]*\)\s*嘅 80\/85/g, '80/85 LICENSE 統計喺 docs/27 §1，唔係 28'],
  [/\[28\]\([^)]*\)\s*見到嘅 80 個無 LICENSE/g, '80 個無 LICENSE 喺 docs/27 §1'],
  [/可選第 13 項|可選 13d/g, '13d PREFLIGHT 係必跑，唔可以寫「可選」'],
  [/當中 8 個係空殼/g, '空殼／預留係 12 個（docs/28 §3），唔好硬湊 8'],
];
const isAuditReport = (p) => rel(p) === 'docs/32-consistency-audit.md';
for (const p of mdFiles) {
  if (isAuditReport(p)) continue;   // 報告要引用已修正嘅舊講法做證據，唔當矛盾
  const t = textOf(p);
  for (const [re, why] of STALE) for (const m of t.matchAll(re)) add('FAIL', 'Standards', 'stale-phrase', rel(p), lineOf(t, m.index), why);
}

/* ============ 3. SPEC（code-review 兩軸：忠於用戶原意） ============ */
const startTxt = textOf(path.join(root, 'templates', 'repo-starter', 'START.md'));
// 起手包摘要唔可以只講第 13 項（第 14 項已加）
for (const p of ['README.md', 'docs/README.md', 'templates/README.md']) {
  const t = textOf(path.join(root, p));
  for (const line of t.split('\n')) {
    if (/12 樣/.test(line) && /第 13 項|可選 13/.test(line) && !/第 14 項/.test(line))
      add('FAIL', 'Spec', 'starter-summary', p, 0, `起手包摘要漏咗第 14 項：${line.slice(0, 90)}`);
  }
}
// 「可選」同「所有新 repo 都應該有」唔可以撈埋
if (/必跑（所有新 repo）|所有新 repo 都應該有/.test(startTxt)) {
  for (const p of mdFiles) {
    if (isAuditReport(p)) continue;
    const t = textOf(p);
    for (const m of t.matchAll(/可選第 13 項[^\n]*PREFLIGHT/g))
      add('FAIL', 'Spec', 'optionality', rel(p), lineOf(t, m.index), '13d 係必跑，但標題寫「可選第 13 項 … PREFLIGHT」');
  }
}
// PREFLIGHT 係全倉 gate，唔可以只掛喺一種形式
for (const p of mdFiles) {
  if (isAuditReport(p)) continue;
  const t = textOf(p);
  for (const m of t.matchAll(/^\|[^\n]*框架 SPA[^\n]*PREFLIGHT/gm))
    add('FAIL', 'Spec', 'preflight-scope', rel(p), lineOf(t, m.index), 'PREFLIGHT 係所有新 repo 嘅開局 gate，唔應該只列喺「框架 SPA」嗰行');
}
// 用戶明確唔想每次 push 跑 YML；L1 描述唔好再叫 CI gate
for (const p of mdFiles) {
  const t = textOf(p);
  for (const m of t.matchAll(/本工具 `--json` 做 CI gate|`FAIL > 0` 就 exit 1，CI 要紅/g))
    add('WARN', 'Spec', 'ci-wording', rel(p), lineOf(t, m.index), '用詞仲係 CI gate，同「AGENT 開局前檢查、唔靠 push YML」易撈亂');
}
// 第 0 步 intake 要有檔、README 要指去佢、repo-setup 要有「先問用戶」
const intakePath = path.join(root, 'templates', 'repo-starter', 'INTAKE.md');
if (!existsSync(intakePath)) add('FAIL', 'Spec', 'intake-wired', 'templates/repo-starter/INTAKE.md', 0, '缺第 0 步問卷：AGENT 會靠估');
const rmTxt = textOf(path.join(root, 'README.md'));
const rmStart = rmTxt.indexOf('## 🆕 開新 REPO');
const rmEnd = rmTxt.indexOf('## 📖 唔使讀晒');
const rmBlock = rmStart >= 0 ? rmTxt.slice(rmStart, rmEnd >= 0 ? rmEnd : undefined) : '';
if (!rmBlock.includes('INTAKE.md')) add('FAIL', 'Spec', 'intake-wired', 'README.md', 0, '根 README 🆕 開新 REPO 區無指去 INTAKE.md（用戶會叫 AGENT 先睇 README）');
const rsTxt = textOf(path.join(root, 'templates', 'repo-starter', 'skills', 'promoted', 'repo-setup', 'SKILL.md'));
if (!/0\. \*\*先主動問用戶\*\*/.test(rsTxt)) add('FAIL', 'Spec', 'intake-wired', 'repo-setup/SKILL.md', 0, 'repo-setup 無第 0 步「先主動問用戶」');

// 起手包要真係有 SKILL.md，而且要寫入 AGENTS.md（否則「AGENT 開局有用」係假）
const starterSkills = all.filter((f) => /templates\/repo-starter\/skills\/.*\/SKILL\.md$/.test(rel(f)));
if (starterSkills.length < 2)
  add('FAIL', 'Spec', 'skills-wired', 'templates/repo-starter/skills/', 0, `起手包得 ${starterSkills.length} 份 SKILL.md，預期至少 2 份核心（repo-setup / design-review）`);
const agentsTxt = textOf(path.join(root, 'templates', 'repo-starter', 'AGENTS.md'));
for (const f of starterSkills) {
  const name = path.basename(path.dirname(f));
  if (!agentsTxt.includes(name))
    add('FAIL', 'Spec', 'skills-wired', 'templates/repo-starter/AGENTS.md', 0, `AGENTS.md 無明確指名 skill「${name}」`);
}

// 2026-11-02：所有 SKILL.md 一定要入 skills/CATALOG.md，目錄本身要喺總索引搵到
const catPath = path.join(root, 'templates', 'repo-starter', 'skills', 'CATALOG.md');
const starterRoot = path.join(root, 'templates', 'repo-starter');
if (!existsSync(catPath)) {
  add('FAIL', 'Spec', 'skills-catalog', 'templates/repo-starter/skills/CATALOG.md', 0, '缺 SKILL 唯一目錄，之後加 skill 無處可查');
} else {
  const catTxt = textOf(catPath);
  for (const f of starterSkills) {
    const relp = path.relative(starterRoot, f).replace(/\\/g, '/');
    const name = path.basename(path.dirname(f));
    if (!catTxt.includes(name) || !catTxt.includes(relp))
      add('FAIL', 'Spec', 'skills-catalog', 'skills/CATALOG.md', 0, `SKILL「${name}」未入目錄（缺 ${relp}）`);
  }
  for (const idx of ['docs/README.md', 'templates/README.md', 'templates/repo-starter/docs/skills/README.md', 'templates/repo-starter/AGENTS.md']) {
    if (!textOf(path.join(root, idx)).includes('CATALOG.md'))
      add('FAIL', 'Spec', 'skills-catalog', idx, 0, '無指去 skills/CATALOG.md（新加 skill 嘅人搵唔到目錄）');
  }
}

// docs/28 §5 逐個表要 85 行
const tax = textOf(path.join(docsDir, '28-repo-taxonomy.md'));
const taxSection = tax.slice(tax.indexOf('## 5. 85 個 repo 逐個'), tax.indexOf('## 6. 形式 →'));
const taxRows = [...taxSection.matchAll(/^\| `[^`]+` \|/gm)].length;
if (taxRows !== 85) add('FAIL', 'Spec', 'taxonomy-rows', 'docs/28-repo-taxonomy.md', 0, `§5 逐個表得 ${taxRows} 行，應為 85`);

/* ============ OUTPUT ============ */
const counts = findings.reduce((o, f) => (o[f.level] = (o[f.level] || 0) + 1, o), {});
const failed = findings.filter((f) => f.level === 'FAIL');
const result = {
  tool: 'consistency', version: VERSION, repo: root,
  ok: failed.length === 0, counts,
  scanned: { files: all.length, md: mdFiles.length, docs: docFiles.length, text: textFiles.length },
  findings,
};
if (asJson) console.log(JSON.stringify(result, null, 2));
else {
  for (const f of findings) console.log(`  ${f.level.padEnd(4)} ${f.axis.padEnd(9)} ${f.id.padEnd(18)} ${f.file}${f.line ? ':' + f.line : ''} — ${f.detail}`);
  console.log(failed.length
    ? `\n❌ CONSISTENCY FAIL — ${failed.length} 項矛盾／混亂（${all.length} 檔 / ${mdFiles.length} MD）`
    : `\n✅ CONSISTENCY PASS — 無 FAIL（${all.length} 檔 / ${mdFiles.length} MD；WARN ${counts.WARN || 0}）`);
}
process.exit(failed.length ? 1 : 0);
