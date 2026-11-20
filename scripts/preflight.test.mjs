import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SCRIPT = path.join(import.meta.dirname, 'preflight_v1.0.mjs');

function runDesignMapCheck(mapText) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'preflight-d1-'));
  try {
    if (mapText !== null) writeFileSync(path.join(root, 'ARCHITECTURE.md'), mapText, 'utf8');
    const run = spawnSync(process.execPath, [SCRIPT, root, '--json'], { encoding: 'utf8' });
    const result = JSON.parse(run.stdout);
    return result.checks.find((check) => check.id === 'design_map');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('PREFLIGHT D1: missing architecture map fails', () => {
  const check = runDesignMapCheck(null);
  assert.equal(check.ok, false);
  assert.match(check.detail, /ARCHITECTURE\.md/);
});

test('PREFLIGHT D1: unfilled starter placeholders fail', () => {
  const token = `{${'{'}REPO_NAME}}`;
  const check = runDesignMapCheck(`# ${token}\n\n\`\`\`mermaid\nflowchart LR\n  A --> B\n\`\`\`\n${'A clear design description. '.repeat(12)}`);
  assert.equal(check.ok, false);
});

test('PREFLIGHT D1: filled map with a diagram passes presence check', () => {
  const map = `# Sample app architecture\n\n\`\`\`mermaid\nflowchart LR\n  User --> UI --> LocalLogic --> Export\n\`\`\`\n\n${'This describes the confirmed responsibility, data boundary, and expected flow. '.repeat(8)}`;
  const check = runDesignMapCheck(map);
  assert.equal(check.ok, true);
  assert.match(check.detail, /語義仍須人手 review/);
});
