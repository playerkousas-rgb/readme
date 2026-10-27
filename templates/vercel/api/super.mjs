// /api/super — 隱藏超管唯一端點骨架（A14 / V5）
// ⚠️ 教學起點，上線前必須補：
//   ① nonce store 換成 Vercel KV / Upstash（而家 Map 只喺單機有效）
//   ② 告警 webhook（email / Slack）真正接駁
//   ③ AUDIT_LOG 寫入你專案嘅 append-only store + prev_hash 鏈
//   ④ 兩人規則（敏感動作要第二人 out-of-band 確認）
//
// 鐵律：SUPER_KEY 只喺 env；缺 key → 404；三權限白名單；每次使用留痕 + 告警。

import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'node:crypto';

const ALLOWED = new Set(['resetPassword', 'unlockAccount', 'readDiagnostics']);
const TICKET_TTL_MS = 60_000;
const seen = new Map();   // TODO: 換 Vercel KV（nonce → exp），重啟唔可以失效

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}
function fail() { return json({ ok: false, code: 'AUTH_FAILED' }, 401); }   // A17 防枚舉

function b64(buf) { return Buffer.from(buf).toString('base64url'); }

function makeKey(secret) {
  return createHmac('sha256', 'super-ticket-v1').update(secret).digest();   // 32 bytes
}

/** 產生 60 秒一次性票據（通常由一個獨立低調入口／CLI 呼叫） */
export function issueTicket(superKey, { unit, purpose = 'breakglass' }) {
  const iv = randomBytes(12);
  const nonce = randomBytes(16).toString('hex');
  const payload = JSON.stringify({ sub: 'super', unit, purpose, nonce, exp: Date.now() + TICKET_TTL_MS });
  const c = createCipheriv('aes-256-gcm', makeKey(superKey), iv);
  const enc = Buffer.concat([c.update(payload, 'utf8'), c.final()]);
  return b64(Buffer.concat([iv, c.getAuthTag(), enc]));
}

function openTicket(ticket, superKey) {
  try {
    const raw = Buffer.from(ticket, 'base64url');
    const iv = raw.subarray(0, 12), tag = raw.subarray(12, 28), enc = raw.subarray(28);
    const d = createDecipheriv('aes-256-gcm', makeKey(superKey), iv);
    d.setAuthTag(tag);
    const p = JSON.parse(Buffer.concat([d.update(enc), d.final()]).toString('utf8'));
    if (p.sub !== 'super' || typeof p.exp !== 'number') return null;
    if (p.exp < Date.now() || p.exp > Date.now() + TICKET_TTL_MS + 5_000) return null;  // 未來 ts 都拒
    if (seen.has(p.nonce)) return null;                                                   // 一次性防重放
    seen.set(p.nonce, p.exp);
    return p;
  } catch { return null; }
}

async function audit(entry) {
  // TODO：寫入 append-only AUDIT_LOG（含 prev_hash 鏈）+ 告警
  // 告警內容唔好帶 ticket / key
  console.log(JSON.stringify({ t: Date.now(), actor: 'SUPER', via: 'breakglass', ...entry }));
}

async function doAction(action, payload, ctx) {
  switch (action) {
    case 'resetPassword':
      // TODO: 產生臨時碼 + mustChangePw + pv+1（踢走舊 session）
      return { ok: true, note: 'temporary code issued', target: payload.sub };
    case 'unlockAccount':
      // TODO: 清失敗計數
      return { ok: true, note: 'unlocked', target: payload.sub };
    case 'readDiagnostics':
      // 唯讀：唔含個人資料 / hash / secret
      return { ok: true, diagnostics: {
        backendVersion: process.env.BACKEND_VERSION ?? 'unknown',
        missingEnv: ['SESSION_SECRET', 'SUPER_KEY'].filter(k => !process.env[k]),
        bytes: 0, configVersion: 1,
      }};
    default:
      return { ok: false, code: 'BAD_INPUT' };
  }
}

export default async function handler(req) {
  const superKey = process.env.SUPER_KEY;
  if (!superKey) return json({ ok: false, code: 'NOT_FOUND' }, 404);   // 缺 key 唔好洩漏存在
  if (req.method !== 'POST') return fail();

  let body;
  try { body = await req.json(); } catch { return fail(); }

  const ticket = openTicket(String(body.ticket ?? ''), superKey);
  if (!ticket) return fail();

  const action = String(body.action ?? '');
  if (!ALLOWED.has(action)) return fail();                              // 三權限白名單

  if (body.unit !== ticket.unit) return fail();                        // 綁單位
  const result = await doAction(action, body.payload ?? {}, ticket);

  await audit({ action, unit: ticket.unit, targetSub: body.payload?.sub ? 'hashed' : undefined,
                reason: body.reason ?? '', ip: req.headers.get('x-forwarded-for')?.split(',')[0] ?? '',
                ticketNonce: ticket.nonce });

  return json(result);
}
