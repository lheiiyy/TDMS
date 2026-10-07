'use strict';
// PLAT: environment guard (ARCHITECTURE §16.3). Pure logic; no Google service is touched.
const test = require('node:test');
const assert = require('node:assert/strict');
const EnvGuard = require('../../src/core/envGuard');

const fail = (guard) => ({ ok: false, code: 'SERVER', guard, writesAllowed: false });

test('guard: matching ENV and marker pass for every environment', () => {
  for (const env of ['dev', 'test', 'live']) {
    assert.deepEqual(EnvGuard.checkEnvironment({ env, marker: env }), { ok: true, env, writesAllowed: true });
  }
});

test('guard: every mismatching pair is refused', () => {
  for (const env of EnvGuard.ENVIRONMENTS) {
    for (const marker of EnvGuard.ENVIRONMENTS) {
      if (env === marker) continue;
      assert.deepEqual(EnvGuard.checkEnvironment({ env, marker }), fail('ENV_MISMATCH'), `${env} vs ${marker}`);
    }
  }
});

test('guard: dev code pointed at a live marker (and the reverse) is refused', () => {
  assert.equal(EnvGuard.checkEnvironment({ env: 'dev', marker: 'live' }).guard, 'ENV_MISMATCH');
  assert.equal(EnvGuard.checkEnvironment({ env: 'live', marker: 'dev' }).guard, 'ENV_MISMATCH');
});

test('guard: missing ENV is refused', () => {
  for (const env of [undefined, null, '']) {
    assert.deepEqual(EnvGuard.checkEnvironment({ env, marker: 'dev' }), fail('ENV_MISSING'));
  }
  assert.deepEqual(EnvGuard.checkEnvironment({}), fail('ENV_MISSING'));
  assert.deepEqual(EnvGuard.checkEnvironment(undefined), fail('ENV_MISSING'));
});

test('guard: ENV outside dev|test|live is refused, exact match only', () => {
  for (const env of ['prod', 'Dev', 'DEV', ' dev', 'dev ', 'development', 5, true]) {
    assert.deepEqual(EnvGuard.checkEnvironment({ env, marker: 'dev' }), fail('ENV_INVALID'), String(env));
  }
});

test('guard: missing marker is refused', () => {
  for (const marker of [undefined, null, '']) {
    assert.deepEqual(EnvGuard.checkEnvironment({ env: 'dev', marker }), fail('MARKER_MISSING'));
  }
});

test('guard: a marker that differs only by case or spaces does not match', () => {
  for (const marker of ['Dev', 'dev ', ' dev', 'DEV']) {
    assert.deepEqual(EnvGuard.checkEnvironment({ env: 'dev', marker }), fail('ENV_MISMATCH'), JSON.stringify(marker));
  }
});

test('guard: a refusal never allows writes and carries no environment values', () => {
  const r = EnvGuard.checkEnvironment({ env: 'dev', marker: 'live' });
  assert.equal(r.writesAllowed, false);
  assert.deepEqual(Object.keys(r).sort(), ['code', 'guard', 'ok', 'writesAllowed']);
});

test('guard: the environment list is fixed', () => {
  assert.deepEqual([...EnvGuard.ENVIRONMENTS], ['dev', 'test', 'live']);
  assert.throws(() => { EnvGuard.ENVIRONMENTS.push('prod'); }, TypeError);
});
