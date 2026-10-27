// ✅ 水印 + 版權 + 雙版號守護測試（W / V 系列）
// 跑：node --test templates/watermark/watermark.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  VERSION, MARK_V1, PREFIX_V2, COPYRIGHT, STEP, N, B, BASIS_NORM,
  embed, decode, makePayloadV2, toBits,
} from './scout_watermark_codec_v1.0.mjs';

const decoderHtml = readFileSync(new URL('./drawscout_decoder_v1.0.html', import.meta.url), 'utf8');
const codecSrc = readFileSync(new URL('./scout_watermark_codec_v1.0.mjs', import.meta.url), 'utf8');

function grayImage(w = 128, h = 128, v = 128) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255;
  }
  return { data, width: w, height: h };
}
function noisyImage(w = 128, h = 128) {
  const img = grayImage(w, h);
  let seed = 42;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  for (let i = 0; i < w * h; i++) {
    const d = (rnd() - .5) * 40;
    img.data[i * 4] = 128 + d; img.data[i * 4 + 1] = 128 + d * .8; img.data[i * 4 + 2] = 128 + d * .6;
  }
  return img;
}

/* ---------- 真實案例互通：童軍漫畫生成器 APP_VERSION 4.2.1 嘅 embedSourceWatermark ----------
 * 呢段係由用戶提供嘅單一 HTML 逐行抄落嚟（WM_MARK / WM_STEP / WM_BASIS / QIM 最近鄰），
 * 用嚟證明我哋 drawscout_decoder_v1.0.html 可以解到真實 app 出嘅圖（W3 向後兼容）。
 */
function legacyEmbedV421(image) {
  const WM_MARK = 'DRAWSCOUT|v1';
  const WM_STEP = 32;
  const WM_COS = Array.from({ length: 8 }, (_, u) =>
    Array.from({ length: 8 }, (_, x) => Math.cos((2 * x + 1) * u * Math.PI / 16)));
  const WM_ALPHA = Array.from({ length: 8 }, (_, u) => u === 0 ? Math.sqrt(1 / 8) : Math.sqrt(2 / 8));
  const WM_BASIS = Array.from({ length: 8 }, (_, y) =>
    Array.from({ length: 8 }, (_, x) => WM_ALPHA[2] * WM_ALPHA[3] * WM_COS[2][y] * WM_COS[3][x]));
  const WM_BITS = Array.from(WM_MARK, ch => ch.charCodeAt(0).toString(2).padStart(8, '0')).join('');
  const { data: d, width: w, height: h } = image;
  const wmCoeff = (x0, y0) => {
    let s = 0;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const i = ((y0 + y) * w + x0 + x) * 4;
      const Y = .299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2];
      s += Y * WM_BASIS[y][x];
    }
    return s;
  };
  let bi = 0;
  for (let y = 0; y + 7 < h; y += 8) for (let x = 0; x + 7 < w; x += 8, bi++) {
    const bit = Number(WM_BITS[bi % WM_BITS.length]);
    const coef = wmCoeff(x, y);
    let k = Math.round(coef / WM_STEP);
    if ((k & 1) !== bit) {
      const a = k - 1, b = k + 1;
      k = Math.abs(a * WM_STEP - coef) <= Math.abs(b * WM_STEP - coef) ? a : b;
    }
    const delta = k * WM_STEP - coef;
    for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) {
      const i = ((y + yy) * w + x + xx) * 4, dv = delta * WM_BASIS[yy][xx];
      d[i] = Math.max(0, Math.min(255, d[i] + dv));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + dv));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + dv));
    }
  }
  return bi;
}

test('W3：真實 app 嘅 legacy embed → 我哋 decoder 解到 DRAWSCOUT|v1', () => {
  const img = noisyImage(256, 256);
  assert.equal(decode(img).found, false);
  const blocks = legacyEmbedV421(img);
  assert.ok(blocks >= 100, '要有足夠區塊做多數決');
  const d = decode(img);
  assert.equal(d.found, true);
  assert.equal(d.version, 'v1');
  assert.equal(d.payload, MARK_V1);
  assert.equal(d.copyright, COPYRIGHT);
  assert.ok(d.confidence > .58);
});

/* ---------- 演算法 ---------- */
test('W2：基底正交（Σ B² = 1），常數同解碼器一致', () => {
  assert.ok(Math.abs(BASIS_NORM - 1) < 1e-9, `BASIS_NORM=${BASIS_NORM}`);
  assert.equal(N, 8);
  assert.equal(STEP, 32);
  assert.equal(decoderHtml.includes("const STEP = 32, N = 8"), true);
  assert.equal(decoderHtml.includes("const MARK_V1 = 'DRAWSCOUT|v1'"), true);
  assert.equal(decoderHtml.includes("const PREFIX_V2 = 'SCOUTSYSTEM|v2|'"), true);
});

test('W2：v1 MARK 嵌入 → 解碼成功（同你提供嘅 drawscout.html 兼容）', () => {
  const img = noisyImage();
  assert.equal(decode(img).found, false, '未嵌入唔應該誤判');
  const r = embed(img, MARK_V1);
  assert.equal(r.bits, toBits(MARK_V1).length);
  const d = decode(img);
  assert.equal(d.found, true);
  assert.equal(d.version, 'v1');
  assert.equal(d.payload, MARK_V1);
  assert.ok(d.confidence > .58);
});

test('W2/W5：v2 payload 含 COPYRIGHT SCOUT SYSTEM + 單位 + 日期 + 校驗', () => {
  const p = makePayloadV2({ unit: '0082', date: '20261026', hash: 'A1B2' });
  assert.equal(p.length, 33);
  assert.ok(p.startsWith(PREFIX_V2));
  const img = noisyImage(160, 160);
  embed(img, p);
  const d = decode(img);
  assert.equal(d.found, true);
  assert.equal(d.version, 'v2');
  assert.equal(d.payload, p);
  assert.equal(d.unit, '0082');
  assert.equal(d.date, '20261026');
  assert.equal(d.hash, 'A1B2');
  assert.equal(d.copyright, COPYRIGHT);
});

test('W4：水印頂到輕微壓縮，但唔係加密 — 重度破壞即失敗（要如實講限制）', () => {
  const addNoise = (img, amp) => {
    let s = 7;
    const rnd = () => (s = (s * 1103515245 + 12345) >>> 0) / 2 ** 32;
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (rnd() - .5) * amp;
      img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    }
  };
  const light = noisyImage(); embed(light, MARK_V1); addNoise(light, 10);
  assert.equal(decode(light).found, true, '輕微壓縮／噪訊應該頂得住');

  // 裁切一半仍可能因多數決而讀到（重複寫入嘅特性），所以唔好當「一定讀唔到」
  const cropped = noisyImage(); embed(cropped, MARK_V1);
  for (let i = 0; i < cropped.data.length / 2; i += 4) {
    cropped.data[i] = 255 - cropped.data[i];
    cropped.data[i + 1] = 255 - cropped.data[i + 1];
    cropped.data[i + 2] = 255 - cropped.data[i + 2];
  }
  assert.equal(decode(cropped).found, true, '重複寫入令佢頂到部分裁切（呢個係特性，唔係保證）');

  const heavy = noisyImage(); embed(heavy, MARK_V1); addNoise(heavy, 32);
  assert.equal(decode(heavy).found, false, '重度處理後應該讀唔到 → 陰性結果唔代表唔係本系統圖');
});

test('W7：payload 唔可以放個人資料（ASCII + 固定長度 + 只限 unit/date/hash）', () => {
  const p = makePayloadV2({ unit: '<script>', date: '20261026', hash: 'A1B2' });
  assert.ok(!p.includes('<'));
  assert.equal(p.length, 33);
  assert.throws(() => embed(grayImage(), '中文payload'), /PAYLOAD_MUST_BE_ASCII/);
});

test('W1：解碼器有 © SCOUT SYSTEM 版權字串 + 唔好用未 escape 嘅 decoded 入 innerHTML', () => {
  assert.ok(decoderHtml.includes('© SCOUT SYSTEM'));
  assert.ok(decoderHtml.includes('COPYRIGHT SCOUT SYSTEM'));
  assert.ok(decoderHtml.includes('const esc = s =>'), '要有 escape function（A11）');
  assert.ok(decoderHtml.includes('esc(p)'), 'decoded 內容要 escape 先入 innerHTML');
});

/* ---------- V 系列：檔名 + 內文雙版號 ---------- */
test('V1/V2：codec 檔名版號 = 內文 VERSION', () => {
  const fileV = new URL('./scout_watermark_codec_v1.0.mjs', import.meta.url).pathname.match(/_v(\d+\.\d+)\./)[1];
  assert.equal(`v${fileV}`, VERSION);
  assert.ok(codecSrc.includes(`VERSION = '${VERSION}'`));
});

test('V1/V2：decoder 檔名版號 = 內文三處（meta / const / 頁尾）', () => {
  const fileV = new URL('./drawscout_decoder_v1.0.html', import.meta.url).pathname.match(/_v(\d+\.\d+)\./)[1];
  const v = `v${fileV}`;
  assert.ok(decoderHtml.includes(`<meta name="app-version" content="${v}">`));
  assert.ok(decoderHtml.includes(`const APP_VERSION = '${v}'`));
  assert.ok(decoderHtml.includes(`<strong>${v}</strong>`));
  assert.ok(decoderHtml.includes(`<title>DrawScout 隱形水印解碼器 ${v}</title>`));
});

test('V3：版號更新要同時改檔名同內文 — 測試拎晒所有 vX.Y 出現位置', () => {
  const all = [...decoderHtml.matchAll(/v\d+\.\d+/g)].map(m => m[0]);
  assert.ok(all.length >= 4, '至少 meta/const/title/footer/comment 五處');
  assert.ok(all.every(x => x === VERSION), `內文版號唔一致：${[...new Set(all)].join(',')}`);
});
