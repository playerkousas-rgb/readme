/**
 * Config.gs — GAS 設定 / auth / sig 骨架（X2/X3/X5、A7、F4/F12）
 * ⚠️ 教學起點：貼入 Apps Script 時同 Code.gs 一齊用；按你 repo 嘅 <purpose> 改 SIG_PURPOSE。
 * 鐵律：ABCD 唔寫入任何工作表；Code.gs 內唔寫版號註解（F15）。
 */

var SIG_PURPOSE = '<repo>-bridge-sig-v1';   // 每個 repo 一條常數；上下游必須同一條
var SIG_WINDOW_MS = 5 * 60 * 1000;
var MAX_BODY = 900 * 1024;

function props() { return PropertiesService.getScriptProperties(); }

/** F4 fail closed：只有精確白名算開；未設定（null）由呼叫方決定兼容行為 */
function isOpen(v) {
  if (v === null || v === undefined || v === '') return null;   // 未設定
  return ['1', 'true', 'yes', 'on', 'open'].indexOf(String(v).trim().toLowerCase()) >= 0;
}

/** 04-settings-super：唯一讀取入口 */
function getConfig(key, override) {
  var SCHEMA = {
    'downstream.allowLocal': { type: 'boolean', def: true, failClosed: true },
    'limit.upload.bytes':    { type: 'number',  def: 5 * 1024 * 1024, min: 1024, max: 10 * 1024 * 1024 },
    'session.expMinutes':    { type: 'number',  def: 30, min: 5, max: 60 },
    'feature.notices':       { type: 'boolean', def: true, failClosed: true }
  };
  var s = SCHEMA[key];
  if (!s) throw new Error('UNKNOWN_CONFIG_KEY:' + key);           // F5 白名單
  var raw = (override && override[key] !== undefined) ? override[key] : props().getProperty(key);
  if (raw === null || raw === undefined) return s.def;
  var v = s.type === 'number' ? Number(raw) : isOpen(raw);
  if (s.type === 'number' && (!isFinite(v) || v < s.min || v > s.max)) return s.failClosed ? false : s.def;
  if (s.type === 'boolean' && v === null) return s.failClosed ? false : s.def;
  return v;
}

/** 開機自檢：缺 key = 拒絕敏感 action（F12） */
function selfCheck() {
  var missing = [];
  if (!props().getProperty('API_KEY')) missing.push('API_KEY');
  return { ok: missing.length === 0, missing: missing };
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** X3：doGet/doPost 第一行就驗 */
function guardRequest(e, fn) {
  var chk = selfCheck();
  if (!chk.ok) return jsonOut({ success: false, code: 'CONFIG_MISSING', missing: chk.missing });
  var raw = e.postData && e.postData.contents ? e.postData.contents : '';
  if (raw.length > MAX_BODY) return jsonOut({ success: false, code: 'BAD_INPUT' });
  var okSig = verifyInboundSig(e, raw, props().getProperty('API_KEY'));
  var localOpen = getConfig('downstream.allowLocal');
  if (!okSig && !localOpen) {
    return jsonOut({ success: false, upstream_only: true, code: 'UPSTREAM_ONLY' });
  }
  if (!okSig && !verifyUserToken(e)) return jsonOut({ success: false, code: 'AUTH_FAILED' });
  return fn();
}

/** A7：query 優先（GAS 302 會遺失 query），body 後備；兩組 nonce 一次過消耗 */
function verifyInboundSig(e, rawBody, rootKey) {
  var p = e.parameter || {};
  var body = {};
  try { body = rawBody ? JSON.parse(rawBody) : {}; } catch (err) { return false; }
  var cache = CacheService.getScriptCache();
  var candidates = [
    { sig: p.sig, ts: p.sts, nonce: p.snonce, digest: sha256Hex(rawBody) },
    { sig: body.sig, ts: body.sig_ts, nonce: body.sig_nonce,
      digest: sha256Hex(JSON.stringify(omitSig(body))) }
  ];
  var used = [];
  var valid = false;
  for (var i = 0; i < candidates.length; i++) {
    var c = candidates[i];
    if (!/^[0-9a-f]{64}$/.test(String(c.sig || ''))) continue;
    var ts = Number(c.ts);
    if (!isFinite(ts) || Math.abs(Date.now() - ts) > SIG_WINDOW_MS) continue;
    if (!c.nonce || cache.get('nonce_' + c.nonce)) continue;
    var canonical = body.action + '\n' + ts + '\n' + c.nonce + '\n' + c.digest;
    var expect = hmacHex(SIG_PURPOSE, rootKey);          // sigKey
    var got = hmacHex(canonical, expect);
    // 兩邊先各自 SHA-256 再比對，避免逐字元短路時序
    if (sha256Hex(got) === sha256Hex(String(c.sig))) { valid = true; used.push(c.nonce); }
  }
  // 兩組 nonce 一次過消耗（堵死混合重放）
  used.forEach(function (n) { cache.put('nonce_' + n, '1', 600); });
  return valid;
}

function omitSig(o) {
  var c = {}; Object.keys(o).forEach(function (k) {
    if (['sig', 'sig_ts', 'sig_nonce'].indexOf(k) < 0) c[k] = o[k];
  }); return c;
}
function sha256Hex(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function hmacHex(msg, key) {
  return Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, msg, key, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

function verifyUserToken(e) {
  // TODO: 專案嘅用戶 token 驗證（X3）
  return false;
}

/** X4：兩張白名單；回應永遠唔含 password_hash */
var READ_ACTIONS = ['load', 'getLoginMode', 'getLinkState', 'getMembers', 'getConfig',
  'getAllUsers', 'getPendingRequests', 'getApplications', 'getLogRecords', 'getAuditLog'];
var WRITE_ACTIONS = ['save', 'upsertUser', 'importUsers', 'resetPassword',
  'updateUserProfile', 'setUserStatus', 'setLocalLogin'];
var NEVER = ['login', 'apply', 'logout', 'changePassword', 'updateConfig'];

function actionAllowed(action) {
  if (NEVER.indexOf(action) >= 0) return false;
  return READ_ACTIONS.indexOf(action) >= 0 || WRITE_ACTIONS.indexOf(action) >= 0;
}

/** A11：標籤消毒，防試算表算式注入 */
function safeLabel(s) {
  return String(s || '').replace(/[^0-9A-Za-z_.@-]/g, '').slice(0, 64);
}
