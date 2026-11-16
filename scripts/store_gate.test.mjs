import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...segs) => readFileSync(path.join(ROOT, ...segs), 'utf8');
const cjs = { exports: {} };
vm.runInNewContext(read('templates', 'vercel', 'store_gate_v1.0.js'), {
  URL,
  module: cjs,
  exports: cjs.exports,
});
const gate = cjs.exports;

/** 極簡 DOM mock（零依賴，驗開 APP 時白名單／關站對話框與背景隱藏） */
function makeMockEnv({
  referrer = '',
  inIframe = false,
  standalone = false,
  navigatorStandalone = false,
  storageThrows = false,
  lang = 'zh-HK',
  dataLang = '',
  selfOrigin = 'https://scoutbook-five.vercel.app',
} = {}) {
  const store = new Map();
  const makeElement = (tag) => {
    const attrs = new Map();
    const el = {
      tagName: String(tag).toUpperCase(),
      id: '',
      className: '',
      textContent: '',
      href: '',
      target: '',
      rel: '',
      children: [],
      get firstChild() {
        return this.children[0] || null;
      },
      setAttribute(k, v) {
        attrs.set(k, String(v));
        if (k === 'id') this.id = String(v);
      },
      getAttribute(k) {
        return attrs.has(k) ? attrs.get(k) : null;
      },
      appendChild(child) {
        this.children.push(child);
        return child;
      },
      removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx >= 0) this.children.splice(idx, 1);
        return child;
      },
    };
    return el;
  };

  const html = makeElement('html');
  if (lang) html.setAttribute('lang', lang);
  if (dataLang) html.setAttribute('data-lang', dataLang);
  const head = makeElement('head');
  const body = makeElement('body');
  html.appendChild(head);
  html.appendChild(body);

  const findById = (node, id) => {
    if (node.id === id) return node;
    for (const ch of node.children) {
      const hit = findById(ch, id);
      if (hit) return hit;
    }
    return null;
  };

  const doc = {
    referrer,
    documentElement: html,
    head,
    body,
    createElement: makeElement,
    getElementById(id) {
      return findById(html, id);
    },
    addEventListener() {},
  };

  const timers = [];
  const win = {
    document: doc,
    navigator: { standalone: navigatorStandalone, serviceWorker: { ready: true } },
    matchMedia(q) {
      return { matches: q === '(display-mode: standalone)' && standalone };
    },
    sessionStorage: {
      getItem(k) {
        if (storageThrows) throw new Error('SecurityError: storage disabled');
        return store.has(k) ? store.get(k) : null;
      },
      setItem(k, v) {
        if (storageThrows) throw new Error('SecurityError: storage disabled');
        store.set(k, String(v));
      },
    },
    location: {
      origin: selfOrigin,
      replacedWith: null,
      replace(u) {
        this.replacedWith = u;
      },
    },
    setTimeout(fn, ms) {
      timers.push({ fn, ms });
      return timers.length;
    },
  };
  win.self = win;
  win.top = inIframe ? { location: win.location } : win;

  return { win, doc, store, timers };
}

test('SG/V1：store_gate_v1.0.js 版本常數與檔名一致', () => {
  assert.equal(gate.VERSION, 'v1.0');
});

test('SG1：mode=open 預設公開直連，唔攔截亦唔插入遮罩', () => {
  const { win, doc } = makeMockEnv();
  const res = gate.initStoreGate({ appKey: 'demo', mode: 'open' }, win);
  assert.equal(res.allowed, true);
  assert.equal(doc.documentElement.getAttribute('data-store-gated'), null);
  assert.equal(doc.getElementById('scoutStoreGate'), null);
});

test('SG3/SG5：mode=entry-gate 無白名單來源直入時攔截，開 APP 時清晰告知有白名單並隱藏底層內容', () => {
  const { win, doc } = makeMockEnv({ referrer: '' });
  const res = gate.initStoreGate({ appKey: 'scoutbook', mode: 'entry-gate' }, win);
  assert.equal(res.allowed, false);
  assert.equal(res.reason, 'missing-whitelist-entry');
  assert.equal(doc.documentElement.getAttribute('data-store-gated'), 'missing-whitelist-entry');

  const style = doc.getElementById('scoutStoreGateStyle');
  assert.ok(style, '要注入隱藏底層 App 內容嘅 style');
  assert.match(style.textContent, /body > :not\(#scoutStoreGate\)\s*\{\s*display:\s*none\s*!important/);

  const dialog = doc.getElementById('scoutStoreGate');
  assert.ok(dialog, '要渲染白名單提示對話框');
  assert.equal(dialog.getAttribute('role'), 'dialog');
  assert.equal(dialog.getAttribute('aria-modal'), 'true');

  const texts = dialog.children.map((c) => c.textContent).join(' | ');
  assert.match(texts, /白名單/, '開 APP 時必須明確告知用戶有白名單');
  assert.match(texts, /SCOUT APP STORE/, '必須指明經 SCOUT APP STORE 開啟');

  const actions = dialog.children.find((c) => c.className === 'sg-actions');
  const cta = actions.children.find((c) => c.tagName === 'A');
  assert.equal(cta.href, 'https://scoutappstore.vercel.app/');
  assert.equal(cta.target, '_top', '按鈕要用 _top 防被外層框架困住');
});

test('SG5：mode=entry-gate 由 scoutappstore.vercel.app 進入放行，並寫入 sessionStorage 保住 F5 重整', () => {
  const env1 = makeMockEnv({ referrer: 'https://scoutappstore.vercel.app/index.html#apps' });
  const res1 = gate.initStoreGate({ appKey: 'scoutbook', mode: 'entry-gate' }, env1.win);
  assert.equal(res1.allowed, true);
  assert.equal(res1.reason, 'referrer-whitelist');
  assert.equal(env1.store.get('scoutbook.store_pass'), '1');

  // 模擬同分頁 F5 重整（referrer 變空，但 sessionStorage 有通行證）
  env1.doc.referrer = '';
  const res2 = gate.initStoreGate({ appKey: 'scoutbook', mode: 'entry-gate' }, env1.win);
  assert.equal(res2.allowed, true);
  assert.equal(res2.reason, 'session-pass');
});

test('SG5/A9：嚴格比對 Origin，攔截前綴偽造（scoutappstore.vercel.app.evil.com）與 HTTP 降級', () => {
  const attacks = [
    'https://scoutappstore.vercel.app.evil.com/',
    'https://evil.com/?from=https://scoutappstore.vercel.app',
    'http://scoutappstore.vercel.app/',
    'javascript:alert(1)',
  ];
  for (const fakeRef of attacks) {
    const { win } = makeMockEnv({ referrer: fakeRef });
    const res = gate.initStoreGate({ appKey: 'demo', mode: 'entry-gate' }, win);
    assert.equal(res.allowed, false, `偽造來源 ${fakeRef} 必須被攔截`);
  }
});

test('SG2/SG5：已加入主畫面嘅 standalone PWA（Android matchMedia / iOS navigator.standalone）直開自動放行', () => {
  const androidPwa = makeMockEnv({ referrer: '', standalone: true });
  assert.equal(gate.initStoreGate({ appKey: 'book', mode: 'entry-gate' }, androidPwa.win).allowed, true);

  const iosPwa = makeMockEnv({ referrer: '', navigatorStandalone: true });
  assert.equal(gate.initStoreGate({ appKey: 'book', mode: 'entry-gate' }, iosPwa.win).allowed, true);

  // 若個別 app 顯式設 allowStandalone: false 則同樣受閘門限制
  const strict = makeMockEnv({ referrer: '', standalone: true });
  assert.equal(
    gate.initStoreGate({ appKey: 'book', mode: 'entry-gate', allowStandalone: false }, strict.win).allowed,
    false,
  );

  // SG7 誠實邊界：iOS 主畫面 WebClip 嘅 standalone 容器會「獨立」儲存，
  // 由 Safari 入口入 vs 撳 icon 入係兩個唔同倉。刻意經入口入亦會放行，兩者都正常。
  const viaPortal = makeMockEnv({ referrer: 'https://scoutappstore.vercel.app/' });
  const viaPortalRes = gate.initStoreGate({ appKey: 'book', mode: 'entry-gate' }, viaPortal.win);
  assert.equal(viaPortalRes.allowed, true);
  assert.equal(viaPortalRes.reason, 'referrer-whitelist');
});

test('SG8：入口網站自己永遠唔會被閘（portalIds 含自身 origin 時 fail-closed 攔截，防自我鎖死）', () => {
  const self = makeMockEnv({ referrer: '', selfOrigin: 'https://scoutappstore.vercel.app' });
  const res = gate.initStoreGate({
    appKey: 'appstore_self',
    mode: 'entry-gate',
    portalIds: ['appstore', 'library', 'member', 'district'],
  }, self.win);
  assert.equal(res.allowed, true, '入口自己必須放行，否則四大入口全部鎖死');
  assert.equal(res.reason, 'self-portal');
  assert.equal(self.doc.getElementById('scoutStoreGate'), null, '入口自己唔應該見到任何閘卡');

  // 子 App（自身 origin 唔在名單）照樣正常受閘
  const child = makeMockEnv({ referrer: '' });
  const childRes = gate.initStoreGate({ appKey: 'child', mode: 'entry-gate', portalIds: ['appstore'] }, child.win);
  assert.equal(childRes.allowed, false);

  // 入口自己用 iframe-only（例如母站自己都掛同一支 script）：仍然要放行，否則連母站都開唔到
  const selfIframe = makeMockEnv({ referrer: '', selfOrigin: 'https://scout-circulars.vercel.app' });
  const r3 = gate.initStoreGate({ appKey: 'self2', mode: 'iframe-only', portalIds: ['library'] }, selfIframe.win);
  assert.equal(r3.allowed, true);
  assert.equal(r3.reason, 'self-portal');

  // 入口自己唔喺名單內（例如子 App 版）→ 照樣當普通子 App 攔截
  const notSelf = makeMockEnv({ referrer: '', selfOrigin: 'https://scout-circulars.vercel.app' });
  const r3b = gate.initStoreGate({ appKey: 'self2b', mode: 'iframe-only', portalIds: ['appstore'] }, notSelf.win);
  assert.equal(r3b.allowed, false);

  // closed（關站）係最高優先：連入口自己都應該見到告示，唔會被 self 放行掩蓋
  const selfClosed = makeMockEnv({ referrer: '', selfOrigin: 'https://scoutappstore.vercel.app' });
  const r4 = gate.initStoreGate({ appKey: 'self3', mode: 'closed' }, selfClosed.win);
  assert.equal(r4.allowed, false, '軟關站要蓋過 self 放行');
});
test('SG7：直開網址（無入口 Referer）時提示卡要講清楚「加入主畫面」要由入口入，防裝出打不開嘅圖示', () => {
  const { win, doc } = makeMockEnv({ referrer: '' });
  gate.initStoreGate({ appKey: 'book', mode: 'entry-gate', portalIds: ['appstore', 'library'] }, win);
  const dialog = doc.getElementById('scoutStoreGate');
  const subs = dialog.children.filter((c) => c.className === 'sg-sub');
  assert.ok(subs.some((el) => /加入主畫面/.test(el.textContent)), '要顯示加入主畫面提示');
  assert.ok(subs.some((el) => /打不開/.test(el.textContent)), '要講明裝錯來源會打不開');

  // 英文介面同樣要有
  const en = makeMockEnv({ referrer: '', lang: 'en-US' });
  gate.initStoreGate({ appKey: 'book', mode: 'entry-gate' }, en.win);
  const enDialog = en.doc.getElementById('scoutStoreGate');
  assert.ok(
    enDialog.children.filter((c) => c.className === 'sg-sub').some((el) => /Add to Home Screen/i.test(el.textContent)),
    '英文介面要有 Add to Home Screen 提示',
  );

  // showInstallHint: false 可以關閉（例如內部工具唔想提 PWA）
  const quiet = makeMockEnv({ referrer: '' });
  gate.initStoreGate({ appKey: 'book', mode: 'entry-gate', showInstallHint: false }, quiet.win);
  const quietDialog = quiet.doc.getElementById('scoutStoreGate');
  assert.equal(quietDialog.children.filter((c) => c.className === 'sg-sub').length, 0);

  // 軟關站（closed）唔應該提安裝（關站中無得裝）
  const closed = makeMockEnv({ referrer: '' });
  gate.initStoreGate({ appKey: 'book', mode: 'closed' }, closed.win);
  const closedDialog = closed.doc.getElementById('scoutStoreGate');
  assert.equal(closedDialog.children.filter((c) => c.className === 'sg-sub').length, 0);
});

test('SG5/L3：Safari 私隱模式 sessionStorage 拋錯時唔會 crash，白名單 Referer 依然正常放行', () => {
  const { win } = makeMockEnv({
    referrer: 'https://scoutappstore.vercel.app/',
    storageThrows: true,
  });
  const res = gate.initStoreGate({ appKey: 'privateapp', mode: 'entry-gate' }, win);
  assert.equal(res.allowed, true);
  assert.equal(res.reason, 'referrer-whitelist');
});

test('SG4：mode=iframe-only 喺 iframe 內放行，頂層直開攔截並告知只供白名單網站嵌入', () => {
  const inside = makeMockEnv({ inIframe: true });
  assert.equal(gate.initStoreGate({ appKey: 'calc', mode: 'iframe-only' }, inside.win).allowed, true);

  const topLevel = makeMockEnv({ inIframe: false });
  const res = gate.initStoreGate({ appKey: 'calc', mode: 'iframe-only' }, topLevel.win);
  assert.equal(res.allowed, false);
  assert.equal(res.reason, 'not-in-iframe');
  const dialog = topLevel.doc.getElementById('scoutStoreGate');
  assert.ok(dialog);
  assert.match(dialog.children.map((c) => c.textContent).join(' '), /白名單網站/);
});

test('SG6：mode=closed 軟關站顯示暫時關閉提示卡，支援英文模式與可選倒數跳轉', () => {
  const { win, doc, timers } = makeMockEnv({ dataLang: 'en' });
  const res = gate.initStoreGate(
    { appKey: 'oldtool', mode: 'closed', autoRedirectSeconds: 5 },
    win,
  );
  assert.equal(res.allowed, false);
  assert.equal(res.reason, 'closed');
  const dialog = doc.getElementById('scoutStoreGate');
  const texts = dialog.children.map((c) => c.textContent).join(' | ');
  assert.match(texts, /temporarily closed/i);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].ms, 5000);
  timers[0].fn();
  assert.equal(win.location.replacedWith, 'https://scoutappstore.vercel.app/');
});

test('SG3/SG5：portals 多指定入口白名單（同時容許 SCOUT APP STORE ＋ 通告圖書館，攔截直連並畫出雙入口按鈕）', () => {
  const multiPortals = [
    { labelZh: '前往 SCOUT APP STORE', labelEn: 'Go to SCOUT APP STORE', url: 'https://scoutappstore.vercel.app/' },
    { labelZh: '前往通告圖書館', labelEn: 'Go to Notice Library', url: 'https://scout-circulars.vercel.app/' },
  ];

  // 1) 由 SCOUT APP STORE 進入 -> 放行
  const fromStore = makeMockEnv({ referrer: 'https://scoutappstore.vercel.app/' });
  const r1 = gate.initStoreGate({ appKey: 'multiapp', mode: 'entry-gate', portals: multiPortals }, fromStore.win);
  assert.equal(r1.allowed, true);
  assert.equal(r1.matchedOrigin, 'https://scoutappstore.vercel.app');

  // 2) 由通告圖書館進入（假設已移除 noreferrer 送出 origin Referer）-> 放行
  const fromLibrary = makeMockEnv({ referrer: 'https://scout-circulars.vercel.app/' });
  const r2 = gate.initStoreGate({ appKey: 'multiapp', mode: 'entry-gate', portals: multiPortals }, fromLibrary.win);
  assert.equal(r2.allowed, true);
  assert.equal(r2.matchedOrigin, 'https://scout-circulars.vercel.app');

  // 3) 未列於白名單嘅外站或直打網址（含 noreferrer 清空 Referer 情況）-> 攔截並同時顯示兩個指定入口掣
  const direct = makeMockEnv({ referrer: '' });
  const r3 = gate.initStoreGate({ appKey: 'multiapp', mode: 'entry-gate', portals: multiPortals }, direct.win);
  assert.equal(r3.allowed, false);
  const dialog = direct.doc.getElementById('scoutStoreGate');
  assert.ok(dialog);
  const actions = dialog.children.find((c) => c.className === 'sg-actions');
  assert.ok(actions, '應有 .sg-actions 按鈕容器');
  assert.equal(actions.children.length, 2, '應同時顯示 App Store 同通告圖書館兩個入口掣');
  assert.equal(actions.children[0].href, 'https://scoutappstore.vercel.app/');
  assert.equal(actions.children[0].textContent, '前往 SCOUT APP STORE');
  assert.equal(actions.children[1].href, 'https://scout-circulars.vercel.app/');
  assert.equal(actions.children[1].textContent, '前往通告圖書館');
});

test('SG1/SG5：PORTAL_REGISTRY 官方四大入口註冊表（1 APP STORE／2 圖書館／3 成員系統／4 區管理系統）', () => {
  assert.deepEqual([...gate.PORTAL_IDS], ['appstore', 'library', 'member', 'district']);
  assert.deepEqual(
    [...gate.portalsFromIds(['appstore', 'library', 'member', 'district'])].map((p) => p.origin),
    [
      'https://scoutappstore.vercel.app',
      'https://scout-circulars.vercel.app',
      'https://member-portal-sigma-swart.vercel.app',
      'https://scout-district-portal.vercel.app',
    ],
  );
  // 順序固定 1/2/3/4，唔理傳入次序
  assert.deepEqual(
    [...gate.portalsFromIds(['district', 'appstore'])].map((p) => p.id),
    ['appstore', 'district'],
  );
  // 未知 id / 重複 id 靜靜略過，唔會 throw
  assert.deepEqual([...gate.portalsFromIds(['nope', 'library', 'library'])].map((p) => p.id), ['library']);
  assert.equal(gate.portalsFromIds('appstore').length, 0);
  assert.equal(gate.getPortal('MEMBER').origin, 'https://member-portal-sigma-swart.vercel.app');
  assert.equal(gate.getPortal('unknown-id'), null);
  // 4 個入口全部 https 且無尾斜線以外的路徑
  for (const id of gate.PORTAL_IDS) {
    const p = gate.getPortal(id);
    assert.equal(gate.parseAllowedOrigin(p.url), p.origin);
    assert.ok(gate.PORTAL_REGISTRY[id].repo.startsWith('playerkousas-rgb/'), `${id} 要記 repo`);
  }
});

test('SG1/SG5：portalIds 直接引用四大入口即可放行／攔截（唔使逐個 app 抄網址）', () => {
  const ids = ['appstore', 'library', 'member', 'district'];
  for (const id of ['appstore', 'member', 'district']) {
    const { win } = makeMockEnv({ referrer: `${gate.getPortal(id).origin}/some/page` });
    const res = gate.initStoreGate({ appKey: `byid_${id}`, mode: 'entry-gate', portalIds: ids }, win);
    assert.equal(res.allowed, true, `由 ${id} 進入應放行`);
    assert.equal(res.matchedOrigin, gate.getPortal(id).origin);
  }
  // 未登記入口（例如舊有 website.evil.com 前綴偽造）一律攔
  const spoof = makeMockEnv({ referrer: 'https://scoutappstore.vercel.app.evil.com/' });
  const r = gate.initStoreGate({ appKey: 'byid_spoof', mode: 'entry-gate', portalIds: ids }, spoof.win);
  assert.equal(r.allowed, false);

  // 攔截卡按 1/2/3/4 順序畫出四粒掣
  const direct = makeMockEnv({ referrer: '' });
  gate.initStoreGate({ appKey: 'byid_ui', mode: 'entry-gate', portalIds: ids }, direct.win);
  const dialog = direct.doc.getElementById('scoutStoreGate');
  const actions = dialog.children.find((c) => c.className === 'sg-actions');
  assert.equal(actions.children.length, 4);
  assert.deepEqual(
    actions.children.map((a) => a.href),
    [...gate.portalsFromIds(ids)].map((p) => p.url),
  );
  assert.equal(actions.children[0].textContent, '1. 前往 APP STORE');
});

test('SG5：portals（自訂）同 portalIds（官方）並存時按 Origin 去重合併，唔會重複放行同一入口', () => {
  const troop = { labelZh: '前往第 21 旅門戶', labelEn: 'Go to Troop 21 Portal', url: 'https://troop21.vercel.app/' };
  const direct = makeMockEnv({ referrer: '' });
  gate.initStoreGate({
    appKey: 'mixed',
    mode: 'entry-gate',
    portals: [troop],
    portalIds: ['appstore', 'library'],
  }, direct.win);
  const dialog = direct.doc.getElementById('scoutStoreGate');
  const actions = dialog.children.find((c) => c.className === 'sg-actions');
  assert.deepEqual(actions.children.map((a) => a.href), [
    'https://troop21.vercel.app/',
    'https://scoutappstore.vercel.app/',
    'https://scout-circulars.vercel.app/',
  ]);

  // 自訂入口本身亦要有放行資格（Referer 比對）
  const fromTroop = makeMockEnv({ referrer: 'https://troop21.vercel.app/home' });
  const res = gate.initStoreGate({ appKey: 'mixed2', mode: 'entry-gate', portals: [troop], portalIds: ['appstore'] }, fromTroop.win);
  assert.equal(res.allowed, true);
  assert.equal(res.matchedOrigin, 'https://troop21.vercel.app');
});

test('F4：串錯 mode 字串（例如 entry_gate）一律 fail closed 攔截，唔會靜靜放行', () => {
  const { win } = makeMockEnv({ referrer: 'https://scoutappstore.vercel.app/' });
  const res = gate.initStoreGate({ appKey: 'demo', mode: 'entry_gate_typo' }, win);
  assert.equal(res.allowed, false);
  assert.equal(res.reason, 'invalid-mode-fail-closed');
});

test('SG4/SG6：vercel.iframe-whitelist.json 無 X-Frame-Options 相沖，且 redirects 用 permanent: false', () => {
  const raw = read('templates', 'vercel', 'vercel.iframe-whitelist.json');
  const vj = JSON.parse(raw);
  assert.deepEqual(vj.regions, ['hkg1']);
  assert.equal(/X-Frame-Options/i.test(raw), false, '唔可以保留 X-Frame-Options: SAMEORIGIN');

  const allHeaders = (vj.headers || []).flatMap((h) => h.headers || []);
  const csp = allHeaders.find((h) => h.key.toLowerCase() === 'content-security-policy');
  assert.ok(csp && csp.value.includes('frame-ancestors https://scoutappstore.vercel.app'));

  assert.ok(Array.isArray(vj.redirects) && vj.redirects.length >= 1);
  for (const r of vj.redirects) {
    assert.equal(r.permanent, false, '必須用 permanent: false (302)，防 308 永久快取鎖死');
  }
});

test('F16/SG：規則、INTAKE Q8、範本、checklist、CI 與 website 實查證據四處同步', () => {
  const pb = read('PLAYBOOK.md');
  const doc = read('docs', '50-app-store-whitelist-and-shutdown.md');
  const intake = read('templates', 'repo-starter', 'INTAKE.md');
  const cl = read('docs', '10-checklists.md');
  const rd = read('README.md');
  const dix = read('docs', 'README.md');
  const wf = read('.github', 'workflows', 'guard.yml');

  for (const id of ['SG1', 'SG2', 'SG3', 'SG4', 'SG5', 'SG6', 'SG7', 'SG8']) {
    assert.ok(pb.includes(id) && doc.includes(id), `PLAYBOOK / docs/50 缺 ${id}`);
  }
  assert.ok(intake.includes('Q8') && intake.includes('entry-gate'), 'INTAKE 第 0 步要有 Q8 主動告知白名單與 entry-gate');
  assert.ok(cl.includes('SG1'), 'docs/10-checklists.md 要有 SG1');
  assert.ok(rd.includes('docs/50-app-store-whitelist-and-shutdown.md'), '根 README 要有導覽');
  assert.ok(dix.includes('50-app-store-whitelist-and-shutdown.md'), 'docs/README 要有索引');
  assert.match(wf, /store_gate\.test\.mjs/, 'guard.yml 要跑 store_gate.test.mjs');
  assert.match(doc, /041f0742dbabeffa3405b5c0b208f4935f1a215c/, 'docs/50 要有 website pinned commit 實查連結');
  // 四大官方入口註冊表要同 PORTAL_REGISTRY 完全對齊（同一份真理）
  for (const id of gate.PORTAL_IDS) {
    const p = gate.getPortal(id);
    assert.ok(doc.includes(p.origin), `docs/50 §0.1 缺 ${id} Origin（${p.origin}）`);
    assert.equal(gate.parseAllowedOrigin(p.url), p.origin, `${id} origin 要同 url 對齊`);
    assert.ok(doc.includes(p.repo), `docs/50 §0.1 缺 ${id} repo（${p.repo}）`);
  }
  for (const kw of ['1. APP STORE', '2. 圖書館', '3. 成員系統', '4. 區管理系統']) {
    assert.ok(doc.includes(kw), `docs/50 要明寫四大入口「${kw}」`);
  }
  assert.ok(doc.includes('PORTAL_REGISTRY') && doc.includes('portalIds'), 'docs/50 要寫明 PORTAL_REGISTRY／portalIds 用法');
  // SG7：直開網址／404／加入主畫面 嘅情境表要喺 docs/50 §3.4 有紀錄
  for (const kw of ['3.4', '404', '加入主畫面', '白名單真實代價']) {
    assert.ok(doc.includes(kw), `docs/50 §3.4 要覆蓋「${kw}」`);
  }
  assert.ok(intake.includes('SG7'), 'INTAKE Q8 要提 SG7 加入主畫面流程');
  assert.ok(pb.includes('PORTAL_REGISTRY') || pb.includes('portalIds'), 'PLAYBOOK 要提註冊表／portalIds');
});
