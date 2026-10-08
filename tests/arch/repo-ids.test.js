'use strict';
// Repository-wide guard: no script, spreadsheet or Drive ID, and no real clasp config, anywhere in the repository.
// Covers every environment (dev, test, live). Violations are planted in a temporary folder to prove the scan works.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { scanRepoForIds } = require('./lib/checks');
const { format } = require('./lib/scan');
const { plant, REPO_ROOT } = require('./lib/harness');

// Fake values shaped like Google IDs, built at run time so this file holds no ID-like literal.
const fakeId = ['1', 'AbCdEfGhIjKlMnOpQrStUvWxYz', '0123456789'].join('');
const rm = (d) => fs.rmSync(d, { recursive: true, force: true });

test('REPO-ID the repository holds no script, spreadsheet or Drive ID', () => {
  const v = scanRepoForIds(REPO_ROOT);
  assert.equal(v.length, 0, `\n${format(v)}`);
});

test('REPO-ID the scan reports planted IDs (spreadsheet URL, folder URL, script ID in a clasp file)', () => {
  const cases = {
    'docs/a.md': `[sheet](https://docs.google.com/spreadsheets/d/${fakeId}/edit)\n`,
    'docs/b.md': `https://drive.google.com/drive/folders/${fakeId}\n`,
    '.clasp.live.json': JSON.stringify({ scriptId: fakeId, rootDir: 'src' }),
    'docs/c.md': 'https://script.google.com/macros/s/AKfycb' + fakeId + '/exec\n',
  };
  for (const [file, content] of Object.entries(cases)) {
    const dir = plant({ [file]: content });
    try {
      assert.ok(scanRepoForIds(dir).length > 0, file);
    } finally {
      rm(dir);
    }
  }
});

test('REPO-ID the clasp template and ordinary docs pass the scan', () => {
  const dir = plant({
    '.clasp.json.template': JSON.stringify({ scriptId: '<SCRIPT_ID_FOR_THIS_ENVIRONMENT>', rootDir: 'src' }),
    'docs/a.md': 'Set DB_ID and DRIVE_ROOT_ID in Script Properties. Never commit them.\n',
  });
  try {
    assert.deepEqual(scanRepoForIds(dir), []);
  } finally {
    rm(dir);
  }
});

test('REPO-ID .gitignore keeps every environment clasp config, .clasprc.json and .env files out of git', () => {
  const lines = fs.readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf8').split(/\r?\n/).map((l) => l.trim());
  for (const entry of ['.clasp.json', '.clasp.*.json', '.clasprc.json', '.env', '.env.*']) {
    assert.ok(lines.includes(entry), `.gitignore must list ${entry}`);
  }
});

test('REPO-ID no real clasp config or credential file is tracked', { skip: !fs.existsSync(path.join(REPO_ROOT, '.git')) && 'not a git checkout' }, () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: REPO_ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const bad = tracked.filter((f) => /(^|\/)(\.clasp(\.[^/]*)?\.json|\.clasprc\.json|\.env(\.[^/]*)?)$/.test(f));
  assert.deepEqual(bad, []);
});
