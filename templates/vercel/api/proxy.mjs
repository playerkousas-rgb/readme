// /api/proxy — 唯一出入口骨架（V1 / A1 / A6）
// ⚠️ 教學起點：verifySession / rateLimit / checkScope 要換成你專案嘅真正實作。
// 鐵律：verifySession → 白名單 + scope → 先至 inject secret。

import { createHash, timingSafeEqual } from 'node:crypto';

const ALLOWED_ACTIONS = new Set([
  'load', 'getConfig', 'getMembers',      // 讀
  'save', 'requestComplete',              // 寫（其餘按專案白名單加，X4）
]);

const ORIGINS = new Set([
  'https://<app>.vercel.app',
  'https://<custom-domain>',
]);

const LIMITS = { load: 60, save: 20 };   // per-IP per-minute

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function code(err) {
  // F13：統一錯誤碼，唔好將堆疊 / SQL / env 名回傳
  const MAP = {
    AUTH_FAILED: '帳號或密碼不正確',
    RATE_LIMITED: '太多請求，請稍後再試',
    CONFIG_MISSING: '系統設定未完整，請聯絡管理員',
    FORBIDDEN: '權限不足',
    BAD_INPUT: '輸入資料不正確',
  };
  return MAP[err] ?? '系統錯誤';
}

async function verifySession(req) {
  // TODO: 驗 JWT（HttpOnly Secure SameSite=Lax）、exp、pv、jti
  // 呢度只做示範：由 cookie 拎 token，驗簽 + 由 payload 拎 sub/role/scope
  const token = (req.headers.get('cookie') ?? '').match(/session=([^;]+)/)?.[1];
  if (!token) return null;
  // return { sub, role, scope, pv, jti };
  return null;
}

function checkScope(session, action, targetUnit) {
  // A6：role 由 session 嚟，永遠唔信 request body
  // override ⊆ 授權人自己權限（封頂）
  return session.scope?.units?.includes(targetUnit) && session.scope?.actions?.includes(action);
}

const hits = new Map();   // 單機簡易版；Production 用 Vercel KV / Upstash
function rateLimit(ip, action) {
  const k = `${ip}:${action}:${Math.floor(Date.now() / 60000)}`;
  const n = (hits.get(k) ?? 0) + 1;
  hits.set(k, n);
  return n <= (LIMITS[action] ?? 30);
}

export default async function handler(req) {
  if (req.method !== 'POST') return json({ ok: false, code: 'BAD_INPUT' }, 405);

  const origin = req.headers.get('origin');
  if (origin && !ORIGINS.has(origin)) return json({ ok: false, code: 'FORBIDDEN' }, 403);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  let body;
  try { body = await req.json(); } catch { return json({ ok: false, code: 'BAD_INPUT' }, 400); }

  const action = String(body.action ?? '');
  if (!ALLOWED_ACTIONS.has(action)) return json({ ok: false, code: 'BAD_INPUT' }, 400);  // F5
  if (!rateLimit(ip, action)) return json({ ok: false, code: 'RATE_LIMITED' }, 429);     // A8

  const session = await verifySession(req);
  if (!session) return json({ ok: false, code: 'AUTH_FAILED' }, 401);
  if (!checkScope(session, action, body.unit)) return json({ ok: false, code: 'FORBIDDEN' }, 403);

  // ---- 由呢度開始先至可以讀 secret（A1）----
  const backend = process.env[`UNIT_${body.unit}_BACKEND`];
  const apikey = process.env[`UNIT_${body.unit}_APIKEY`];
  if (!backend || !apikey) return json({ ok: false, code: 'CONFIG_MISSING' }, 503);       // F12
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(backend)) {
    return json({ ok: false, code: 'BAD_INPUT' }, 400);                                   // A9 防 SSRF
  }

  const outbound = await fetch(backend, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...body, key: apikey }),   // key 只喺呢個 server-to-server request
  });
  const data = await outbound.json().catch(() => ({ ok: false, code: 'BAD_INPUT' }));

  // V9：log 只記 metadata
  console.log(JSON.stringify({ t: Date.now(), action, unit: body.unit, ok: !!data.success, bytes: JSON.stringify(data).length }));
  return json(data);
}

// 無用嘅 import 保留係為咗示範「api 零依賴」（S1）：只用 node:crypto 同 fetch。
void createHash; void timingSafeEqual; void code;
