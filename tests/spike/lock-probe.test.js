'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const SpikeLockProbe = require('../../src/spike/lockProbe');
const SpikeDiagnostics = require('../../src/spike/diagnostics');
const EnvGuard = require('../../src/core/envGuard');

const gateDeps = (marker) => ({
  env: { read: () => ({ env: 'test', dbId: 'x' }) },
  meta: { readEnvironmentMarker: () => marker },
  guard: EnvGuard,
});
const mk = (opts) => {
  const o = Object.assign({ marker: 'test', free: true }, opts);
  const log = [];
  const lock = { tryLock: (ms) => { log.push(['tryLock', ms]); return o.free; }, releaseLock: () => log.push(['release']) };
  const d = { diagnostics: SpikeDiagnostics, lockService: { getScriptLock: () => lock }, sleep: (ms) => log.push(['sleep', ms]) };
  d.gateDeps = gateDeps(o.marker);
  return { d, log };
};

test('lock probe: the cap is 10 seconds', () => {
  assert.equal(SpikeLockProbe.MAX_HOLD_SECONDS, 10);
});

test('lock probe: hold never sleeps longer than 10 seconds, whatever is asked', () => {
  for (const asked of [10, 11, 999, Infinity, '60']) {
    const { d, log } = mk();
    const r = SpikeLockProbe.hold(asked, d);
    assert.deepEqual(r, { ok: true, acquired: true, held_seconds: 10 });
    assert.deepEqual(log.filter((x) => x[0] === 'sleep'), [['sleep', 10000]]);
  }
});

test('lock probe: small, negative and non-numeric holds are clamped; the lock is always released', () => {
  const { d, log } = mk();
  assert.equal(SpikeLockProbe.hold(3, d).held_seconds, 3);
  assert.equal(SpikeLockProbe.hold(-5, d).held_seconds, 0);
  assert.equal(SpikeLockProbe.hold('abc', d).held_seconds, 0);
  assert.equal(log.filter((x) => x[0] === 'release').length, 3);
});

test('lock probe: the lock is released even if sleeping fails', () => {
  const { d, log } = mk();
  d.sleep = () => { throw new Error('x'); };
  assert.throws(() => SpikeLockProbe.hold(5, d));
  assert.deepEqual(log.filter((x) => x[0] === 'release').length, 1);
});

test('lock probe: a busy lock is reported, not waited for beyond 1 second, and never released by this call', () => {
  const { d, log } = mk({ free: false });
  assert.deepEqual(SpikeLockProbe.hold(10, d), { ok: true, acquired: false });
  assert.deepEqual(log, [['tryLock', 1000]]);
});

test('lock probe: tryOnce does not wait and lets the lock go', () => {
  const free = mk();
  assert.deepEqual(SpikeLockProbe.tryOnce(free.d), { ok: true, acquired: true });
  assert.deepEqual(free.log, [['tryLock', 0], ['release']]);
  const busy = mk({ free: false });
  assert.deepEqual(SpikeLockProbe.tryOnce(busy.d), { ok: true, acquired: false });
  assert.deepEqual(busy.log, [['tryLock', 0]]);
});

test('lock probe: refuses and never touches the lock unless the marker is test', () => {
  for (const marker of ['dev', 'live', null]) {
    const { d, log } = mk({ marker });
    assert.deepEqual(SpikeLockProbe.hold(10, d), { ok: false, code: 'SPIKE_DISABLED' });
    assert.deepEqual(SpikeLockProbe.tryOnce(d), { ok: false, code: 'SPIKE_DISABLED' });
    assert.deepEqual(log, []);
  }
});
