/**
 * store_gate_v1.0.js — 關站與指定入口（SCOUT APP STORE／通告圖書館）白名單閘門（SG1–SG6 / docs/50-app-store-whitelist-and-shutdown.md）
 * © SCOUT SYSTEM · COPYRIGHT SCOUT SYSTEM
 *
 * 用法（放喺 index.html 嘅 <head> 最頂，零依賴；支援單一或多個指定入口）：
 *   <script src="/store_gate_v1.0.js"></script>
 *   <script>
 *     initStoreGate({
 *       appKey: 'myapp',
 *       mode: 'entry-gate', // 'open' | 'entry-gate' | 'iframe-only' | 'closed'
 *       // ① 用官方四大入口註冊表（建議）：只寫 id，網址／標籤／順序由真理倉統一維護
 *       portalIds: ['appstore', 'library', 'member', 'district'],
 *       // ② 或自訂入口（例如臨時活動頁、旅團門戶）
 *       portals: [
 *         { labelZh: '前往 SCOUT APP STORE', labelEn: 'Go to SCOUT APP STORE', url: 'https://scoutappstore.vercel.app/' },
 *         { labelZh: '前往通告圖書館', labelEn: 'Go to Notice Library', url: 'https://scout-circulars.vercel.app/' },
 *       ],
 *       allowStandalone: true,
 *     });
 *   </script>
 *
 * 官方四大入口（PORTAL_REGISTRY，2026-11-15 用戶定案；詳情 docs/50 §0.1）：
 *   1. appstore  1. APP STORE     https://scoutappstore.vercel.app/        （playerkousas-rgb/website）
 *   2. library   2. 圖書館         https://scout-circulars.vercel.app/      （playerkousas-rgb/scout-circulars）
 *   3. member    3. 成員系統       https://member-portal-sigma-swart.vercel.app/（playerkousas-rgb/member-portal）
 *   4. district  4. 區管理系統     https://scout-district-portal.vercel.app/（playerkousas-rgb/scout-district-portal）
 *   ⚠️ 註冊表只係「邊個入口有資格放行」，唔等於全部入口都改好：library／member／district 現時連結帶
 *      rel="noopener noreferrer"（會清空 Referer），要先改 rel="noopener" 先放行得到（docs/50 §4.4）。
 *
 * 四種模式：
 *   - 'open'        ：公開直連（預設，唔攔截）
 *   - 'entry-gate'  ：頂層跳板白名單（專治唔適合 <iframe> 嘅 App：保留 Safari localStorage、
 *                     SameSite=Lax Cookie、PWA 加入主畫面、Web Push；驗 Referer origin 是否屬任一指定入口 +
 *                     sessionStorage 同分頁通行證 + 可選放行已裝主畫面 standalone PWA）
 *   - 'iframe-only' ：純 <iframe> 白名單（配合 vercel.iframe-whitelist.json 嘅 CSP frame-ancestors；
 *                     直打網址時清晰告知用家有白名單並引導前往指定入口）
 *   - 'closed'      ：軟關站／維護告示（告知用家網站暫時關閉並引導返回指定入口）
 *   - 其他未知值    ：F4 fail closed，一律當攔截處理，唔會因串錯字而誤開
 *
 * 誠實限制（docs/47）：
 *   此檔屬前端入口提示與防誤傳閘門，擋一般用家直開舊書籤／轉發連結；
 *   防唔到 DevTools 改 sessionStorage 或 curl 偽造 Referer。敏感資料／收費 API 須配後端驗票（SG5 嚴格級）。
 */

const VERSION = 'v1.0';

const DEFAULT_STORE_URL = 'https://scoutappstore.vercel.app/';
const DEFAULT_LIBRARY_URL = 'https://scout-circulars.vercel.app/';
const DEFAULT_ALLOWED_ORIGINS = ['https://scoutappstore.vercel.app'];

/**
 * PORTAL_REGISTRY — 官方四大準入白名單入口（真理倉 docs/50 §0.1 唯一來源）
 * 2026-11-15 用戶定案：1. APP STORE · 2. 圖書館 · 3. 成員系統 · 4. 區管理系統
 * 子 App 用 portalIds: ['appstore','library','member','district']（可只揀子集）即可；
 * 改網址／改排序只改呢個表，唔使逐個 App 改 index.html。
 */
const PORTAL_REGISTRY = Object.freeze({
  appstore: Object.freeze({
    id: 'appstore',
    order: 1,
    labelZh: '1. 前往 APP STORE',
    labelEn: '1. Go to APP STORE',
    nameZh: 'APP STORE',
    url: 'https://scoutappstore.vercel.app/',
    origin: 'https://scoutappstore.vercel.app',
    repo: 'playerkousas-rgb/website',
  }),
  library: Object.freeze({
    id: 'library',
    order: 2,
    labelZh: '2. 前往圖書館',
    labelEn: '2. Go to Library',
    nameZh: '圖書館',
    url: 'https://scout-circulars.vercel.app/',
    origin: 'https://scout-circulars.vercel.app',
    repo: 'playerkousas-rgb/scout-circulars',
  }),
  member: Object.freeze({
    id: 'member',
    order: 3,
    labelZh: '3. 前往成員系統',
    labelEn: '3. Go to Member Portal',
    nameZh: '成員系統',
    url: 'https://member-portal-sigma-swart.vercel.app/',
    origin: 'https://member-portal-sigma-swart.vercel.app',
    repo: 'playerkousas-rgb/member-portal',
  }),
  district: Object.freeze({
    id: 'district',
    order: 4,
    labelZh: '4. 前往區管理系統',
    labelEn: '4. Go to District Portal',
    nameZh: '區管理系統',
    url: 'https://scout-district-portal.vercel.app/',
    origin: 'https://scout-district-portal.vercel.app',
    repo: 'playerkousas-rgb/scout-district-portal',
  }),
});

/** 官方入口順序：1 APP STORE → 2 圖書館 → 3 成員系統 → 4 區管理系統 */
const PORTAL_IDS = Object.freeze(Object.keys(PORTAL_REGISTRY));

/** 由 registry id 取入口資料；唔識嘅 id 回 null（由呼叫方 fail-safe 過濾） */
function getPortal(id, overrides = {}) {
  const hit = PORTAL_REGISTRY[String(id || '').trim().toLowerCase()];
  if (!hit) return null;
  return { ...hit, ...(overrides || {}) };
}

/** 由 portalIds: ['appstore','library'] 展開成完整入口物件清單（未知 id 靜靜略過） */
function portalsFromIds(ids, labelMap = {}) {
  if (!Array.isArray(ids)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of ids) {
    const hit = getPortal(raw);
    if (!hit || seen.has(hit.id)) continue;
    seen.add(hit.id);
    const ov = labelMap[hit.id] || {};
    out.push({
      ...hit,
      origin: hit.origin || parseAllowedOrigin(hit.url) || DEFAULT_ALLOWED_ORIGINS[0],
      labelZh: ov.labelZh || hit.labelZh,
      labelEn: ov.labelEn || hit.labelEn,
    });
  }
  return out.sort((a, b) => a.order - b.order);
}

const COPY = {
  zh: {
    whitelistBadge: '白名單保護 · 指定入口限定',
    whitelistTitleSingle: '此程式需經 SCOUT APP STORE 開啟',
    whitelistTitleMulti: '此程式需經指定入口網站開啟',
    whitelistBodySingle: '為統一入口及版本管理，本程式已啟用白名單限制，不支援直接開啟獨立網址。請由 SCOUT APP STORE 進入。',
    whitelistBodyMulti: '為統一入口及版本管理，本程式已啟用白名單限制，不支援直接開啟獨立網址。請由以下任一指定入口進入：',
    iframeBody: '本工具僅供嵌入白名單網站內使用，不支援直接開啟獨立網址。請前往指定主站開啟。',
    closedBadge: '暫停開放 · 系統維護',
    closedTitle: '此網站目前暫時關閉',
    closedBody: '本程式現正暫停開放或進行維護。請前往以下入口查看其他可用工具或最新通告。',
    cta: '前往 SCOUT APP STORE',
    countdownPrefix: '將於 ',
    countdownSuffix: ' 秒後自動前往主站…',
    installHint: '想「加入主畫面」用 App 模式開啟？請先由上述入口進入本程式，再用瀏覽器選單「加入主畫面」（直接開網址安裝會得到打不開的圖示）。',
  },
  en: {
    whitelistBadge: 'Whitelist Only · Designated Portals',
    whitelistTitleSingle: 'Please open this app via SCOUT APP STORE',
    whitelistTitleMulti: 'Please open this app via a designated portal',
    whitelistBodySingle: 'Direct URL access is disabled. This app is protected by an entry whitelist and must be launched from SCOUT APP STORE.',
    whitelistBodyMulti: 'Direct URL access is disabled. Please launch this app from one of the designated portals below:',
    iframeBody: 'This tool can only be opened inside a whitelisted portal view, not via a standalone URL.',
    closedBadge: 'Temporarily Closed · Maintenance',
    closedTitle: 'This site is temporarily closed',
    closedBody: 'This app is currently paused or under maintenance. Please visit a portal below for available tools and updates.',
    cta: 'Go to SCOUT APP STORE',
    countdownPrefix: 'Redirecting to portal in ',
    countdownSuffix: 's…',
    installHint: 'To install this as a Home Screen app, open it from one of the portals above first, then use your browser\u2019s "Add to Home Screen". Installing straight from the raw URL creates an icon that cannot open.',
  },
};

/** 嚴格解析 Origin（F5/A9）：防 https://scoutappstore.vercel.app.evil.com 前綴偽造 */
function parseAllowedOrigin(rawUrl, allowLocalhost = false) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const u = new URL(rawUrl);
    if (u.protocol === 'https:') return u.origin;
    if (allowLocalhost && u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
      return u.origin;
    }
    return null;
  } catch {
    return null;
  }
}

/** 正規化指定入口清單：自訂 portals 優先，其次官方 portalIds（四大入口註冊表），最後 storeUrl 單一入口 */
function normalizePortals(options = {}) {
  const allowLocalhost = Boolean(options.allowLocalhost);
  const toEntry = (item) => {
    if (!item || typeof item !== 'object') return null;
    const origin = parseAllowedOrigin(item.url, allowLocalhost);
    if (!origin) return null;
    return {
      id: item.id ? String(item.id) : '',
      url: item.url,
      origin,
      labelZh: String(item.labelZh || item.label || COPY.zh.cta),
      labelEn: String(item.labelEn || item.label || COPY.en.cta),
    };
  };
  const merged = [];
  const seenOrigin = new Set();
  const pushAll = (list) => {
    for (const entry of list) {
      if (!entry || seenOrigin.has(entry.origin)) continue;
      seenOrigin.add(entry.origin);
      merged.push(entry);
    }
  };
  // 自訂 portals 同官方 portalIds 可以並存：以 Origin 去重，先列自訂、再接官方未重複嘅入口
  if (Array.isArray(options.portals) && options.portals.length > 0) {
    pushAll(options.portals.map(toEntry).filter(Boolean));
  }
  if (Array.isArray(options.portalIds) && options.portalIds.length > 0) {
    pushAll(portalsFromIds(options.portalIds).map(toEntry).filter(Boolean));
  }
  if (merged.length > 0) return merged;
  const fallbackUrl = parseAllowedOrigin(options.storeUrl || DEFAULT_STORE_URL, allowLocalhost)
    ? (options.storeUrl || DEFAULT_STORE_URL)
    : DEFAULT_STORE_URL;
  return [{
    id: 'appstore',
    url: fallbackUrl,
    origin: parseAllowedOrigin(fallbackUrl, allowLocalhost) || DEFAULT_ALLOWED_ORIGINS[0],
    labelZh: COPY.zh.cta,
    labelEn: COPY.en.cta,
  }];
}

/** 偵測已加入主畫面嘅 PWA（對齊 docs/46 I4） */
function isStandaloneApp(win) {
  if (!win) return false;
  try {
    if (win.matchMedia && win.matchMedia('(display-mode: standalone)').matches) return true;
  } catch {
    /* 舊環境無 matchMedia */
  }
  return Boolean(win.navigator && win.navigator.standalone === true);
}

function readSessionPass(win, passKey) {
  try {
    return Boolean(win && win.sessionStorage && win.sessionStorage.getItem(passKey) === '1');
  } catch {
    return false;
  }
}

function writeSessionPass(win, passKey) {
  try {
    if (win && win.sessionStorage) win.sessionStorage.setItem(passKey, '1');
  } catch {
    /* Safari 私隱模式或封鎖 storage 時唔可以 throw */
  }
}

function detectCopyLang(doc) {
  const root = doc && doc.documentElement;
  if (!root) return 'zh';
  const dl = (root.getAttribute('data-lang') || '').toLowerCase();
  const hl = (root.getAttribute('lang') || '').toLowerCase();
  if (dl === 'en' || hl === 'en' || hl.startsWith('en-')) return 'en';
  return 'zh';
}

/** 純邏輯判定：方便單元測試同 runtime 共用 */
function evaluateStoreGate(options = {}, env = {}) {
  const mode = options.mode || 'open';
  const appKey = String(options.appKey || 'scoutapp').replace(/[^a-zA-Z0-9_-]/g, '') || 'scoutapp';
  const passKey = `${appKey}.store_pass`;
  const allowLocalhost = Boolean(options.allowLocalhost);
  const allowStandalone = options.allowStandalone !== false;
  const portals = normalizePortals(options);

  const rawAllowed = Array.isArray(options.allowedOrigins) && options.allowedOrigins.length
    ? options.allowedOrigins
    : portals.map((p) => p.origin);
  const allowedSet = new Set(
    rawAllowed.map((o) => parseAllowedOrigin(o, allowLocalhost)).filter(Boolean),
  );

  if (mode === 'open') {
    return { allowed: true, reason: 'open', mode };
  }
  if (mode === 'closed') {
    return { allowed: false, reason: 'closed', mode };
  }
  if (mode === 'iframe-only') {
    const inIframe = Boolean(env.inIframe);
    return inIframe
      ? { allowed: true, reason: 'in-iframe', mode }
      : { allowed: false, reason: 'not-in-iframe', mode };
  }
  if (mode === 'entry-gate') {
    if (allowStandalone && env.standalone) {
      return { allowed: true, reason: 'standalone-pwa', mode };
    }
    if (env.hasSessionPass) {
      return { allowed: true, reason: 'session-pass', mode };
    }
    const refOrigin = parseAllowedOrigin(env.referrer || '', allowLocalhost);
    if (refOrigin && allowedSet.has(refOrigin)) {
      return { allowed: true, reason: 'referrer-whitelist', mode, matchedOrigin: refOrigin, grantSessionPass: true, passKey };
    }
    return { allowed: false, reason: 'missing-whitelist-entry', mode };
  }

  // F4 fail closed：未知 mode 一律攔截，唔會靜靜放行
  return { allowed: false, reason: 'invalid-mode-fail-closed', mode };
}

function renderGateOverlay(doc, win, decision, options = {}) {
  if (!doc || !doc.documentElement) return null;
  const portals = normalizePortals(options);
  const primaryUrl = portals[0].url;
  const isMulti = portals.length > 1;
  const lang = options.lang === 'en' ? 'en' : detectCopyLang(doc);
  const c = COPY[lang] || COPY.zh;
  const isClosed = decision.reason === 'closed';
  const isIframe = decision.reason === 'not-in-iframe';

  const badge = isClosed ? c.closedBadge : c.whitelistBadge;
  const defaultTitle = isClosed
    ? c.closedTitle
    : (isMulti ? c.whitelistTitleMulti : c.whitelistTitleSingle);
  const defaultBody = isClosed
    ? c.closedBody
    : (isIframe ? c.iframeBody : (isMulti ? c.whitelistBodyMulti : c.whitelistBodySingle));
  const title = options.customTitle || defaultTitle;
  const body = options.customMessage || defaultBody;

  doc.documentElement.setAttribute('data-store-gated', decision.reason);

  if (!doc.getElementById('scoutStoreGateStyle')) {
    const style = doc.createElement('style');
    style.id = 'scoutStoreGateStyle';
    style.textContent = [
      'html[data-store-gated] body { margin: 0 !important; min-height: 100vh; background: #1f2430 !important; color: #f5f2eb !important; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; display: flex; align-items: center; justify-content: center; }',
      'html[data-store-gated] body > :not(#scoutStoreGate) { display: none !important; }',
      '#scoutStoreGate { box-sizing: border-box; width: min(92vw, 440px); margin: 24px auto; padding: 28px 24px; border-radius: 16px; background: #282f3d; border: 1px solid rgba(232, 200, 122, 0.28); box-shadow: 0 18px 42px rgba(0, 0, 0, 0.42); text-align: left; line-height: 1.6; }',
      '#scoutStoreGate .sg-badge { display: inline-block; font-size: 12px; font-weight: 600; color: #e8c87a; background: rgba(232, 200, 122, 0.12); padding: 4px 10px; border-radius: 10px; margin-bottom: 12px; }',
      '#scoutStoreGate h1 { margin: 0 0 10px; font-size: 20px; line-height: 1.35; color: #ffffff; }',
      '#scoutStoreGate p { margin: 0 0 20px; font-size: 14px; color: #d3d7e0; }',
      '#scoutStoreGate .sg-actions { display: flex; flex-direction: column; gap: 10px; }',
      '#scoutStoreGate .sg-cta { display: inline-flex; align-items: center; justify-content: center; width: 100%; box-sizing: border-box; padding: 12px 16px; border-radius: 10px; background: #e8c87a; color: #1f2430; font-weight: 700; font-size: 15px; text-decoration: none; }',
      '#scoutStoreGate .sg-cta.sg-secondary { background: transparent; color: #e8c87a; border: 1px solid rgba(232, 200, 122, 0.45); font-weight: 600; }',
      '#scoutStoreGate .sg-cta:focus-visible { outline: 2px solid #ffffff; outline-offset: 2px; }',
      '#scoutStoreGate .sg-sub { margin-top: 12px; margin-bottom: 0; font-size: 12px; color: #9aa3b5; text-align: center; }',
    ].join('\n');
    (doc.head || doc.documentElement).appendChild(style);
  }

  const mount = () => {
    if (!doc.body) return null;
    let box = doc.getElementById('scoutStoreGate');
    if (!box) {
      box = doc.createElement('div');
      box.id = 'scoutStoreGate';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-labelledby', 'scoutStoreGateTitle');
      doc.body.appendChild(box);
    }
    while (box.firstChild) box.removeChild(box.firstChild);

    const badgeEl = doc.createElement('div');
    badgeEl.className = 'sg-badge';
    badgeEl.textContent = badge;

    const h1 = doc.createElement('h1');
    h1.id = 'scoutStoreGateTitle';
    h1.textContent = title;

    const p = doc.createElement('p');
    p.textContent = body;

    const actions = doc.createElement('div');
    actions.className = 'sg-actions';

    portals.forEach((portal, idx) => {
      const a = doc.createElement('a');
      a.className = idx === 0 ? 'sg-cta' : 'sg-cta sg-secondary';
      a.href = portal.url;
      a.target = '_top';
      a.rel = 'noopener';
      a.textContent = lang === 'en' ? portal.labelEn : portal.labelZh;
      actions.appendChild(a);
    });

    box.appendChild(badgeEl);
    box.appendChild(h1);
    box.appendChild(p);
    box.appendChild(actions);

    // SG7：直開網址時講清楚「加入主畫面」要由入口入，防止裝出一個打不開嘅圖示
    if (options.showInstallHint !== false && !isClosed && win && win.navigator && win.navigator.serviceWorker) {
      const hint = doc.createElement('p');
      hint.className = 'sg-sub';
      hint.textContent = c.installHint;
      box.appendChild(hint);
    }

    const sec = Number(options.autoRedirectSeconds || 0);
    if (sec > 0 && win && typeof win.setTimeout === 'function') {
      const sub = doc.createElement('p');
      sub.className = 'sg-sub';
      sub.textContent = `${c.countdownPrefix}${sec}${c.countdownSuffix}`;
      box.appendChild(sub);
      win.setTimeout(() => {
        try {
          (win.top || win).location.replace(primaryUrl);
        } catch {
          win.location.replace(primaryUrl);
        }
      }, sec * 1000);
    }
    return box;
  };

  if (doc.body) {
    mount();
  } else if (typeof doc.addEventListener === 'function') {
    doc.addEventListener('DOMContentLoaded', mount, { once: true });
  }
  return decision;
}

function initStoreGate(options = {}, win = typeof window !== 'undefined' ? window : null) {
  const doc = (options && options.document) || (win && win.document) || null;
  const appKey = String((options && options.appKey) || 'scoutapp').replace(/[^a-zA-Z0-9_-]/g, '') || 'scoutapp';
  const passKey = `${appKey}.store_pass`;

  let inIframe = false;
  if (win) {
    try {
      inIframe = win.self !== win.top;
    } catch {
      inIframe = true; // 跨源存取 win.top 拋錯即代表身處 iframe 內
    }
  }

  const decision = evaluateStoreGate(options, {
    inIframe,
    standalone: isStandaloneApp(win),
    hasSessionPass: readSessionPass(win, passKey),
    referrer: doc ? doc.referrer || '' : '',
  });

  if (decision.allowed) {
    if (decision.grantSessionPass) {
      writeSessionPass(win, decision.passKey);
    }
    return decision;
  }

  renderGateOverlay(doc, win, decision, options);
  return decision;
}

if (typeof globalThis !== 'undefined') {
  globalThis.initStoreGate = initStoreGate;
  globalThis.ScoutStoreGate = {
    VERSION,
    DEFAULT_STORE_URL,
    DEFAULT_LIBRARY_URL,
    DEFAULT_ALLOWED_ORIGINS,
    PORTAL_REGISTRY,
    PORTAL_IDS,
    getPortal,
    portalsFromIds,
    parseAllowedOrigin,
    normalizePortals,
    isStandaloneApp,
    evaluateStoreGate,
    initStoreGate,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VERSION,
    DEFAULT_STORE_URL,
    DEFAULT_LIBRARY_URL,
    DEFAULT_ALLOWED_ORIGINS,
    PORTAL_REGISTRY,
    PORTAL_IDS,
    getPortal,
    portalsFromIds,
    parseAllowedOrigin,
    normalizePortals,
    isStandaloneApp,
    evaluateStoreGate,
    initStoreGate,
  };
}
