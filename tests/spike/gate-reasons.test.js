'use strict';
// The spike gate says WHY it refused, with a fixed reason code and, for an unreadable sheet, a coarse error kind.
const test = require('node:test');
const assert = require('node:assert/strict');
const SpikeDiagnostics = require('../../src/spike/diagnostics');
const SpikeLockProbe = require('../../src/spike/lockProbe');
const EnvGuard = require('../../src/core/envGuard');

// Fake values built at run time so this file holds no ID, email or URL literal.
const DB = ['1', 'Fake', 'Db', 'Id', '0123456789', 'abcdefghij'].join('');
const MAIL = ['someone', 'gmail.com'].join('@');
const URL = ['https:/', '/docs.google.com/spreadsheets/d/', DB].join('');

const mk = (over) => Object.assign({
  env: { read: () => ({ env: 'test', dbId: DB }) },
  meta: { readMeta: () => ({ tabFound: true, marker: 'test' }) },
  guard: EnvGuard,
  mail: { remainingDailyQuota: () => 5 },
}, over);
const meta = (fn) => ({ readMeta: fn });
const gate = (over) => SpikeDiagnostics.gate(mk(over));
const throwing = (message) => meta(() => { throw (message instanceof Error || typeof message !== 'string' ? message : new Error(message)); });

test('gate: all clear returns ok with the env and the marker', () => {
  assert.deepEqual(gate(), { ok: true, env: 'test', marker: 'test' });
});

test('gate reason NO_DB_ID: DB_ID missing, or Script Properties unreadable', () => {
  assert.deepEqual(gate({ env: { read: () => ({ env: 'test', dbId: undefined }) } }), { ok: false, reason: 'NO_DB_ID' });
  assert.deepEqual(gate({ env: { read: () => { throw new Error(DB); } } }), { ok: false, reason: 'NO_DB_ID' });
});

test('gate reason SHEET_UNREADABLE: the spreadsheet cannot be opened', () => {
  assert.deepEqual(gate({ meta: throwing('boom') }), { ok: false, reason: 'SHEET_UNREADABLE', error_kind: 'OTHER' });
});

test('gate reason META_TAB_MISSING: no _meta tab', () => {
  assert.deepEqual(gate({ meta: meta(() => ({ tabFound: false, marker: null })) }), { ok: false, reason: 'META_TAB_MISSING' });
});

test('gate reason MARKER_MISSING: the environment row is missing or empty', () => {
  assert.deepEqual(gate({ meta: meta(() => ({ tabFound: true, marker: null })) }), { ok: false, reason: 'MARKER_MISSING' });
});

test('gate reason MARKER_NOT_TEST: any marker other than test', () => {
  for (const marker of ['dev', 'live', 'Test', 'foo']) {
    assert.deepEqual(gate({ meta: meta(() => ({ tabFound: true, marker })) }), { ok: false, reason: 'MARKER_NOT_TEST' }, marker);
  }
});

test('error_kind PERMISSION: permission, authorization or scope in the error text', () => {
  for (const m of ['You do not have permission to call SpreadsheetApp.openById', 'Authorization is required', 'Missing the required SCOPE', 'PERMISSION denied']) {
    assert.equal(gate({ meta: throwing(m) }).error_kind, 'PERMISSION', m);
  }
});

test('error_kind NOT_FOUND: not found or no item in the error text', () => {
  for (const m of ['Requested entity was not found.', 'No item with the given ID could be found', 'NOT FOUND']) {
    assert.equal(gate({ meta: throwing(m) }).error_kind, 'NOT_FOUND', m);
  }
});

test('error_kind OTHER: anything else, including values that are not Errors', () => {
  for (const e of ['Service timed out', new Error(''), 'plain string', undefined, null, 42, { message: 'quota' }]) {
    assert.equal(gate({ meta: throwing(e) }).error_kind, 'OTHER', String(e));
  }
});

test('error_kind: PERMISSION wins when the text matches both', () => {
  assert.equal(gate({ meta: throwing('permission denied: item not found') }).error_kind, 'PERMISSION');
});

test('error_kind is present only for SHEET_UNREADABLE', () => {
  for (const g of [
    gate({ env: { read: () => ({}) } }), gate({ meta: meta(() => ({ tabFound: false })) }),
    gate({ meta: meta(() => ({ tabFound: true, marker: null })) }), gate({ meta: meta(() => ({ tabFound: true, marker: 'dev' })) }),
  ]) assert.equal('error_kind' in g, false, g.reason);
});

test('every spike function returns SPIKE_DISABLED with the reason, and touches no mail or lock', () => {
  const calls = [];
  const lockService = { getScriptLock: () => { calls.push('lock'); return {}; } };
  const base = mk({ meta: throwing('Authorization is required'), mail: { remainingDailyQuota: () => { calls.push('mail'); return 1; } } });
  const d = Object.assign({}, base, { diagnostics: SpikeDiagnostics, lockService, sleep: () => calls.push('sleep') });
  d.gateDeps = d;
  const expected = { ok: false, code: 'SPIKE_DISABLED', reason: 'SHEET_UNREADABLE', error_kind: 'PERMISSION' };
  assert.deepEqual(SpikeDiagnostics.guardReport(d), expected);
  assert.deepEqual(SpikeDiagnostics.quotaReport(d), expected);
  assert.deepEqual(SpikeLockProbe.hold(10, d), expected);
  assert.deepEqual(SpikeLockProbe.tryOnce(d), expected);
  assert.deepEqual(calls, []);
});

test('reasons are the fixed list', () => {
  assert.deepEqual([...SpikeDiagnostics.REASONS], ['NO_DB_ID', 'SHEET_UNREADABLE', 'META_TAB_MISSING', 'MARKER_MISSING', 'MARKER_NOT_TEST']);
});

test('no raw error text, ID, email or URL is returned or logged', () => {
  const logged = [];
  global.Logger = { log: (m) => logged.push(m) };
  try {
    const nasty = `Exception: ${DB} not found at ${URL} for ${MAIL} permission scope`;
    const out = JSON.stringify([
      gate({ meta: throwing(nasty) }),
      SpikeDiagnostics.guardReport(mk({ meta: throwing(nasty) })),
      SpikeDiagnostics.quotaReport(mk({ meta: throwing(new Error(nasty)) })),
      SpikeDiagnostics.guardReport(mk({ env: { read: () => { throw new Error(nasty); } } })),
    ]);
    assert.ok(!out.includes(DB) && !out.includes(MAIL) && !out.includes('google.com'));
    assert.doesNotMatch(out, /@|https?:|[A-Za-z0-9_-]{25,}|Exception/);
    assert.deepEqual(logged, []);
  } finally {
    delete global.Logger;
  }
});
