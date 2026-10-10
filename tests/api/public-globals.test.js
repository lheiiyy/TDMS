'use strict';
// Every global function in src/ can be called from the browser through google.script.run, unless its name ends in an underscore.
// So the list must stay short and explicit. A new public function fails this test until Leo approves the list.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : p.endsWith('.js') ? [p] : [];
  });
}

test('public globals: only doGet, tdmsApi and the four throwaway spike functions are callable from the browser', () => {
  const names = [];
  for (const f of files(path.join(__dirname, '..', '..', 'src'))) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/^function\s+([A-Za-z0-9_$]+)\s*\(/gm)) names.push(m[1]);
  }
  const callable = names.filter((n) => !n.endsWith('_')).sort();
  assert.deepEqual(callable, ['doGet', 'spikeGuard', 'spikeLockHold', 'spikeLockTry', 'spikeQuotas', 'tdmsApi']);
});

test('public globals: the spike functions are listed for review at 0-010', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'spike', 'functions.js'), 'utf8');
  assert.match(src, /THROWAWAY SPIKE CODE.*Review at 0-010/);
});
