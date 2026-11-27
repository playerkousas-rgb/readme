/**
 * gate_remote_v1.0.js — 中央閘門「讀設定」載入器：改一次控制台，68 個 App 一齊跟
 * © SCOUT SYSTEM · COPYRIGHT SCOUT SYSTEM
 * 規格：[docs/62](../docs/62-one-control-plane-for-all-apps.md) · 閘門本體：[store_gate_v1.0.js](store_gate_v1.0.js) · 白名單規則：[docs/50](../docs/50-app-store-whitelist-and-shutdown.md)
 *
 * 解決嘅問題：今日每個 App 都自己 copy 一份 `store_gate_v1.0.js` ＋ 自己寫死 `mode`／`portalIds`，
 * 所以「全部 App 改做要登記先入得」= 要開 68 次工。呢個載入器將「**每個 App 用邊個 mode**」
 * 搬去 APP STORE 一份中央設定，App 只需兩行：
 *
 *   <script src="/store_gate_v1.0.js"></script>
 *   <script src="https://scoutappstore.vercel.app/gate_remote_v1.0.js"
 *           data-app="router"
 *           data-default-mode="entry-gate"
 *           data-on-error="local"></script>
 *
 * 之後你喺控制台改 `apps.access_mode` → 下一次有人開該 App 就生效，**唔需要重新部署 68 個 repo**。
 *
 * 屬性（全部可選）：
 *   data-app            App 嘅 slug（SG18 同一個 slug；唔填就嘗試由 host 推，推唔到就唔查）
 *   data-origin         中央設定來源（預設 https://scoutappstore.vercel.app）
 *   data-default-mode   讀唔到中央設定時用邊個 mode：open｜entry-gate｜iframe-only｜closed
 *   data-on-error       讀唔到時嘅行為：
 *                         local（預設，fail-soft）＝用 data-default-mode 繼續，App 唔會死
 *                         closed（fail-closed）＝全部變「暫時關閉」告示卡（安全但主站一死全站死）
 *                         open（fail-open）＝全部直開（最寬鬆，唔建議）
 *   data-timeout        讀設定嘅 timeout（毫秒，預設 1500）
 *   data-cache-ttl      瀏覽器內快取秒數（預設 300）
 *
 * 設計取捨（同 docs/62 §5 一致，唔准偷偷改）：
 *   ① **預設 fail-soft**：中央設定只係「政策」，唔應該成為 68 個 App 嘅單點故障。
 *   ② 讀唔到 → 用 App 自己寫死嘅 default（即係今日行為），所以**上線呢個載入器本身唔會令任何 App 壞**。
 *   ③ 想嚴格 fail-closed 就喺重要 App 設 `data-on-error="closed"`，唔好全部一齊設。
 *   ④ 只讀公開設定（mode／portalIds 之類），**冇 secret、冇 token、冇個人資料**，所以可以快取。
 *   ⑤ 唔改 `store_gate_v1.0.js` 本體：呢個載入器只負責「攞設定 → 交畀 initStoreGate」。
 *
 * ⚠️ 未實測：本檔按現有 `initStoreGate()` 介面寫，未喺任何真 App 跑過，亦未做離線／PWA 測試。
 */
(function () {
  'use strict';

  const VERSION = 'v1.0';
  const DEFAULT_ORIGIN = 'https://scoutappstore.vercel.app';
  const SCHEMA = 1;

  const self = document.currentScript;
  if (!self) return;

  const attr = (k, d) => (self.getAttribute(k) || d || '').trim();
  const appKey = attr('data-app');
  const origin = attr('data-origin', DEFAULT_ORIGIN).replace(/\/+$/, '');
  const defaultMode = attr('data-default-mode', 'entry-gate');
  const onError = attr('data-on-error', 'local');
  const timeoutMs = Math.max(300, parseInt(attr('data-timeout', '1500'), 10) || 1500);
  const cacheTtl = Math.max(0, parseInt(attr('data-cache-ttl', '300'), 10) || 0);
  const cacheKey = 'scout_gate_cfg:' + (appKey || location.host) + ':' + origin;

  const okModes = ['open', 'entry-gate', 'iframe-only', 'closed'];

  function warn(msg) {
    try { console.warn('[ScoutGate] ' + msg); } catch (_) {}
  }

  // sessionStorage 喺 Safari 私隱模式會拋錯 → 一律 try/catch（同 store_gate 一致）
  function readCache() {
    if (!cacheTtl) return null;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (!o || o.schema !== SCHEMA || typeof o.t !== 'number') return null;
      if (Date.now() - o.t > cacheTtl * 1000) return null;
      return o.cfg || null;
    } catch (_) { return null; }
  }
  function writeCache(cfg) {
    if (!cacheTtl) return;
    try { sessionStorage.setItem(cacheKey, JSON.stringify({ schema: SCHEMA, t: Date.now(), cfg: cfg })); } catch (_) {}
  }

  function normalise(cfg) {
    if (!cfg || typeof cfg !== 'object') return null;
    const mode = okModes.indexOf(cfg.mode) >= 0 ? cfg.mode : null;
    if (!mode) return null;
    return {
      mode: mode,
      portalIds: Array.isArray(cfg.portalIds) ? cfg.portalIds.slice(0, 8).map(String) : undefined,
      silentPortalIds: Array.isArray(cfg.silentPortalIds) ? cfg.silentPortalIds.slice(0, 8).map(String) : undefined,
      allowStandalone: cfg.allowStandalone !== false,
      autoRedirectSeconds: typeof cfg.autoRedirectSeconds === 'number' ? cfg.autoRedirectSeconds : 0,
      titleZh: typeof cfg.titleZh === 'string' ? cfg.titleZh.slice(0, 120) : undefined,
      titleEn: typeof cfg.titleEn === 'string' ? cfg.titleEn.slice(0, 120) : undefined,
      source: 'remote'
    };
  }

  function run(cfg, why) {
    if (typeof window.initStoreGate !== 'function') {
      // 呢個情況 = 本機 store_gate 檔未載入／載入失敗。唔好靜靜扮有閘。
      warn('搵唔到 initStoreGate()，閘門未生效（' + why + '）。請確認 /store_gate_v1.0.js 喺本檔之前載入。');
      return;
    }
    const base = {
      appKey: appKey || ('app-' + location.hostname.replace(/[^a-z0-9]+/gi, '-')),
      mode: defaultMode,
      allowStandalone: true,
      autoRedirectSeconds: 0
    };
    const merged = Object.assign(base, cfg || {});
    if (okModes.indexOf(merged.mode) < 0) merged.mode = defaultMode;
    window.ScoutGateConfig = Object.assign({}, merged, { version: VERSION, why: why });
    try { window.initStoreGate(merged); } catch (e) { warn('initStoreGate 拋錯：' + (e && e.message)); }
  }

  function fallback(why) {
    if (onError === 'closed') { run({ mode: 'closed' }, why + '／fail-closed'); return; }
    if (onError === 'open') { run({ mode: 'open' }, why + '／fail-open'); return; }
    run(null, why + '／用本機 default=' + defaultMode);
  }

  const cached = readCache();
  if (cached) { run(cached, 'cache'); return; }

  if (!appKey) { fallback('冇 data-app'); return; }

  const url = origin + '/api/gate-config?app=' + encodeURIComponent(appKey) + '&v=' + SCHEMA;
  let done = false;
  let timer = null;
  let controller = null;

  const finish = (fn) => {
    if (done) return;
    done = true;
    if (timer) clearTimeout(timer);
    fn();
  };

  try {
    if (typeof AbortController === 'function') controller = new AbortController();
    timer = setTimeout(() => {
      try { if (controller) controller.abort(); } catch (_) {}
      finish(() => fallback('讀設定 timeout ' + timeoutMs + 'ms'));
    }, timeoutMs);

    fetch(url, {
      credentials: 'omit',
      cache: 'no-store',
      signal: controller ? controller.signal : undefined
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((json) => {
        const cfg = normalise(json && json.config ? json.config : json);
        if (!cfg) throw new Error('設定格式唔啱');
        writeCache(cfg);
        finish(() => run(cfg, 'remote'));
      })
      .catch((e) => finish(() => fallback('讀設定失敗：' + (e && e.message ? e.message : 'unknown'))));
  } catch (e) {
    finish(() => fallback('fetch 唔支援／拋錯'));
  }
})();
