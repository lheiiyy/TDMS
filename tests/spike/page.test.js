'use strict';
// Spike hook in doGet: the default stays the shell; only ?page=spike opens the spike page.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const SpikePage = require('../../src/spike/page');

test('page: the default is the shell for every input except page=spike', () => {
  for (const e of [undefined, null, {}, { parameter: {} }, { parameter: { page: '' } }, { parameter: { page: 'shell' } }, { parameter: { page: 'SPIKE' } },
    { parameter: { page: 'spike ' } }, { parameter: { page: ['spike'] } }, { parameter: { other: 'spike' } }, { page: 'spike' }, 'spike']) {
    assert.equal(SpikePage.pick(e), 'shell', JSON.stringify(e));
  }
});

test('page: page=spike opens the spike page', () => {
  assert.equal(SpikePage.pick({ parameter: { page: 'spike' } }), 'spike');
});

test('doGet: serves the shell by default and only these two pages', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'api', 'entry.js'), 'utf8');
  assert.match(src, /SpikePage\.pick\(e\) === 'spike' \? 'ui\/spike\/index' : 'ui\/shell\/index'/);
  const pages = [...src.matchAll(/'ui\/[a-z]+\/index'/g)].map((m) => m[0]).sort();
  assert.deepEqual(pages, ["'ui/shell/index'", "'ui/spike/index'"]);
});
