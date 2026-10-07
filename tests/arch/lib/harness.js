'use strict';
// Registers three tests per active ARC check: the real tree passes, a planted violation fails,
// and a clean tree passes. Violations are planted in a temporary folder, never in the repository.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { format } = require('./scan');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

function plant(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tdms-arc-'));
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
  return dir;
}

function defineArc({ id, title, check, violations, clean }) {
  test(`${id} ${title}: repository tree is clean`, () => {
    const v = check(REPO_ROOT);
    assert.equal(v.length, 0, `\n${format(v)}`);
  });
  for (const [name, files] of Object.entries(violations)) {
    test(`${id} fails when planted: ${name}`, () => {
      const dir = plant(files);
      try {
        const v = check(dir);
        assert.ok(v.length > 0, 'expected the check to report the planted violation');
        assert.ok(v.every((x) => x.rule === id), 'violations must carry the check id');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  }
  test(`${id} passes on a clean fixture tree`, () => {
    const dir = plant(clean);
    try {
      const v = check(dir);
      assert.equal(v.length, 0, `\n${format(v)}`);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}

module.exports = { defineArc, plant, REPO_ROOT };
