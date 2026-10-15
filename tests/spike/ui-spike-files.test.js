'use strict';
// The spike page and its fixture modules (S-01, S-05). Static checks: the page holds no module code and no data.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (...p) => fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'ui', 'spike', ...p), 'utf8');
const page = read('index.html');

test('spike page: carries the throwaway header', () => {
  assert.match(page, /THROWAWAY SPIKE PAGE.*Review at 0-010/);
});

test('spike page: holds no module code or data (modules are fetched on demand)', () => {
  assert.doesNotMatch(page, /TDMS\.ui\.(alpha|beta)\s*=/);
  assert.doesNotMatch(page, /(alpha|beta) view|view not initialised|data-module="(alpha|beta)"/);
  assert.doesNotMatch(page, /@|https?:|[A-Za-z0-9_-]{25,}/);
  assert.doesNotMatch(page, /PropertiesService|SpreadsheetApp|DB_ID/);
});

test('spike page: its only server call is spikeLoadModule', () => {
  const code = page.replace(/<!--[\s\S]*?-->/g, '');
  assert.equal((code.match(/google\.script\.run/g) || []).length, 1);
  assert.match(code, /google\.script\.run\s*\.withSuccessHandler\([\s\S]*?\)\s*\.withFailureHandler\([\s\S]*?\)\s*\.spikeLoadModule\(name\);/);
  assert.deepEqual([...code.matchAll(/\.(tdmsApi|spike[A-Z]\w*)\(/g)].map((m) => m[1]), ['spikeLoadModule']);
});

test('spike page: does nothing at load except attach the button handlers', () => {
  const script = page.match(/<script>([\s\S]*)<\/script>/)[1];
  const tail = script.slice(script.lastIndexOf('};') + 2);
  assert.ok(tail.trim().split('\n').every((l) => /^document\.getElementById\('[a-z-]+'\)\.addEventListener\('click'/.test(l.trim())), tail);
});

test('fixtures: each module is a view, a style and a script in the TDMS.ui namespace, with nothing running at load', () => {
  for (const n of ['alpha', 'beta']) {
    const f = read('modules', n + '.html');
    assert.match(f, new RegExp(`<div data-module="${n}">`));
    assert.match(f, /<style>[\s\S]*<\/style>/);
    assert.match(f, new RegExp(`T\\.ui\\.${n} = \\{\\s*init: function \\(root\\)`));
    assert.doesNotMatch(f, /google\.script\.run|fetch\(|XMLHttpRequest|document\.write|@|https?:/);
    const script = f.match(/<script>([\s\S]*)<\/script>/)[1];
    assert.doesNotThrow(() => new Function(script));
    // the init body must not run when the script is evaluated
    const w = { TDMS: undefined };
    new Function('window', script)(w);
    assert.equal(typeof w.TDMS.ui[n].init, 'function');
  }
});

test('page and report agree on the exact log text', () => {
  const report = fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'spikes', 'S-01-S-05.md'), 'utf8');
  for (const text of ['alpha not loaded', 'already loaded, fetches=', ' ms, method=', 'storage: localStorage=', 'draft stored: id=', 'read: local=']) {
    assert.ok(page.includes(text), 'page: ' + text);
    assert.ok(report.includes(text), 'report: ' + text);
  }
});
