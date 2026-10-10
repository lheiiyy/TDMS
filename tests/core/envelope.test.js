'use strict';
// API-CONTRACT §2: request validation and response shapes. Pure logic.
const test = require('node:test');
const assert = require('node:assert/strict');
const Envelope = require('../../src/core/envelope');

const RID = '123e4567-e89b-42d3-a456-426614174000';
const good = () => ({ v: 1, build: 'b1', rid: RID, method: 'system.ping', params: {} });
const paths = (r) => r.fields.map((f) => f.path).sort();

test('envelope: a minimal valid request passes and is returned unchanged', () => {
  const r = Envelope.validateRequest(good());
  assert.equal(r.ok, true);
  assert.deepEqual(r.value, good());
});

test('envelope: optional token, client_ref and reason are accepted', () => {
  const req = Object.assign(good(), { token: 't', client_ref: RID, reason: 'because' });
  assert.equal(Envelope.validateRequest(req).ok, true);
});

test('envelope: every required field is reported when missing', () => {
  for (const f of ['v', 'build', 'rid', 'method', 'params']) {
    const req = good();
    delete req[f];
    const r = Envelope.validateRequest(req);
    assert.equal(r.ok, false, f);
    assert.deepEqual(paths(r), [f]);
  }
});

test('envelope: wrong types and values are refused', () => {
  const bad = [
    ['v', 2], ['v', '1'], ['build', ''], ['build', 5], ['rid', 'not-a-uuid'], ['rid', 7],
    ['method', 'ping'], ['method', 'System.ping'], ['method', 'system.'], ['method', 42],
    ['params', null], ['params', []], ['params', 'x'], ['token', 5], ['client_ref', 'nope'], ['reason', {}],
  ];
  for (const [f, value] of bad) {
    const r = Envelope.validateRequest(Object.assign(good(), { [f]: value }));
    assert.equal(r.ok, false, `${f}=${JSON.stringify(value)}`);
    assert.ok(paths(r).includes(f), f);
  }
});

test('envelope: unknown top-level fields are rejected', () => {
  const r = Envelope.validateRequest(Object.assign(good(), { extra: 1 }));
  assert.equal(r.ok, false);
  assert.deepEqual(r.fields, [{ path: 'extra', code: 'UNKNOWN_FIELD', message: 'Unknown field.' }]);
});

test('envelope: a request that is not an object is refused', () => {
  for (const v of [null, undefined, 'x', 5, [], true]) {
    const r = Envelope.validateRequest(v);
    assert.equal(r.ok, false);
    assert.deepEqual(paths(r), ['$']);
  }
});

const ctx = { rid: RID, requestId: 'req-1', serverTime: '2026-10-10T00:00:00.000Z', serverDate: '2026-10-10', build: 'b1' };

test('envelope: success carries ok, data and the §2.2 meta fields', () => {
  assert.deepEqual(Envelope.success({ a: 1 }, ctx), {
    ok: true,
    data: { a: 1 },
    meta: { request_id: 'req-1', rid: RID, server_time: ctx.serverTime, server_date: '2026-10-10', api_version: 1, build: 'b1' },
  });
});

test('envelope: failure carries the code, the message and the same meta; fields only when given', () => {
  const f = Envelope.failure('VALIDATION', 'Bad request.', ctx, { fields: [{ path: 'v', code: 'X', message: 'm' }] });
  assert.equal(f.ok, false);
  assert.equal(f.error.code, 'VALIDATION');
  assert.equal(f.error.message, 'Bad request.');
  assert.deepEqual(f.error.fields, [{ path: 'v', code: 'X', message: 'm' }]);
  assert.equal(f.meta.request_id, 'req-1');
  assert.equal('fields' in Envelope.failure('NOT_FOUND', 'Unknown method.', ctx), false);
});

test('envelope: an unknown error code becomes SERVER, and a missing rid is echoed as null', () => {
  const f = Envelope.failure('SOMETHING_ELSE', 'x', Object.assign({}, ctx, { rid: undefined }));
  assert.equal(f.error.code, 'SERVER');
  assert.equal(f.meta.rid, null);
});

test('envelope: the error code list is the API-CONTRACT §4 list', () => {
  assert.deepEqual([...Envelope.ERROR_CODES].sort(), [
    'AUTH_FAILED', 'AUTH_LOCKED', 'AUTH_REQUIRED', 'BLOCKED_BY_RULE', 'BUSY', 'CLIENT_OUTDATED', 'CONFIG_MISSING', 'CONFLICT',
    'EXTERNAL', 'FORBIDDEN', 'LOCKED', 'NOT_FOUND', 'NOT_IN_SCOPE', 'QUOTA', 'SERVER', 'SESSION_EXPIRED', 'VALIDATION',
  ]);
});

test('envelope: responses hold no stack trace or Google URL', () => {
  const text = JSON.stringify([Envelope.success({}, ctx), Envelope.failure('SERVER', 'Unexpected error.', ctx)]);
  assert.doesNotMatch(text, /stack|\bat \w+.*\(|google\.com/i);
});
