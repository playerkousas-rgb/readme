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
    localStorage: {
      getItem(k) {
        if (storageThrows) throw new Error('SecurityError: storage disabled');
        return store.has(k) ? store.get(k) : null;
      },
      setItem(k, v) {
        if (storageThrows) throw new Error('SecurityError: storage disabled');
        store.set(k, String(v));
      },
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

test('SG9：入口角色（main／feed／internal）同 matchedPortalId——只准主站帶分享連結／QR', () => {
  const byId = Object.fromEntries(gate.portalsFromIds(['appstore', 'library', 'member', 'district']).map((p) => [p.id, p]));
  assert.equal(byId.appstore.role, 'main', 'APP STORE 係真正主站，唯一應該帶分享連結／QR');
  assert.equal(byId.library.role, 'feed', '圖書館係每日引流入口');
  assert.equal(byId.member.role, 'internal', '成員系統係自家副系統入口');
  assert.equal(byId.district.role, 'internal', '區管理系統係自家副系統入口');

  // 由邊個入口入，要識別得返（用嚟做逐入口統計）
  for (const id of ['appstore', 'library', 'member', 'district']) {
    const { win } = makeMockEnv({ referrer: `${byId[id].origin}/tools` });
    const res = gate.initStoreGate({ appKey: `stat_${id}`, mode: 'entry-gate', portalIds: ['appstore', 'library', 'member', 'district'] }, win);
    assert.equal(res.allowed, true);
    assert.equal(res.matchedPortalId, id, `要識別由 ${id} 進入`);
  }

  // standalone／session pass 冇入口身份（唔應該當成由某個入口入）
  const pwa = makeMockEnv({ referrer: '', standalone: true });
  assert.equal(gate.initStoreGate({ appKey: 'stat_pwa', mode: 'entry-gate' }, pwa.win).matchedPortalId, undefined);
});

test('SG9：shareUrl 必須指返入口（main 角色），唔可以複製子站 URL', () => {
  const { win } = makeMockEnv({ referrer: '' });
  const seen = [];
  const original = win.navigator;
  Object.defineProperty(win.navigator, 'clipboard', {
    configurable: true,
    value: { writeText: (t) => { seen.push(t); return { then: () => {} }; } },
  });
  const res = gate.initStoreGate({
    appKey: 'share_demo',
    mode: 'entry-gate',
    portalIds: ['appstore', 'library'],
    shareUrl: 'https://scoutappstore.vercel.app/?app=demo',
  }, win);
  assert.equal(res.allowed, false);
  assert.ok(original);
  // shareUrl 只會用於引導，唔應該被當成放行來源
  assert.equal(res.reason, 'missing-whitelist-entry');
  assert.equal(seen.length, 0);
});

test('SG10：逐入口到訪統計 opt-in，預設零請求；payload 唔含任何個人資料', () => {
  // 1) 預設（無 trackEndpoint）完全唔發請求
  const quiet = makeMockEnv({ referrer: 'https://scout-circulars.vercel.app/' });
  let calls = 0;
  quiet.win.fetch = () => { calls += 1; return Promise.resolve(); };
  quiet.win.navigator.sendBeacon = () => { calls += 1; return true; };
  gate.initStoreGate({ appKey: 'no_track', mode: 'entry-gate', portalIds: ['library'] }, quiet.win);
  assert.equal(calls, 0, '未設 trackEndpoint 時唔應該有任何網絡請求');

  // 2) 設咗才回報，用 sendBeacon，payload 只有 appKey/mode/reason/portal/v
  const tracked = makeMockEnv({ referrer: 'https://scout-circulars.vercel.app/' });
  const sent = [];
  tracked.win.navigator.sendBeacon = (url, body) => { sent.push({ url, body }); return true; };
  tracked.win.fetch = () => { throw new Error('唔應該用 fetch'); };
  gate.initStoreGate({
    appKey: 'scoutbook',
    mode: 'entry-gate',
    portalIds: ['appstore', 'library', 'member', 'district'],
    trackEndpoint: '/api/store-hit',
  }, tracked.win);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].url, '/api/store-hit');
  const payload = JSON.parse(sent[0].body);
  assert.deepEqual(Object.keys(payload).sort(), ['appKey', 'mode', 'portal', 'reason', 'v']);
  assert.equal(payload.portal, 'library', '要識別由圖書館引流');
  assert.equal(payload.appKey, 'scoutbook');
  assert.ok(!('referrer' in payload) && !('ua' in payload) && !('ip' in payload), '唔可以送 Referer／UA／IP');

  // 3) 攔截事件同樣要報（睇下有幾多人直開／幾多人撞卡）
  const blocked = makeMockEnv({ referrer: '' });
  const sent2 = [];
  blocked.win.navigator.sendBeacon = (url, body) => { sent2.push(JSON.parse(body)); return true; };
  gate.initStoreGate({ appKey: 'scoutbook', mode: 'entry-gate', trackEndpoint: '/api/store-hit' }, blocked.win);
  assert.equal(sent2[0].reason, 'missing-whitelist-entry');
  assert.equal(sent2[0].portal, '', '直開冇入口身份');

  // 4) sendBeacon 拋錯／無 fetch 都唔可以影響開 App
  const broken = makeMockEnv({ referrer: 'https://scoutappstore.vercel.app/' });
  broken.win.navigator.sendBeacon = () => { throw new Error('boom'); };
  const res = gate.initStoreGate({ appKey: 'safe', mode: 'entry-gate', trackEndpoint: '/api/x' }, broken.win);
  assert.equal(res.allowed, true, '統計壞咗都要照開');
});

test('SG13：支持提示非阻塞、可關、每 N 日最多一次；唔會遮住內容亦唔會阻擋操作', () => {
  const cfg = { url: 'https://scoutappstore.vercel.app/?app=hm20c', days: 30, skipPortalIds: [] };

  // 1) 放行時顯示，只係 complement（唔係 dialog、唔會遮內容）
  const ok = makeMockEnv({ referrer: 'https://scoutappstore.vercel.app/' });
  gate.initStoreGate({ appKey: 'hm20c', mode: 'entry-gate', portalIds: ['appstore'], supportNudge: cfg }, ok.win);
  const nudge = ok.doc.getElementById('scoutSupportNudge');
  assert.ok(nudge, '放行時應該顯示支持提示');
  assert.equal(nudge.getAttribute('role'), 'complementary', '唔可以用 dialog（唔可以當成阻塞）');
  assert.equal(ok.doc.documentElement.getAttribute('data-store-gated'), null, '唔應該遮住底層內容');
  assert.equal(ok.doc.getElementById('scoutStoreGate'), null, '唔應該出閘卡');

  // 2) 有 APP STORE 連結同「唔使喇」
  const link = nudge.children.find((c) => c.tagName === 'A');
  const btn = nudge.children.find((c) => c.tagName === 'BUTTON');
  assert.equal(link.href, cfg.url);
  assert.equal(link.rel, 'noopener');
  assert.ok(btn && btn.onclick, '要有可關閉嘅掣');

  // 3) 撳「唔使喇」→ 記錄時間，之後 N 日內唔再出
  btn.onclick();
  assert.ok(ok.store.get('hm20c.support_nudge_at'), '要記錄已提示時間');
  const again = makeMockEnv({ referrer: 'https://scoutappstore.vercel.app/' });
  again.store.set('hm20c.support_nudge_at', String(Date.now() - 86400000)); // 1 日前
  gate.initStoreGate({ appKey: 'hm20c', mode: 'entry-gate', portalIds: ['appstore'], supportNudge: cfg }, again.win);
  assert.equal(again.doc.getElementById('scoutSupportNudge'), null, '30 日內唔應該再騷擾');

  // 4) 超過 N 日 → 再出一次
  const later = makeMockEnv({ referrer: 'https://scoutappstore.vercel.app/' });
  later.store.set('hm20c.support_nudge_at', String(Date.now() - 31 * 86400000));
  gate.initStoreGate({ appKey: 'hm20c', mode: 'entry-gate', portalIds: ['appstore'], supportNudge: cfg }, later.win);
  assert.ok(later.doc.getElementById('scoutSupportNudge'), '超過 30 日可以再提一次');

  // 5) 被攔截（未經入口）唔應該出支持提示（先講清楚點入嚟）
  const blocked = makeMockEnv({ referrer: '' });
  gate.initStoreGate({ appKey: 'hm20c', mode: 'entry-gate', supportNudge: cfg }, blocked.win);
  assert.equal(blocked.doc.getElementById('scoutSupportNudge'), null);

  // 6) 冇設 supportNudge = 完全冇提示（預設行為不變）
  const none = makeMockEnv({ referrer: 'https://scoutappstore.vercel.app/' });
  gate.initStoreGate({ appKey: 'hm20c', mode: 'entry-gate', portalIds: ['appstore'] }, none.win);
  assert.equal(none.doc.getElementById('scoutSupportNudge'), null);

  // 7) 儲存被封（Safari 私隱）都唔可以 throw
  const blocked2 = makeMockEnv({ referrer: 'https://scoutappstore.vercel.app/', storageThrows: true });
  const r = gate.initStoreGate({ appKey: 'hm20c', mode: 'entry-gate', portalIds: ['appstore'], supportNudge: cfg }, blocked2.win);
  assert.equal(r.allowed, true, '儲存壞咗都要照開');
});

test('SG13：經 APP STORE 正常入嘅已經睇得到 clicks，預設唔再出支持提示（skipPortalIds: [\'appstore\']）', () => {
  const cfg = { url: 'https://scoutappstore.vercel.app/?app=hm20c', days: 30 };

  // 1) 由 APP STORE 入（正常路徑）→ 唔提，因為 clicks 已經計咗
  const viaStore = makeMockEnv({ referrer: 'https://scoutappstore.vercel.app/' });
  gate.initStoreGate({ appKey: 'hm20c', mode: 'entry-gate', portalIds: ['appstore'], supportNudge: cfg }, viaStore.win);
  assert.equal(viaStore.doc.getElementById('scoutSupportNudge'), null, '經 APP STORE 入唔應該再提');

  // 2) 由其他入口入（例如成員系統／圖書館）→ 提一次
  const viaOther = makeMockEnv({ referrer: 'https://member-portal-sigma-swart.vercel.app/' });
  gate.initStoreGate({ appKey: 'hm20c', mode: 'entry-gate', portalIds: ['appstore', 'member'], supportNudge: cfg }, viaOther.win);
  assert.ok(viaOther.doc.getElementById('scoutSupportNudge'), '由非主站入口入要提一次');

  // 3) 由主畫面 PWA 直開（無入口身份）→ 都要提（clicks 計唔到佢）
  const viaPwa = makeMockEnv({ referrer: '', standalone: true });
  gate.initStoreGate({ appKey: 'hm20c', mode: 'entry-gate', portalIds: ['appstore'], supportNudge: cfg }, viaPwa.win);
  assert.ok(viaPwa.doc.getElementById('scoutSupportNudge'), '主畫面直開要提');

  // 4) 自訂 skipPortalIds（例如連 member 都唔提）
  const skipMore = makeMockEnv({ referrer: 'https://member-portal-sigma-swart.vercel.app/' });
  gate.initStoreGate({
    appKey: 'hm20c',
    mode: 'entry-gate',
    portalIds: ['appstore', 'member'],
    supportNudge: { url: cfg.url, days: 30, skipPortalIds: ['appstore', 'member'] },
  }, skipMore.win);
  assert.equal(skipMore.doc.getElementById('scoutSupportNudge'), null, '自訂 skipPortalIds 要生效');
});

test('SG16：GEMINI 係第五個派發入口（Canvas 類），可派發但唔可管閘、唔做放行來源', () => {
  // 1) 註冊表有 gemini，屬 canvas 類（都係入口，只係類型唔同）
  assert.ok(gate.PORTAL_REGISTRY.gemini);
  assert.equal(gate.PORTAL_REGISTRY.gemini.kind, 'canvas');
  assert.equal(gate.PORTAL_REGISTRY.gemini.gateable, false, 'Google 網域管唔到 header');
  assert.equal(gate.PORTAL_REGISTRY.gemini.stats, 'gemini-side', '統計喺 Gemini 自己嗰邊');
  assert.deepEqual([...gate.CANVAS_PORTAL_IDS], ['gemini']);
  assert.deepEqual([...gate.OUTBOUND_PORTAL_IDS], ['appstore', 'library', 'member', 'district']);
  // 兩者合起來＝五個門口，一個都冇少
  assert.equal(gate.PORTAL_IDS.length, 5);

  // 2) 手誤把 gemini 放入 portalIds → 唔會變成放行來源（亦唔會畫成入口掣）
  assert.deepEqual([...gate.portalsFromIds(['gemini', 'appstore'])].map((p) => p.id), ['appstore']);
  assert.deepEqual([...gate.normalizePortals({ portalIds: ['gemini'] })].map((p) => p.id), ['appstore'],
    '只有 gemini 時要 fallback 去 APP STORE');

  // 3) 由 Gemini 嚟嘅 Referer 一律唔放行（跨站、唔係我哋控制嘅入口）
  for (const ref of ['https://gemini.google.com/app', 'https://aistudio.google.com/', 'https://gemini.google.com/']) {
    const { win } = makeMockEnv({ referrer: ref });
    const res = gate.initStoreGate({ appKey: 'gem', mode: 'entry-gate', portalIds: ['gemini', 'appstore'] }, win);
    assert.equal(res.allowed, false, `Gemini 來源 ${ref} 唔應該放行`);
    assert.equal(res.reason, 'missing-whitelist-entry');
  }

  // 4) 要畫「去 Gemini 用 Canvas App」按鈕時，用 includeCanvas（舊名 includeInbound 仍接受）
  const withCanvas = gate.portalsFromIds(['appstore', 'gemini'], {}, { includeCanvas: true });
  assert.deepEqual([...withCanvas].map((p) => p.id), ['appstore', 'gemini']);
  assert.equal(withCanvas[1].origin, 'https://gemini.google.com');
  assert.deepEqual(
    [...gate.portalsFromIds(['appstore', 'gemini'], {}, { includeInbound: true })].map((p) => p.id),
    ['appstore', 'gemini'],
    '舊名要繼續 work',
  );
});

test('SG17：五個入口入場準備度唔同 —— 唔使逐個「打招呼」，程式用 admit 分四級', () => {
  // 1) 每個入口都有 admit 欄，四級分得清
  assert.equal(gate.PORTAL_REGISTRY.appstore.admit, 'always', 'APP STORE 永遠預設入口');
  assert.equal(gate.PORTAL_REGISTRY.library.admit, 'conditional', '圖書館要先改 noreferrer');
  assert.equal(gate.PORTAL_REGISTRY.member.admit, 'optional', '成員系統逐個 App 決定');
  assert.equal(gate.PORTAL_REGISTRY.district.admit, 'optional', '區管理系統逐個 App 決定');
  assert.equal(gate.PORTAL_REGISTRY.gemini.admit, 'never', 'Gemini 永遠唔做放行來源');

  // 2) 由 admit 推導出嚟嘅四組，同註冊表完全對齊
  assert.deepEqual([...gate.DEFAULT_PORTAL_IDS], ['appstore']);
  assert.deepEqual([...gate.CONDITIONAL_PORTAL_IDS], ['library']);
  assert.deepEqual([...gate.OPTIONAL_PORTAL_IDS], ['member', 'district']);
  assert.deepEqual([...gate.NEVER_ADMIT_PORTAL_IDS], ['gemini']);
  // 四組加起來 = 五個入口，一個都冇漏、冇重複
  const all = [
    ...gate.DEFAULT_PORTAL_IDS,
    ...gate.CONDITIONAL_PORTAL_IDS,
    ...gate.OPTIONAL_PORTAL_IDS,
    ...gate.NEVER_ADMIT_PORTAL_IDS,
  ].sort();
  assert.deepEqual(all, [...gate.PORTAL_IDS].sort(), 'admit 分組要覆蓋全部入口');

  // 3) resolvePortalIds：唔寫死 portalIds 時嘅安全預設
  assert.deepEqual([...gate.resolvePortalIds()], ['appstore'], '咩都唔傳 → 只認 APP STORE');
  assert.deepEqual([...gate.resolvePortalIds([], 'all')], ['appstore', 'library', 'member', 'district'],
    "portalIdsAdmit: 'all' → 1–4 全開");
  assert.ok(!gate.resolvePortalIds([], 'all').includes('gemini'), "portalIdsAdmit: 'all' 永遠唔會包 gemini");
  assert.deepEqual([...gate.resolvePortalIds(['library'], 'all')], ['library'], '明寫 portalIds 就照用（唔會被覆蓋）');
  assert.deepEqual([...gate.resolvePortalIds(null, ['member'])], ['member'], 'admit 可以係陣列');

  // 4) 真閘門行為：portalIdsAdmit: 'all' 要放行 1–4 任何一個入口，但唔放行 Gemini
  for (const ref of [
    'https://scoutappstore.vercel.app/',
    'https://scout-circulars.vercel.app/',
    'https://member-portal-sigma-swart.vercel.app/',
    'https://scout-district-portal.vercel.app/',
  ]) {
    const { win } = makeMockEnv({ referrer: ref });
    const res = gate.initStoreGate({ appKey: 'sg17', mode: 'entry-gate', portalIdsAdmit: 'all' }, win);
    assert.equal(res.allowed, true, `${ref} 應該放行`);
    assert.equal(res.reason, 'referrer-whitelist');
  }
  {
    const { win } = makeMockEnv({ referrer: 'https://gemini.google.com/app' });
    const res = gate.initStoreGate({ appKey: 'sg17', mode: 'entry-gate', portalIdsAdmit: 'all' }, win);
    assert.equal(res.allowed, false, "portalIdsAdmit: 'all' 都唔可以放行 Gemini（Canvas 派發線管唔到閘）");
    assert.equal(res.reason, 'missing-whitelist-entry');
  }

  // 5) 卡上嘅入口掣：'all' 出四個，預設只出一個（唔會靜靜地加咗圖書館）
  assert.deepEqual(
    [...gate.normalizePortals({ portalIdsAdmit: 'all' })].map((p) => p.id),
    ['appstore', 'library', 'member', 'district'],
  );
  assert.deepEqual(
    [...gate.normalizePortals({ portalIds: gate.resolvePortalIds() })].map((p) => p.id),
    ['appstore'],
  );
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
  assert.deepEqual([...gate.PORTAL_IDS], ['appstore', 'library', 'member', 'gemini', 'district']);
  assert.deepEqual([...gate.OUTBOUND_PORTAL_IDS], ['appstore', 'library', 'member', 'district']);
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
  // gemini 屬 inbound，唔會出現在 outbound 清單
  assert.ok(!gate.OUTBOUND_PORTAL_IDS.includes('gemini'));
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

  for (const id of ['SG1', 'SG2', 'SG3', 'SG4', 'SG5', 'SG6', 'SG7', 'SG8', 'SG9', 'SG10', 'SG11', 'SG12', 'SG13', 'SG14', 'SG15', 'SG16', 'SG17']) {
    assert.ok(pb.includes(id) && doc.includes(id), `PLAYBOOK / docs/50 缺 ${id}`);
  }
  assert.ok(intake.includes('Q8') && intake.includes('entry-gate'), 'INTAKE 第 0 步要有 Q8 主動告知白名單與 entry-gate');
  assert.ok(cl.includes('SG1'), 'docs/10-checklists.md 要有 SG1');
  assert.ok(rd.includes('docs/50-app-store-whitelist-and-shutdown.md'), '根 README 要有導覽');
  assert.ok(dix.includes('50-app-store-whitelist-and-shutdown.md'), 'docs/README 要有索引');
  assert.match(wf, /store_gate\.test\.mjs/, 'guard.yml 要跑 store_gate.test.mjs');
  assert.match(doc, /041f0742dbabeffa3405b5c0b208f4935f1a215c/, 'docs/50 要有 website pinned commit 實查連結');
  // 四大官方入口註冊表要同 PORTAL_REGISTRY 完全對齊（同一份真理）
  for (const id of ['appstore', 'library', 'member', 'district']) {
    const p = gate.getPortal(id);
    assert.ok(doc.includes(p.origin), `docs/50 §0.1 缺 ${id} Origin（${p.origin}）`);
    assert.equal(gate.parseAllowedOrigin(p.url), p.origin, `${id} origin 要同 url 對齊`);
    assert.ok(doc.includes(p.repo), `docs/50 §0.1 缺 ${id} repo（${p.repo}）`);
  }
  for (const kw of ['1. APP STORE', '2. 圖書館', '3. 成員系統', '4. 區管理系統']) {
    assert.ok(doc.includes(kw), `docs/50 要明寫四大入口「${kw}」`);
  }
  assert.ok(doc.includes('PORTAL_REGISTRY') && doc.includes('portalIds'), 'docs/50 要寫明 PORTAL_REGISTRY／portalIds 用法');
  // SG16：Gemini 屬 inbound，docs 要講清楚兩個方向
  assert.ok(doc.includes('canvas') && doc.includes('outbound'), 'docs/50 要分清兩條派發線（outbound／canvas）');
  assert.ok(/Canvas 派發線/.test(doc), 'docs/50 要寫明 Gemini 屬 Canvas 派發線');
  assert.ok(doc.includes('gemini.google.com'), 'docs/50 要登記 Gemini origin');
  assert.ok(!/portalIds: \['gemini'/.test(doc), 'docs/50 唔應該示範把 gemini 放入 portalIds');
  // SG7：直開網址／404／加入主畫面 嘅情境表要喺 docs/50 §3.4 有紀錄
  for (const kw of ['3.4', '404', '加入主畫面', '白名單真實代價', '3.6', 'push_subscriptions', '3.7', 'Delist', 'visible=false', '3.8', 'drawtheroute', 'LEADER_PASSWORD', 'supportNudge', 'SG13', 'SG14', '書架位置有限', 'skipPortalIds', '3.10', 'SG17', 'DEFAULT_PORTAL_IDS', 'admit', 'noreferrer', 'gemini-woad-sigma']) {
    assert.ok(doc.includes(kw), `docs/50 §3.4 要覆蓋「${kw}」`);
  }
  assert.ok(intake.includes('SG7'), 'INTAKE Q8 要提 SG7 加入主畫面流程');
  assert.ok(pb.includes('PORTAL_REGISTRY') || pb.includes('portalIds'), 'PLAYBOOK 要提註冊表／portalIds');
  // SG15：逐個 App 交接清單要存在且可貼去該 App 對話
  const handoff = read('templates', 'repo-starter', 'WHITELIST-HANDOFF.md');
  for (const kw of ['portalIds', 'allowStandalone', 'supportNudge', '真機', '本機資料']) {
    assert.ok(handoff.includes(kw), `WHITELIST-HANDOFF 要覆蓋「${kw}」`);
  }
  assert.ok(doc.includes('WHITELIST-HANDOFF.md'), 'docs/50 要指向交接清單');
  // docs/51 白名單上線清單
  const list = read('docs', '51-whitelist-rollout-list.md');
  for (const kw of ['A 組', 'B 組', 'C 組', 'D 組', '掃描限制', 'entry-gate', 'SG17', 'DEFAULT_PORTAL_IDS', 'L5662']) {
    assert.ok(list.includes(kw), `docs/51 要覆蓋「${kw}」`);
  }
  assert.ok(list.includes('website') && list.includes('scout-circulars'), 'D 組要列出入口本體');
  // A 組可直接貼嘅指令檔
  const instr = read('templates', 'repo-starter', 'A-GROUP-INSTRUCTION.md');
  for (const kw of ['portalIds', 'allowStandalone', 'entry-gate', '真機', '回報', 'APPKEY', 'SG17', 'DEFAULT_PORTAL_IDS']) {
    assert.ok(instr.includes(kw), `A-GROUP-INSTRUCTION 要覆蓋「${kw}」`);
  }
  assert.ok(list.includes('A-GROUP-INSTRUCTION.md'), 'docs/51 要指向 A 組指令檔');
  assert.ok(rd.includes('51-whitelist-rollout-list.md'), '根 README 要指向 docs/51');
});
