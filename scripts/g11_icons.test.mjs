// ✅ G11 圖標實際檔案守護測試（docs/33 §2/§7/§8/§9/§12）
// 跑：node --test scripts/g11_icons.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GUARD_SRC = path.join(ROOT, 'scripts', 'guard.mjs');

/** 最小 PNG（guard 讀 IHDR 寬高；extra 控制檔案體積） */
function png(w, h, extra = 0) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const len = Buffer.alloc(4); len.writeUInt32BE(13, 0);
  const type = Buffer.from('IHDR', 'ascii');
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([sig, len, type, ihdr, Buffer.alloc(4), Buffer.alloc(extra)]);
}

/** 最小 ICO（ICONDIR + entries；w/h 1 byte，0 = 256） */
function ico(sizes = [16, 32, 48]) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
  const entries = sizes.map((s) => {
    const e = Buffer.alloc(16);
    e[0] = s >= 256 ? 0 : s; e[1] = s >= 256 ? 0 : s;
    return e;
  });
  return Buffer.concat([head, ...entries]);
}

const GOOD_ICONS = {
  'favicon-16.png': [16, 16],
  'favicon-32.png': [32, 32],
  'apple-touch-icon.png': [180, 180],
  'icon-192.png': [192, 192],
  'icon-512.png': [512, 512],
  'icon-maskable-192.png': [192, 192],
  'icon-maskable-512.png': [512, 512],
  'og-image.png': [1200, 630],
};

function writeIcons(dir, {
  subDir = 'icons',
  suffix = '',
  omit = [],
  wrongSize = {},
  icoSizes = [16, 32, 48],
  pad512 = 42 * 1024,
  padOg = 0,
} = {}) {
  const target = path.join(dir, subDir);
  mkdirSync(target, { recursive: true });
  const nameOf = (base) => {
    if (!suffix) return base;
    const ext = path.extname(base);
    return `${base.slice(0, -ext.length)}${suffix}${ext}`;
  };
  for (const [file, [w, h]] of Object.entries(GOOD_ICONS)) {
    if (omit.includes(file)) continue;
    const [ww, hh] = wrongSize[file] || [w, h];
    const pad = file === 'icon-512.png' ? pad512 : file === 'og-image.png' ? padOg : 0;
    writeFileSync(path.join(target, nameOf(file)), png(ww, hh, pad));
  }
  if (!omit.includes('favicon.ico')) {
    writeFileSync(path.join(target, nameOf('favicon.ico')), ico(icoSizes));
  }
}

function withRepo(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), 'guard-g11-'));
  try {
    writeFileSync(path.join(dir, 'README.md'), '# test\n');
    writeFileSync(path.join(dir, '.gitignore'), '.env\nnode_modules/\ndist/\n');
    writeFileSync(path.join(dir, '.vercelignore'), 'node_modules/\n.git/\n.cache/\n*.bak\n*.log\ndocs/\n');
    mkdirSync(path.join(dir, 'scripts'), { recursive: true });
    copyFileSync(GUARD_SRC, path.join(dir, 'scripts', 'guard.mjs'));
    return fn(dir);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

function runGuard(cwd, extraArgs = []) {
  const guard = path.join(cwd, 'scripts', 'guard.mjs');
  try {
    return { ok: true, out: execFileSync(process.execPath, [guard, ...extraArgs], { cwd, encoding: 'utf8' }) };
  } catch (e) {
    return { ok: false, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

const GOOD_HEAD = `<!doctype html><html><head>
<link rel="icon" href="/icons/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
<link rel="apple-touch-icon" type="image/png" sizes="180x180" href="/icons/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
</head><body></body></html>`;

const GOOD_MANIFEST = JSON.stringify({
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
});

test('G11：icons/ 9 檔齊、尺寸啱、≥40KB、<head> sizes/type 啱、manifest 有 512 → 零警告 PASS', () => {
  withRepo((dir) => {
    writeIcons(dir);
    writeFileSync(path.join(dir, 'index.html'), GOOD_HEAD);
    writeFileSync(path.join(dir, 'manifest.webmanifest'), GOOD_MANIFEST);
    const r = runGuard(dir, ['--strict-icons']);
    assert.equal(r.ok, true, r.out);
    assert.doesNotMatch(r.out, /^\s*!\s+G11/m);
    assert.match(r.out, /G11：icons\/ 9 檔齊、尺寸正確/);
    assert.match(r.out, /G11：index\.html 4 條 icon link/);
    assert.match(r.out, /G11：manifest\.webmanifest 有 512x512 icon/);
  });
});

test('G11：支援 public/icons/ 同 web/public/icons/ 及 -v2 改版後綴（docs/33 §9.5）', () => {
  withRepo((dir) => {
    writeIcons(dir, { subDir: 'public/icons', suffix: '-v2' });
    const r = runGuard(dir, ['--strict-icons']);
    assert.equal(r.ok, true, r.out);
    assert.match(r.out, /G11：public\/icons\/ 9 檔齊/);
  });
  withRepo((dir) => {
    writeIcons(dir, { subDir: 'web/public/icons', suffix: '-v3' });
    const r = runGuard(dir, ['--strict-icons']);
    assert.equal(r.ok, true, r.out);
    assert.match(r.out, /G11：web\/public\/icons\/ 9 檔齊/);
  });
});

test('G11：預設 warn 模式列出缺檔但唔擋 CI；加 --strict-icons 則 FAIL', () => {
  withRepo((dir) => {
    writeIcons(dir, { omit: ['icon-512.png', 'og-image.png'] });
    const soft = runGuard(dir);
    assert.equal(soft.ok, true, '預設過渡期用 warn 唔硬擋');
    assert.match(soft.out, /!\s+G11：缺圖標 icons\/icon-512\.png/);
    assert.match(soft.out, /!\s+G11：缺圖標 icons\/og-image\.png/);

    const strict = runGuard(dir, ['--strict-icons']);
    assert.equal(strict.ok, false, '--strict-icons 缺檔要 FAIL');
    assert.match(strict.out, /✗\s+G11：缺圖標 icons\/icon-512\.png/);
  });
});

test('G11：PNG 尺寸錯（IHDR）要捉到', () => {
  withRepo((dir) => {
    writeIcons(dir, { wrongSize: { 'icon-512.png': [256, 256] } });
    const r = runGuard(dir, ['--strict-icons']);
    assert.equal(r.ok, false);
    assert.match(r.out, /G11：icons\/icon-512\.png 尺寸 256×256，要 512×512/);
  });
});

test('G11：favicon.ico 缺 48px 內嵌圖要捉到', () => {
  withRepo((dir) => {
    writeIcons(dir, { icoSizes: [16, 32] });
    const r = runGuard(dir, ['--strict-icons']);
    assert.equal(r.ok, false);
    assert.match(r.out, /G11：icons\/favicon\.ico 缺 48px 內嵌圖/);
  });
});

test('G11：9 檔總體積 > 260KB 要捉到；icon-512 < 40KB 出過度壓縮警告', () => {
  withRepo((dir) => {
    writeIcons(dir, { padOg: 260 * 1024 });
    const r = runGuard(dir, ['--strict-icons']);
    assert.equal(r.ok, false);
    assert.match(r.out, /G11：9 檔總體積 .* > 260 KB/);
  });
  withRepo((dir) => {
    writeIcons(dir, { pad512: 1024 });
    const r = runGuard(dir);
    assert.equal(r.ok, true);
    assert.match(r.out, /G11：icons\/icon-512\.png 只有 .* < 40 KB/);
  });
});

test('G11：<head> apple-touch-icon 冇 sizes / PNG 冇 type 要捉到（.ico 豁免）', () => {
  withRepo((dir) => {
    writeIcons(dir);
    writeFileSync(path.join(dir, 'index.html'), `<!doctype html><html><head>
<link rel="icon" href="/icons/favicon.ico" sizes="any" />
<link rel="apple-touch-icon" type="image/png" href="/icons/apple-touch-icon.png" />
<link rel="icon" sizes="32x32" href="/icons/favicon-32.png" />
</head></html>`);
    const r = runGuard(dir, ['--strict-icons']);
    assert.equal(r.ok, false);
    assert.match(r.out, /G11：index\.html apple-touch-icon 冇寫 sizes/);
    assert.match(r.out, /G11：index\.html PNG 圖標冇寫 type（\/icons\/favicon-32\.png）/);
    assert.doesNotMatch(r.out, /favicon\.ico.*冇寫 type/);
  });
});

test('G11：manifest 無 512x512 要捉到', () => {
  withRepo((dir) => {
    writeIcons(dir);
    writeFileSync(path.join(dir, 'manifest.webmanifest'), JSON.stringify({
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    }));
    const r = runGuard(dir, ['--strict-icons']);
    assert.equal(r.ok, false);
    assert.match(r.out, /G11：manifest\.webmanifest 無 512x512 icon/);
  });
});

test('G11：無 icons/ 嘅純文檔或單一 HTML repo 跳過，唔報錯亦唔警告', () => {
  withRepo((dir) => {
    writeFileSync(path.join(dir, 'index.html'), '<!doctype html><html><head></head></html>');
    const r = runGuard(dir, ['--strict-icons']);
    assert.equal(r.ok, true, r.out);
    assert.match(r.out, /G11：無 icons\/（或 public\/icons\/），跳過/);
    assert.doesNotMatch(r.out, /^\s*!\s+G11/m);
  });
});

test('F16/G11：docs/33 §7/§12 + Icon Maker 範本 + PLAYBOOK + guard 四處同步', () => {
  const doc = readFileSync(path.join(ROOT, 'docs', '33-icon-standard.md'), 'utf8');
  assert.match(doc, /sizes.*type.*一定要寫明/, 'docs/33 §7 要有 sizes/type 規則');
  assert.match(doc, /PNG 一定要有 `type="image\/png"`/, 'docs/33 §7 要有 PNG type 規則');
  assert.match(doc, /### 12\. 取用方配合原則/, 'docs/33 §12 只留通用配合原則');

  const tpl = readFileSync(path.join(ROOT, 'templates', 'iconmaker', 'icon_maker_v1.0.html'), 'utf8');
  assert.match(tpl, /rel="apple-touch-icon" type="image\/png" sizes="180x180"/, 'Icon Maker 範本 apple-touch-icon 要齊 type + sizes');

  const pb = readFileSync(path.join(ROOT, 'PLAYBOOK.md'), 'utf8');
  assert.match(pb, /G11 全站圖標標準.*9 個 PNG／ICO/, 'PLAYBOOK 摘要保持一致');

  const guard = readFileSync(GUARD_SRC, 'utf8');
  assert.match(guard, /F16\/G11：圖標標準缺/, '保留現有文件 9 檔名檢查');
  assert.match(guard, /function checkIcons\(\)/, 'guard 要有實際檔案檢查');
  assert.match(guard, /pngSize/, 'guard 要用 IHDR 驗尺寸');
});
