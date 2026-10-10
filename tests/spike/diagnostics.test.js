'use strict';
// Spike S-08 guard report and S-06 quota report, run in Node with fakes.
const test = require('node:test');
const assert = require('node:assert/strict');
const SpikeDiagnostics = require('../../src/spike/diagnostics');
const EnvGuard = require('../../src/core/envGuard');

// Fake ID shaped like a spreadsheet ID, built at run time.
const DB = ['1', 'Fake', 'Db', 'Id', '0123456789', 'abcdefghij'].join('');

const mk = (env, marker, calls) => ({
  env: { read: () => ({ env, dbId: DB }) },
  meta: { readEnvironmentMarker: () => { if (marker instanceof Error) throw marker; return marker; } },
  guard: EnvGuard,
  mail: { remainingDailyQuota: () => { if (calls) calls.push('mail'); return 87; } },
});

test('spike guard: ENV test with marker test passes', () => {
  assert.deepEqual(SpikeDiagnostics.guardReport(mk('test', 'test')),
    { ok: true, guard_passed: true, guard: 'OK', writes_allowed: true, env_property: 'test', marker: 'test' });
});

test('spike guard: ENV dev with marker test is a mismatch and writes are refused', () => {
  const r = SpikeDiagnostics.guardReport(mk('dev', 'test'));
  assert.equal(r.guard_passed, false);
  assert.equal(r.guard, 'ENV_MISMATCH');
  assert.equal(r.writes_allowed, false);
});

test('spike guard: a missing or invalid ENV is reported by its guard code, and an odd value is not echoed', () => {
  assert.equal(SpikeDiagnostics.guardReport(mk(undefined, 'test')).guard, 'ENV_MISSING');
  const r = SpikeDiagnostics.guardReport(mk('not-an-env', 'test'));
  assert.equal(r.guard, 'ENV_INVALID');
  assert.equal(r.env_property, null);
});

test('spike gate: refuses unless the sheet marker is test (dev, live, missing, unreadable)', () => {
  for (const marker of ['dev', 'live', null, new Error('no access')]) {
    assert.deepEqual(SpikeDiagnostics.guardReport(mk('test', marker)), { ok: false, code: 'SPIKE_DISABLED' });
  }
  const noDb = mk('test', 'test');
  noDb.env = { read: () => ({ env: 'test', dbId: undefined }) };
  assert.deepEqual(SpikeDiagnostics.guardReport(noDb), { ok: false, code: 'SPIKE_DISABLED' });
});

test('spike quota: returns the remaining daily mail quota only when the gate passes', () => {
  const calls = [];
  assert.deepEqual(SpikeDiagnostics.quotaReport(mk('test', 'test', calls)), { ok: true, mail_remaining_daily: 87 });
  assert.deepEqual(SpikeDiagnostics.quotaReport(mk('live', 'live', calls)), { ok: false, code: 'SPIKE_DISABLED' });
  assert.deepEqual(calls, ['mail']);
});

test('spike results hold no ID, email or URL', () => {
  const all = JSON.stringify([
    SpikeDiagnostics.guardReport(mk('test', 'test')), SpikeDiagnostics.guardReport(mk('dev', 'test')),
    SpikeDiagnostics.quotaReport(mk('test', 'test')), SpikeDiagnostics.guardReport(mk('test', 'live')),
  ]);
  assert.ok(!all.includes(DB));
  assert.doesNotMatch(all, /@|https?:|google\.com|[A-Za-z0-9_-]{25,}/);
});
