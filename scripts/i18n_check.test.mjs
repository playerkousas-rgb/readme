// ✅ 雙語介面 L 檢查器守護測試（F14：每條規則一定要有測試）
// 跑：node --test scripts/i18n_check.test.mjs
// 校準基準：4 個 BOOK 嘅真實 i18n.jsx / App.jsx 形狀（docs/44 §0 pinned commit）
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { check, collectFiles, VERSION } from './i18n_check_v1.0.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const has = (r, id, level) => r.findings.some((f) => f.id === id && (!level || f.level === level));

/** BOOK 形狀：React context + chipbar 掣（SCOUTBOOK／CUBSBOOK／VSBOOK 嗰種） */
function bookLike(extra = '') {
  return `
const LANG_KEY = 'scoutbook.lang';
function readLang() {
  try { return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'zh'; } catch { return 'zh'; }
}
export function LangProvider({ children }) {
  const [lang, setLang] = useState(readLang);
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang === 'en' ? 'en' : 'zh-Hant-HK');
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* 私隱模式 */ }
  }, [lang]);
  const isEn = lang === 'en';
  const toggle = () => setLang(isEn ? 'zh' : 'en');
  return <Ctx.Provider value={{ lang, isEn, setLang, toggle }}>{children}</Ctx.Provider>;
}
export const bi = (lang, zh, en) => (lang === 'en' && en ? en : zh);
export function Bar() {
  const { isEn, toggle } = useLang();
  return <div className="chipbar">
    <button type="button" className="chipbtn chipbtn--lang" onClick={toggle}
      title={isEn ? '切換至中文介面' : 'Switch to English'}
      aria-label={isEn ? '切換至中文介面' : 'Switch to English'}>
      {isEn ? '中文' : 'EN'}
    </button>
  </div>;
}
${extra}`;
}

test('版本常數同檔名一致（V1）', () => {
  assert.equal(VERSION, 'v1.0');
});

test('BOOK 形狀嘅實作應該 0 FAIL', () => {
  const r = check(bookLike(), 'i18n.jsx');
  assert.equal(r.ok, true);
  assert.equal(has(r, 'L2/toggle', 'PASS'), true);
  assert.equal(has(r, 'L3/attrs', 'PASS'), true);
  assert.equal(has(r, 'L3/store-throw', 'PASS'), true);
});

test('完全冇雙語實作 → WARN 唔係 FAIL（L 係可豁免規則，唔迫現有單語言 app）', () => {
  const r = check('<!doctype html><html lang="zh-Hant"><body><h1>活動報名</h1></body></html>', 'index.html');
  assert.equal(r.ok, true, '唔可以因為冇英文就 FAIL');
  assert.equal(has(r, 'L1/scope', 'WARN'), true);
  assert.match(r.findings.find((f) => f.id === 'L1/scope').msg, /EXCEPTION: L1/);
});

test('有字典但冇切換掣 → FAIL（唔係 WARN 就算）', () => {
  const src = bookLike().replace(/<button[\s\S]*?<\/button>/, '<span>EN</span>');
  const r = check(src, 'i18n.jsx');
  assert.equal(r.ok, false);
  assert.equal(has(r, 'L2/toggle', 'FAIL'), true);
});

test('掣冇 aria-label → FAIL（無障礙唔可以靜靜跳過）', () => {
  const r = check(bookLike().replace(/\s*aria-label=\{[^}]*\}/, ''), 'i18n.jsx');
  assert.equal(r.ok, false);
  assert.equal(has(r, 'L2/aria', 'FAIL'), true);
});

test('掣顯示當前語言（ROVERBOOK 嗰種）→ WARN 指出偏離，唔係 FAIL', () => {
  const r = check(bookLike().replace("{isEn ? '中文' : 'EN'}", "{isEn ? 'EN' : '中'}"), 'i18n.jsx');
  assert.equal(has(r, 'L2/label', 'WARN'), true);
  assert.equal(r.ok, true, '呢個係約定問題，唔應該硬擋');
});

test('唔設 <html lang> → FAIL（螢幕閱讀器／SEO 會讀錯語言）', () => {
  const r = check(bookLike().replace(/\s*root\.setAttribute\('lang',[^;]*;/, ''), 'i18n.jsx');
  assert.equal(r.ok, false);
  assert.equal(has(r, 'L3/lang', 'FAIL'), true);
});

test('唔設 data-lang → FAIL（CSS 做唔到乾淨分離）', () => {
  const r = check(bookLike().replace(/\s*root\.setAttribute\('data-lang',[^;]*;/, ''), 'i18n.jsx');
  assert.equal(r.ok, false);
  assert.equal(has(r, 'L3/data-lang', 'FAIL'), true);
});

test('localStorage 冇 try/catch → FAIL（私隱模式會炸）', () => {
  const src = `
const DICT = { zh: { a: '儲存' }, en: { a: 'Save' } };
localStorage.setItem('myapp.lang', 'zh');
document.documentElement.setAttribute('data-lang', 'zh');
document.documentElement.setAttribute('lang', 'zh-Hant-HK');
<button data-lang-toggle aria-label="Switch to English" title="Switch to English">EN</button>`;
  const r = check(src, 'app.js');
  assert.equal(r.ok, false);
  assert.equal(has(r, 'L3/store-throw', 'FAIL'), true);
});

test('語言 key 冇 app 前綴 → WARN（同一 domain 會互相踩）', () => {
  const r = check(bookLike().replace(/'scoutbook\.lang'/g, "'lang'"), 'i18n.jsx');
  assert.equal(has(r, 'L3/key', 'WARN'), true);
  assert.equal(r.ok, true);
});

test('用 navigator.language 自動決定 → WARN（L3 要跟 BOOK 預設中文）', () => {
  const r = check(bookLike().replace('localStorage.getItem(LANG_KEY) === \'en\' ? \'en\' : \'zh\'', "navigator.language.startsWith('en') ? 'en' : 'zh'"), 'i18n.jsx');
  assert.equal(has(r, 'L3/default', 'WARN'), true);
});

test('英文字典缺鍵 → FAIL', () => {
  const src = bookLike("const DICT = { zh: { save: '儲存', cancel: '取消' }, en: { save: 'Save' } };");
  const r = check(src, 'i18n.jsx');
  assert.equal(r.ok, false);
  assert.equal(has(r, 'L4/dict-keys', 'FAIL'), true);
  assert.match(r.findings.find((f) => f.id === 'L4/dict-keys').msg, /cancel/);
});

test('英文字典空值 → FAIL（切英文會出空白，L5）', () => {
  const src = bookLike("const DICT = { zh: { save: '儲存' }, en: { save: '' } };");
  const r = check(src, 'i18n.jsx');
  assert.equal(r.ok, false);
  assert.equal(has(r, 'L4/dict-empty', 'FAIL'), true);
});

test('字典齊全 → PASS 並報條數（L1 字串閘參考）', () => {
  const r = check(bookLike("const DICT = { zh: { save: '儲存' }, en: { save: 'Save' } };"), 'i18n.jsx');
  assert.equal(has(r, 'L4/dict', 'PASS'), true);
  assert.equal(r.ok, true);
});

test('字典超過 300 條 → WARN 提示可豁免（雙閘嘅字串，唔係 FAIL）', () => {
  const pairs = (en) => Array.from({ length: 301 }, (_, i) => `k${i}: '${en ? `Label ${i}` : `標籤${i}`}'`).join(', ');
  const r = check(bookLike(`const DICT = { zh: { ${pairs(false)} }, en: { ${pairs(true)} } };`), 'i18n.jsx');
  assert.equal(has(r, 'L1/strings', 'WARN'), true);
  assert.equal(r.ok, true, '字串多係豁免理由，唔係違規');
});

test('抽唔到字典條目唔可以扮 PASS（要 WARN 叫人人手核）', () => {
  const r = check(bookLike('const DICT = buildDict();'), 'i18n.jsx');
  assert.equal(has(r, 'L4/dict', 'PASS'), false, '0 條唔代表齊全');
});

test('硬塞「日期 Date」→ WARN（SCOUTBOOK ui_contracts 攔嘅）', () => {
  const r = check(bookLike("const DICT = { zh: { d: '日期 Date', n: '姓名 Name' }, en: { d: 'Date', n: 'Name' } };"), 'i18n.jsx');
  assert.equal(has(r, 'L4/mixed', 'WARN'), true);
  assert.match(r.findings.find((f) => f.id === 'L4/mixed').msg, /日期 Date/);
});

test('中文句子入面嘅全大寫縮寫（QR／JSON）唔可以誤判為並排', () => {
  const r = check(bookLike("const S = ['出示 QR', '請即時匯出 JSON 備份'];"), 'i18n.jsx');
  assert.equal(has(r, 'L4/mixed', 'PASS'), true, '呢啲係正常中文用法，唔係中英並排');
});

test('註解入面嘅中英對照解說唔當 UI 字串', () => {
  const r = check(bookLike('// 掣顯示目標語言：中文模式顯示 English label\n/* 日期 Date 呢種寫法唔准 */'), 'i18n.jsx');
  assert.equal(has(r, 'L4/mixed', 'PASS'), true);
});

test('bi() 缺英文 arg → WARN 提醒未譯埋（BOOK 會 fall back，唔會空白）', () => {
  const r = check(bookLike("const x = bi(lang, '儲存', '');"), 'i18n.jsx');
  assert.equal(has(r, 'L5/fallback', 'WARN'), true);
  assert.equal(r.ok, true);
});

test('repo 範本自己過關（dogfooding）', () => {
  const p = path.join(HERE, '..', 'templates', 'i18n', 'lang_toggle_v1.0.js');
  const r = check(readFileSync(p, 'utf8'), 'lang_toggle_v1.0.js');
  assert.equal(r.ok, true, JSON.stringify(r.findings.filter((f) => f.level === 'FAIL')));
  assert.equal(has(r, 'L4/dict', 'PASS'), true);
  assert.equal(has(r, 'L3/store-throw', 'PASS'), true);
});

test('多檔（React：i18n.jsx + App.jsx 分開）當一個 app 睇', () => {
  const all = bookLike();
  const cut = all.indexOf('export function Bar()');
  const r = check([
    { name: 'i18n.jsx', text: all.slice(0, cut) },
    { name: 'App.jsx', text: all.slice(cut) },
  ], 'web/src');
  assert.equal(r.ok, true);
  assert.equal(has(r, 'L2/toggle', 'PASS'), true);
});

test('目錄掃描唔可以將檢查器自己當成雙語實作（自我誤觸）', () => {
  const files = collectFiles(HERE);
  assert.equal(files.some((f) => /^i18n_check_v/.test(f.name)), false);
  assert.equal(check(files, 'scripts').ok, true);
});

test('連續 check 唔好累積上一次結果', () => {
  check(bookLike().replace(/\s*aria-label=\{[^}]*\}/, ''), 'bad.jsx');
  const r = check(bookLike(), 'good.jsx');
  assert.equal(r.findings.some((f) => f.level === 'FAIL'), false);
});

/* ---- F16：規則四處同步（PLAYBOOK / docs+README / guard+CI / templates） ---- */
const ROOT = path.resolve(HERE, '..');
const read = (...p) => readFileSync(path.join(ROOT, ...p), 'utf8');

test('F16/L：雙語規則四處同步，門檻同豁免格式唔可以漏', () => {
  const pb = read('PLAYBOOK.md');
  const doc = read('docs', '44-bilingual-ui.md');
  const cl = read('docs', '10-checklists.md');
  const rd = read('README.md');
  const dix = read('docs', 'README.md');
  const tpl = read('templates', 'README.md');

  for (const id of ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'])
    assert.ok(pb.includes(id) && doc.includes(id), `PLAYBOOK / docs/44 缺 ${id}`);

  // 雙閘 = 體積 + 字串量；兩個門檻數字要一致
  for (const t of [pb, doc, cl]) {
    assert.match(t, /300/, '字串閘 300 要寫明');
    assert.match(t, /5MB/, '體積閘 5MB 要寫明');
    assert.match(t, /EXCEPTION: L1/, '豁免格式要寫明');
  }
  assert.match(pb, /可豁免/, 'L 係可豁免，唔可以寫成硬鐵律');
  assert.ok(rd.includes('docs/44-bilingual-ui.md'), '根 README 要有導覽');
  assert.ok(dix.includes('44-bilingual-ui.md'), 'docs/README 要有索引行');
  assert.ok(tpl.includes('i18n/lang_toggle_v1.0.js'), 'templates 對照表要有範本');
  assert.match(read('.github', 'workflows', 'guard.yml'), /i18n_check\.test\.mjs/, 'CI 要跑守護測試');
});

test('L 唔可以混入 S/F/A/W/V 硬擋清單（用戶揀 soft enforcement）', () => {
  const pb = read('PLAYBOOK.md');
  const violation = pb.slice(pb.indexOf('## 11. 違規處理'));
  assert.match(violation, /條件式通用規則/, '§11 要講清 L 同硬底線嘅分別');
  assert.match(violation, /唔係喺 CI 擋/, 'L 豁免係 code review 追，唔係 CI 擋');
  assert.match(read('README.md'), /唔係第六條硬鐵律/, 'README 要講明唔係第六鐵律');
});

test('範圍：只為未來新開 app 定義，現有 repo 唔追溯（用戶 2026-11-08 定案）', () => {
  const pb = read('PLAYBOOK.md');
  const doc = read('docs', '44-bilingual-ui.md');
  const rd = read('README.md');
  const cl = read('docs', '10-checklists.md');
  for (const [name, txt] of [['PLAYBOOK', pb], ['docs/44', doc], ['README', rd], ['docs/10', cl]]) {
    assert.match(txt, /唔追溯/, `${name} 要寫明現有 repo 唔追溯`);
  }
  assert.match(pb, /新開/, 'PLAYBOOK 要寫明只適用於新開 app');
  assert.match(doc, /2026-11-08/, 'docs/44 要有定案日期做界線');
  // 唔好留返「大改就跟」呢種追溯口徑
  assert.equal(/大改嗰陣跟/.test(pb + doc), false, '唔可以用大改做追溯觸發點');
  // 檢查器提示都要講清舊 app 可以忽略
  const r = check('<html lang="zh-Hant"><body><h1>舊工具</h1></body></html>', 'legacy.html');
  assert.equal(r.ok, true);
  assert.match(r.findings.find((f) => f.id === 'L1/scope').msg, /唔追溯/);
});

test('規則有 pinned 證據：4 個 BOOK commit link（唔靠估）', () => {
  const doc = read('docs', '44-bilingual-ui.md');
  for (const book of ['SCOUTBOOK', 'CUBSBOOK', 'ROVERBOOK', 'VSBOOK'])
    assert.ok(doc.includes(book), `docs/44 缺 ${book} 參考`);
  const pins = [...doc.matchAll(/github\.com\/playerkousas-rgb\/\w+\/(?:blob|commit)\/([0-9a-f]{40})/g)];
  assert.ok(pins.length >= 8, `要有 pinned commit 連結，實際 ${pins.length}`);
  assert.match(doc, /未.*實測|冇安裝/, '要寫明未安裝未實測嘅邊界');
});
