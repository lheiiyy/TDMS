'use strict';
// PLAT-001: the test runner works with no third-party dependency.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('PLAT-001 package.json declares no dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  for (const k of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    assert.equal(Object.keys(pkg[k] || {}).length, 0, `${k} must be empty`);
  }
  assert.match(pkg.scripts.test, /node --test/);
});

test('PLAT-001 no node_modules is needed to run the suite', () => {
  assert.equal(fs.existsSync(path.join(__dirname, '..', 'node_modules')), false);
});
