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

test('SG16：GEMINI 係第五個入口，屬我哋自己托管嘅 Vercel app（private repo）→ 可以正常放行', () => {
  // 1) 註冊表：同 1–4 一樣屬 outbound（可管閘），唔再當佢係 Google Canvas
  assert.ok(gate.PORTAL_REGISTRY.gemini);
  assert.equal(gate.PORTAL_REGISTRY.gemini.kind, 'outbound', 'GEMINI 係我哋自己部署，同 1–4 一樣');
  assert.equal(gate.PORTAL_REGISTRY.gemini.gateable, true, '自己 repo／自己部署 → header 改得到');
  assert.equal(gate.PORTAL_REGISTRY.gemini.origin, 'https://gemini-woad-sigma.vercel.app');
  assert.equal(gate.PORTAL_REGISTRY.gemini.repoVisibility, 'private', 'private repo：agent 可能讀唔到原始碼');
  assert.equal(gate.PORTAL_REGISTRY.gemini.admit, 'optional', 'SG17：可以加，但預設唔加');
  // 冇任何入口再屬 canvas 線；五個入口全部可放行
  assert.deepEqual([...gate.CANVAS_PORTAL_IDS], [], 'canvas 線已取消（唔好再有入口被排除）');
  assert.deepEqual([...gate.OUTBOUND_PORTAL_IDS], ['appstore', 'library', 'member', 'district', 'gemini']);
  assert.equal(gate.PORTAL_IDS.length, 5);

  // 2) portalsFromIds 唔再靜靜剔除 gemini
  assert.deepEqual([...gate.portalsFromIds(['gemini', 'appstore'])].map((p) => p.id), ['appstore', 'gemini']);
  assert.deepEqual([...gate.normalizePortals({ portalIds: ['gemini'] })].map((p) => p.id), ['gemini'],
    '只有 gemini 時就係 gemini（唔會 fallback 去 APP STORE）');

  // 3) 由 GEMINI 嚟嘅 Referer 要放行（佢係自家入口，可以放行）
  {
    const { win } = makeMockEnv({ referrer: 'https://gemini-woad-sigma.vercel.app/' });
    const res = gate.initStoreGate({ appKey: 'gem', mode: 'entry-gate', portalIds: ['gemini', 'appstore'] }, win);
    assert.equal(res.allowed, true, 'GEMINI 係自家入口，應該放行');
    assert.equal(res.reason, 'referrer-whitelist');
    assert.equal(res.matchedPortalId, 'gemini');
  }
  // 4) 真 Google Gemini 網域**唔**會放行（唔可以混淆兩樣嘢）
  for (const ref of ['https://gemini.google.com/app', 'https://aistudio.google.com/']) {
    const { win } = makeMockEnv({ referrer: ref });
    const res = gate.initStoreGate({ appKey: 'gem', mode: 'entry-gate', portalIds: ['gemini', 'appstore'] }, win);
    assert.equal(res.allowed, false, `Google 網域 ${ref} 唔屬於我哋任何入口`);
    assert.equal(res.reason, 'missing-whitelist-entry');
  }
  // 5) 舊 option 名仍然收貨（唔會 throw、亦唔會再過濾）
  assert.deepEqual(
    [...gate.portalsFromIds(['appstore', 'gemini'], {}, { includeCanvas: true })].map((p) => p.id),
    ['appstore', 'gemini'],
  );
});

test('SG17：五個入口入場準備度唔同 —— 唔使逐個「打招呼」，程式用 admit 分四級', () => {
  // 1) 每個入口都有 admit 欄，四級分得清
  assert.equal(gate.PORTAL_REGISTRY.appstore.admit, 'always', 'APP STORE 永遠預設入口');
  assert.equal(gate.PORTAL_REGISTRY.library.admit, 'conditional', '圖書館要先改 noreferrer');
  assert.equal(gate.PORTAL_REGISTRY.member.admit, 'optional', '成員系統逐個 App 決定');
  assert.equal(gate.PORTAL_REGISTRY.district.admit, 'optional', '區管理系統逐個 App 決定');
  assert.equal(gate.PORTAL_REGISTRY.gemini.admit, 'optional', 'GEMINI 可以加（自家 Vercel app）');

  // 2) 由 admit 推導出嚟嘅四組，同註冊表完全對齊
  assert.deepEqual([...gate.DEFAULT_PORTAL_IDS], ['appstore']);
  assert.deepEqual([...gate.CONDITIONAL_PORTAL_IDS], ['library']);
  assert.deepEqual([...gate.OPTIONAL_PORTAL_IDS], ['member', 'district', 'gemini'], '按 order：member／district／GEMINI');
  assert.deepEqual([...gate.NEVER_ADMIT_PORTAL_IDS], [], '冇入口再屬「永遠唔准入」');
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
  assert.deepEqual([...gate.resolvePortalIds([], 'all')], ['appstore', 'library', 'member', 'district', 'gemini'],
    "portalIdsAdmit: 'all' → 五個入口全開（順序跟 PORTAL_REGISTRY）");
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
    const { win } = makeMockEnv({ referrer: 'https://gemini-woad-sigma.vercel.app/' });
    const res = gate.initStoreGate({ appKey: 'sg17', mode: 'entry-gate', portalIdsAdmit: 'all' }, win);
    assert.equal(res.allowed, true, "portalIdsAdmit: 'all' 亦要放行 GEMINI（自家 Vercel app）");
    assert.equal(res.matchedPortalId, 'gemini');
  }

  // 5) 卡上嘅入口掣：'all' 出四個，預設只出一個（唔會靜靜地加咗圖書館）
  assert.deepEqual(
    [...gate.normalizePortals({ portalIdsAdmit: 'all' })].map((p) => p.id),
    ['appstore', 'library', 'member', 'district', 'gemini'],
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
  assert.deepEqual([...gate.PORTAL_IDS], ['appstore', 'library', 'member', 'district', 'gemini']);
  assert.deepEqual([...gate.OUTBOUND_PORTAL_IDS], ['appstore', 'library', 'member', 'district', 'gemini']);
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
  // GEMINI 係自家 private repo 部署嘅 Vercel app → 屬 outbound，可放行（2026-11-15 修正）
  assert.ok(gate.OUTBOUND_PORTAL_IDS.includes('gemini'));
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

  for (const id of ['SG1', 'SG2', 'SG3', 'SG4', 'SG5', 'SG6', 'SG7', 'SG8', 'SG9', 'SG10', 'SG11', 'SG12', 'SG13', 'SG14', 'SG15', 'SG16', 'SG17', 'SG18', 'SG19']) {
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
  assert.ok(doc.includes('gemini-woad-sigma.vercel.app'), 'docs/50 要登記 GEMINI 正確 origin');
  // 唔可以再把 GEMINI 當 Google 網域做入口（只可以喺「兩者要分清楚」對照表出現）
  assert.ok(!/gemini\.google\.com/.test(gate.PORTAL_REGISTRY.gemini.origin), 'registry 唔可以指 Google 網域');
  assert.ok(doc.includes('Google 嘅 Gemini'), 'docs/50 要明寫 GEMINI 唔係 Google Gemini');
  assert.ok(/private repo/.test(doc), 'docs/50 要寫明 GEMINI 係 private repo');
  assert.ok(doc.includes('403'), 'docs/50 要寫明 private repo 會回 403（讀唔到 ≠ 唔存在）');
  // SG7：直開網址／404／加入主畫面 嘅情境表要喺 docs/50 §3.4 有紀錄
  for (const kw of ['3.4', '404', '加入主畫面', '白名單真實代價', '3.6', 'push_subscriptions', '3.7', 'Delist', 'visible=false', '3.8', 'drawtheroute', 'LEADER_PASSWORD', 'supportNudge', 'SG13', 'SG14', '書架位置有限', 'skipPortalIds', '3.10', 'SG17', 'DEFAULT_PORTAL_IDS', 'admit', 'noreferrer', 'gemini-woad-sigma', 'private repo']) {
    assert.ok(doc.includes(kw), `docs/50 §3.4 要覆蓋「${kw}」`);
  }
  assert.ok(intake.includes('SG7'), 'INTAKE Q8 要提 SG7 加入主畫面流程');
  assert.ok(pb.includes('PORTAL_REGISTRY') || pb.includes('portalIds'), 'PLAYBOOK 要提註冊表／portalIds');
  // SG15：逐個 App 交接清單要存在且可貼去該 App 對話
  const handoff = read('templates', 'repo-starter', 'WHITELIST-HANDOFF.md');
  for (const kw of ['portalIds', 'silentPortalIds', 'allowStandalone', 'supportNudge', '真機', '本機資料',
                    'SG18', 'SG19', 'getAppStoreUrl', 'SLUG', '20261116-app-slug-seed.sql',
                    'bump_hearts', '發佈根目錄', '本機模擬', '真機實測']) {
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
  for (const kw of ['portalIds', 'silentPortalIds', 'allowStandalone', 'entry-gate', '真機', '回報',
                    'APPKEY', 'SLUG', 'SG17', 'SG18', 'SG19', 'getAppStoreUrl',
                    '20261116-app-slug-seed.sql', '發佈根目錄', '本機模擬', '真機實測']) {
    assert.ok(instr.includes(kw), `A-GROUP-INSTRUCTION 要覆蓋「${kw}」`);
  }
  assert.ok(list.includes('A-GROUP-INSTRUCTION.md'), 'docs/51 要指向 A 組指令檔');
  // APP STORE 第 0 步指令（SG9-a）：要存在、要指對實查位置、要講明唔准做乜
  const appInstr = read('templates', 'repo-starter', 'APP-STORE-INSTRUCTION.md');
  for (const kw of [
    '?app=', 'appDeepLink', 'slug', 'app.js', 'index.html', 'QR', '回報',
    'openApp()', 'start_url', 'bump_clicks', 'noreferrer', '真機',
  ]) {
    assert.ok(appInstr.includes(kw), `APP-STORE-INSTRUCTION 要覆蓋「${kw}」`);
  }
  for (const kw of ['L723', 'L727', 'L739', 'L2319', 'L2283', 'L52', 'L120']) {
    assert.ok(appInstr.includes(kw), `APP-STORE-INSTRUCTION 要列出實查行號「${kw}」`);
  }
  assert.ok(list.includes('APP-STORE-INSTRUCTION.md'), 'docs/51 要指向 APP STORE 第 0 步指令');
  assert.ok(read('templates', 'README.md').includes('APP-STORE-INSTRUCTION.md'), 'templates/README 要登記 APP STORE 指令');

  assert.ok(rd.includes('51-whitelist-rollout-list.md'), '根 README 要指向 docs/51');
});

/* ────────────────────────────────────────────────────────────────
 * SG19（2026-11-17 定案）：攔截卡按鈕 與 靜默放行入口 分離
 * 子 App 預設同時放行 appstore + library，但攔截卡只出 APP STORE 一粒掣。
 * ──────────────────────────────────────────────────────────────── */

test('SG19：silentPortalIds 照放行（matchedPortalId 正常）但唔畫成攔截卡按鈕', () => {
  // 由圖書館入 → 放行，而且認得出係 library（SG10 統計靠呢個）
  const fromLib = makeMockEnv({ referrer: 'https://scout-circulars.vercel.app/' });
  const r = gate.initStoreGate({
    appKey: 'silent1',
    mode: 'entry-gate',
    portalIds: ['appstore'],
    silentPortalIds: ['library'],
  }, fromLib.win);
  assert.equal(r.allowed, true, '沉默入口一樣要放行，否則圖書館引流會被擋');
  assert.equal(r.matchedPortalId, 'library', 'matchedPortalId 要認得出 library（唔可以變空）');

  // 由 APP STORE 入 → 照舊放行
  const fromStore = makeMockEnv({ referrer: 'https://scoutappstore.vercel.app/' });
  const r2 = gate.initStoreGate({
    appKey: 'silent2',
    mode: 'entry-gate',
    portalIds: ['appstore'],
    silentPortalIds: ['library'],
  }, fromStore.win);
  assert.equal(r2.allowed, true);
  assert.equal(r2.matchedPortalId, 'appstore');

  // 直打網址 → 攔截，而且**只**畫一粒掣（APP STORE）
  const direct = makeMockEnv({ referrer: '' });
  gate.initStoreGate({
    appKey: 'silent3',
    mode: 'entry-gate',
    portalIds: ['appstore'],
    silentPortalIds: ['library'],
  }, direct.win);
  const dialog = direct.doc.getElementById('scoutStoreGate');
  assert.ok(dialog, '直打網址要出攔截卡');
  const actions = dialog.children.find((c) => c.className === 'sg-actions');
  assert.equal(actions.children.length, 1, '沉默 library 之後只應剩 APP STORE 一粒掣');
  assert.equal(actions.children[0].href, 'https://scoutappstore.vercel.app/');
  // 單一粒掣 → 去掉「1. 」編號前綴
  assert.equal(actions.children[0].textContent, '前往 APP STORE', '單一粒掣唔應該有編號');
});

test('SG19：portalIds 同時列出 appstore+library 再用 silentPortalIds 沉默 library，效果一致', () => {
  const options = { mode: 'entry-gate', portalIds: ['appstore', 'library'], silentPortalIds: ['library'] };
  const fromLib = makeMockEnv({ referrer: 'https://scout-circulars.vercel.app/' });
  const r = gate.initStoreGate({ ...options, appKey: 'silentA' }, fromLib.win);
  assert.equal(r.allowed, true);
  assert.equal(r.matchedPortalId, 'library');

  const direct = makeMockEnv({ referrer: '' });
  gate.initStoreGate({ ...options, appKey: 'silentB' }, direct.win);
  const actions = direct.doc.getElementById('scoutStoreGate').children.find((c) => c.className === 'sg-actions');
  assert.equal(actions.children.length, 1);
  assert.equal(actions.children[0].href, 'https://scoutappstore.vercel.app/');
});

test('SG19：allowedOrigins 唔再蓋過 portals（舊寫法會令 matchedPortalId 變空）', () => {
  // 呢個就係 Aircraft-Encyclopedia 之前嘅寫法：portalIds 只寫 appstore，
  // 但 allowedOrigins 用 portalsFromIds(['appstore','library']) 展開。
  const allowedOrigins = gate.portalsFromIds(['appstore', 'library']).map((p) => p.origin);
  const fromLib = makeMockEnv({ referrer: 'https://scout-circulars.vercel.app/' });
  const r = gate.initStoreGate({
    appKey: 'union1',
    mode: 'entry-gate',
    portalIds: ['appstore'],
    allowedOrigins,
  }, fromLib.win);
  assert.equal(r.allowed, true, 'allowedOrigins 有 library → 要放行');
  assert.equal(r.matchedPortalId, 'library', '而且 matchedPortalId 唔可以係空（SG10 統計要靠佢認入口）');

  // 反方向：portals 有 library、allowedOrigins 只有 appstore → library 仍然要放行（聯集，唔係取代）
  const fromLib2 = makeMockEnv({ referrer: 'https://scout-circulars.vercel.app/' });
  const r2 = gate.initStoreGate({
    appKey: 'union2',
    mode: 'entry-gate',
    portalIds: ['appstore', 'library'],
    allowedOrigins: ['https://scoutappstore.vercel.app'],
  }, fromLib2.win);
  assert.equal(r2.allowed, true, 'portals 嘅入口唔可以被 allowedOrigins 蓋走');
  assert.equal(r2.matchedPortalId, 'library');
});

test('SG19：多過一粒掣時保留編號前綴（portalIds 同時畫 appstore+library）', () => {
  const direct = makeMockEnv({ referrer: '' });
  gate.initStoreGate({
    appKey: 'num1',
    mode: 'entry-gate',
    portalIds: ['appstore', 'library'],
  }, direct.win);
  const actions = direct.doc.getElementById('scoutStoreGate').children.find((c) => c.className === 'sg-actions');
  assert.equal(actions.children.length, 2);
  assert.equal(actions.children[0].textContent, '1. 前往 APP STORE', '多於一粒掣時編號要保留');
  assert.equal(actions.children[1].textContent, '2. 前往圖書館');
});

test('SG19：預設文案係簡短人話（零技術術語），舊字串保留做 alias 唔可以被刪', () => {
  const direct = makeMockEnv({ referrer: '' });
  gate.initStoreGate({
    appKey: 'copy1',
    mode: 'entry-gate',
    portalIds: ['appstore'],
    silentPortalIds: ['library'],
  }, direct.win);
  const dialog = direct.doc.getElementById('scoutStoreGate');
  const h1 = dialog.children.find((c) => c.tagName === 'H1');
  const p = dialog.children.find((c) => c.tagName === 'P');
  assert.equal(h1.textContent, '需經由 SCOUT APP STORE 開啟');
  assert.equal(p.textContent, '請按下方按鈕前往 APP STORE 開啟。');
  assert.ok(!/白名單/.test(h1.textContent + p.textContent), '預設文案唔准再講「白名單」');
  assert.ok(!/統一入口及版本管理/.test(h1.textContent + p.textContent), '預設文案唔准再講技術理由');

  // 舊字串要仍然存在（alias，向下相容 + 想講清楚嘅 App 仍然可以用）
  const src = read('templates', 'vercel', 'store_gate_v1.0.js');
  assert.ok(src.includes("whitelistBodySingle: '為統一入口及版本管理"), '舊 whitelistBodySingle 要保留做 alias');
  assert.ok(src.includes("whitelistTitleSingle: '此程式需經 SCOUT APP STORE 開啟'"), '舊 whitelistTitleSingle 要保留');

  // customTitle／customMessage 依然優先（Aircraft 舊寫法唔會壞）
  const custom = makeMockEnv({ referrer: '' });
  gate.initStoreGate({
    appKey: 'copy2',
    mode: 'entry-gate',
    portalIds: ['appstore'],
    customTitle: '自訂標題',
    customMessage: '自訂內文',
  }, custom.win);
  const d2 = custom.doc.getElementById('scoutStoreGate');
  assert.equal(d2.children.find((c) => c.tagName === 'H1').textContent, '自訂標題');
  assert.equal(d2.children.find((c) => c.tagName === 'P').textContent, '自訂內文');
});

test('SG19：COPY.en 補齊 support* 三個字串（否則英文模式會出 undefined）', () => {
  const src = read('templates', 'vercel', 'store_gate_v1.0.js');
  // 由 COPY 定義抽出 en 區塊，逐個 key 驗
  const enBlock = src.slice(src.indexOf('  en: {'), src.indexOf('};\n\n/** 嚴格解析 Origin'));
  for (const key of ['supportText', 'supportCta', 'supportDismiss']) {
    assert.ok(enBlock.includes(`${key}:`), `COPY.en 要補回 ${key}`);
  }
  assert.ok(enBlock.includes('whitelistTitleShort:'), 'COPY.en 要有簡短版標題');
  assert.ok(enBlock.includes('whitelistBodyShort:'), 'COPY.en 要有簡短版內文');
});

/* ────────────────────────────────────────────────────────────────
 * SG18（2026-11-17 定案）：子 App 一鍵回跳主站詳情卡
 * ──────────────────────────────────────────────────────────────── */

test('SG18：getAppStoreUrl(slug) 組出主站深層連結，未傳 slug 回主站首頁', () => {
  assert.equal(typeof gate.getAppStoreUrl, 'function', '要 export getAppStoreUrl');
  assert.equal(
    gate.getAppStoreUrl('aircraft-encyclopedia'),
    'https://scoutappstore.vercel.app/?app=aircraft-encyclopedia',
  );
  assert.equal(gate.getAppStoreUrl(''), 'https://scoutappstore.vercel.app/');
  assert.equal(gate.getAppStoreUrl(null), 'https://scoutappstore.vercel.app/');
  assert.equal(gate.getAppStoreUrl(undefined), 'https://scoutappstore.vercel.app/');
  // 特殊字元要 encode，唔准直接串落 query
  assert.equal(
    gate.getAppStoreUrl('a b&c=d'),
    'https://scoutappstore.vercel.app/?app=a%20b%26c%3Dd',
  );
  // 唔准出 `//?app=`
  assert.ok(!gate.getAppStoreUrl('x').includes('//?app='), '唔可以出雙斜線（registry url 尾斜線要處理）');
  // 前後空白要 trim
  assert.equal(
    gate.getAppStoreUrl('  icon-maker  '),
    'https://scoutappstore.vercel.app/?app=icon-maker',
  );
});

test('SG18：getAppStoreUrl 掛齊瀏覽器 globalThis 同 CommonJS 兩邊', () => {
  const src = read('templates', 'vercel', 'store_gate_v1.0.js');
  const gStart = src.indexOf('globalThis.ScoutStoreGate = {');
  const gBlock = src.slice(gStart, src.indexOf('};', gStart));
  assert.ok(gBlock.includes('getAppStoreUrl'), 'globalThis.ScoutStoreGate 要有 getAppStoreUrl');
  assert.ok(gBlock.includes('getPortal'), '向下相容：getPortal 要保留（Aircraft 現時用呢條）');
  const mStart = src.indexOf('module.exports = {');
  const mBlock = src.slice(mStart, src.indexOf('};', mStart));
  assert.ok(mBlock.includes('getAppStoreUrl'), 'module.exports 要有 getAppStoreUrl');
});
