/**
 * lang_toggle_v1.0.js — 雙語切換範本（L1–L6 / docs/44-bilingual-ui.md）
 * © SCOUT SYSTEM · COPYRIGHT SCOUT SYSTEM
 *
 * 用法（單一 HTML / Canvas，零依賴）：
 *   ① 抄呢段入 <script>（或 <script src>），改 LANG_KEY 前綴同 DICT
 *   ② 每個要翻譯嘅元素加 data-i18n="key"；placeholder 用 data-i18n-placeholder
 *   ③ 右上角放 <button type="button" id="langBtn" data-lang-toggle>EN</button>
 *   ④ 行 initLang() 一次
 *
 * 設計跟 4 個 BOOK（SCOUTBOOK／CUBSBOOK／ROVERBOOK／VSBOOK web/src/i18n.jsx）：
 *   預設中文、localStorage try/catch、切換時改 data-lang + lang、掣顯示「目標語言」。
 *
 * 紅線：
 *   - 一次顯示一種語言（L4）；唔好將「日期 Date」寫死成一個字串
 *   - 英文缺譯要 fall back 中文，唔可以出空白（L5）
 *   - 唔引入 i18n 套件（S1）
 */

const VERSION = 'v1.0';

/** 每個 app 改自己前綴，避免同一 domain 幾個 app 互相踩（L3） */
const LANG_KEY = 'myapp.lang';

/** 單一字典 = 單一真理（F1）：同一個詞全 app 譯法一致（L4） */
const DICT = {
  zh: {
    'app.title': '我的工具',
    'action.save': '儲存',
    'action.cancel': '取消',
    'field.name': '姓名',
    'field.date': '日期',
    'msg.saved': '已儲存',
    'msg.failed': '儲存失敗，請再試',
    'lang.switch': 'Switch to English',
  },
  en: {
    'app.title': 'My Tool',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'field.name': 'Name',
    'field.date': 'Date',
    'msg.saved': 'Saved',
    'msg.failed': 'Save failed, please retry',
    'lang.switch': '切換至中文介面',
  },
};

/** localStorage 可以 throw（Safari 私隱模式）；讀唔到／壞值一律 fall back 中文 */
function readLang() {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'zh';
  } catch {
    return 'zh';
  }
}

/** 缺譯 fall back 中文，唔好出空白（L5，對齊 BOOK bi()） */
function t(lang, key) {
  const table = DICT[lang] || DICT.zh;
  return table[key] ?? DICT.zh[key] ?? key;
}

function applyLang(lang, doc = document) {
  const root = doc.documentElement;
  root.setAttribute('data-lang', lang);                          // 畀 CSS 用（L4）
  root.setAttribute('lang', lang === 'en' ? 'en' : 'zh-Hant-HK'); // 螢幕閱讀器 / SEO（L3）

  for (const el of doc.querySelectorAll('[data-i18n]')) {
    el.textContent = t(lang, el.getAttribute('data-i18n'));
  }
  for (const el of doc.querySelectorAll('[data-i18n-placeholder]')) {
    el.setAttribute('placeholder', t(lang, el.getAttribute('data-i18n-placeholder')));
  }
  for (const el of doc.querySelectorAll('[data-i18n-title]')) {
    const s = t(lang, el.getAttribute('data-i18n-title'));
    el.setAttribute('title', s);
    el.setAttribute('aria-label', s);
  }

  // 掣顯示「目標語言」：中文模式顯示 EN，英文模式顯示 中文（L2）
  for (const btn of doc.querySelectorAll('[data-lang-toggle]')) {
    btn.textContent = lang === 'en' ? '中文' : 'EN';
    const label = t(lang, 'lang.switch');
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  }

  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* 私隱模式：記唔到都照行，唔可以炸 */
  }
  return lang;
}

function initLang(doc = document) {
  let lang = applyLang(readLang(), doc);
  for (const btn of doc.querySelectorAll('[data-lang-toggle]')) {
    btn.addEventListener('click', () => {
      lang = applyLang(lang === 'en' ? 'zh' : 'en', doc);
    });
  }
  return () => lang;
}

// Node（測試用）匯出；瀏覽器直接用上面嘅 function
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VERSION, LANG_KEY, DICT, readLang, t, applyLang, initLang };
}
