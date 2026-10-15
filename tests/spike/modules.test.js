'use strict';
// Spike S-01, server side: the module fetch is gated, allowlisted and returns static fixture text only.
const test = require('node:test');
const assert = require('node:assert/strict');
const SpikeModules = require('../../src/spike/modules');
const SpikeDiagnostics = require('../../src/spike/diagnostics');
const EnvGuard = require('../../src/core/envGuard');

const DB = ['1', 'Fake', 'Db', 'Id', '0123456789', 'abcdefghij'].join('');

const mk = (marker, loaded) => {
  const d = {
    env: { read: () => ({ env: 'test', dbId: DB }) },
    meta: { readMeta: () => { if (marker instanceof Error) throw marker; return { tabFound: true, marker }; } },
    guard: EnvGuard,
    diagnostics: SpikeDiagnostics,
    loadFile: (path) => { if (loaded) loaded.push(path); return `<div>fixture ${path}</div>`; },
  };
  d.gateDeps = d;
  return d;
};

test('modules: only alpha and beta are on the allowlist', () => {
  assert.deepEqual([...SpikeModules.ALLOWED], ['alpha', 'beta']);
});

test('modules: an allowed name returns its fixture text, loaded from the fixed path', () => {
  const loaded = [];
  assert.deepEqual(SpikeModules.get('alpha', mk('test', loaded)), { ok: true, name: 'alpha', html: '<div>fixture ui/spike/modules/alpha</div>' });
  assert.deepEqual(SpikeModules.get('beta', mk('test', loaded)).name, 'beta');
  assert.deepEqual(loaded, ['ui/spike/modules/alpha', 'ui/spike/modules/beta']);
});

test('modules: any other name is refused and no file is read', () => {
  for (const name of ['gamma', '', 'ALPHA', 'alpha ', '../shell/index', 'ui/shell/index', 'constructor', '__proto__', 'toString', undefined, null, 5, {}, ['alpha']]) {
    const loaded = [];
    assert.deepEqual(SpikeModules.get(name, mk('test', loaded)), { ok: false, code: 'SPIKE_UNKNOWN_MODULE' }, String(name));
    assert.deepEqual(loaded, []);
  }
});

test('modules: refused with the gate reason unless the marker is test, and no file is read', () => {
  for (const [marker, reason] of [['dev', 'MARKER_NOT_TEST'], ['live', 'MARKER_NOT_TEST'], [null, 'MARKER_MISSING']]) {
    const loaded = [];
    assert.deepEqual(SpikeModules.get('alpha', mk(marker, loaded)), { ok: false, code: 'SPIKE_DISABLED', reason });
    assert.deepEqual(loaded, []);
  }
  assert.equal(SpikeModules.get('alpha', mk(new Error('Authorization is required'))).error_kind, 'PERMISSION');
});

test('modules: results hold no ID, email or URL', () => {
  const out = JSON.stringify([SpikeModules.get('alpha', mk('test')), SpikeModules.get('x', mk('test')), SpikeModules.get('alpha', mk(new Error(DB)))]);
  assert.ok(!out.includes(DB));
  assert.doesNotMatch(out, /@|https?:|google\.com/);
});
