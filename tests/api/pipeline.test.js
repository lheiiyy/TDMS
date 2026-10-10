'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Pipeline = require('../../src/api/pipeline');
const Envelope = require('../../src/core/envelope');
const SystemService = require('../../src/services/SystemService');

const RID = '123e4567-e89b-42d3-a456-426614174000';
const deps = (over) => Object.assign({
  envelope: Envelope,
  clock: { now: () => '2026-10-10T01:00:00.000Z', today: () => '2026-10-10' },
  ids: { uuid: () => 'srv-1' },
  services: { system: SystemService },
  build: 'b1',
  minBuild: 'b1',
}, over);
const req = (over) => Object.assign({ v: 1, build: 'b1', rid: RID, method: 'system.ping', params: {} }, over);

test('pipeline: the registry exposes only system.ping', () => {
  assert.deepEqual(Pipeline.methodNames(), ['system.ping']);
});

test('pipeline: any other method is NOT_FOUND, including inherited object names', () => {
  for (const m of ['spike.guard', 'system.ping2', 'auth.signIn', 'constructor.name', 'toString.call']) {
    const r = Pipeline.handle(req({ method: m }), deps());
    assert.equal(r.ok, false, m);
    assert.equal(r.error.code, 'NOT_FOUND', m);
  }
});

test('pipeline: system.ping echoes the rid and returns the contract data without a token', () => {
  const r = Pipeline.handle(req(), deps());
  assert.deepEqual(r, {
    ok: true,
    data: { ok: true, server_date: '2026-10-10', build: 'b1', min_build: 'b1' },
    meta: { request_id: 'srv-1', rid: RID, server_time: '2026-10-10T01:00:00.000Z', server_date: '2026-10-10', api_version: 1, build: 'b1' },
  });
});

test('pipeline: a bad envelope is VALIDATION with the field list', () => {
  const r = Pipeline.handle({ v: 1 }, deps());
  assert.equal(r.error.code, 'VALIDATION');
  assert.ok(r.error.fields.length >= 4);
});

test('pipeline: unknown params are VALIDATION', () => {
  const r = Pipeline.handle(req({ params: { x: 1 } }), deps());
  assert.equal(r.error.code, 'VALIDATION');
  assert.deepEqual(r.error.fields, [{ path: 'params.x', code: 'UNKNOWN_FIELD', message: 'Unknown field.' }]);
});

test('pipeline: a throwing service gives SERVER with no detail; the clock failing still returns a response', () => {
  const boom = { system: { ping: () => { throw new Error('secret internal detail'); } } };
  const r = Pipeline.handle(req(), deps({ services: boom }));
  assert.equal(r.error.code, 'SERVER');
  assert.doesNotMatch(JSON.stringify(r), /secret|internal/);
  const dead = () => { throw new Error('x'); };
  const r2 = Pipeline.handle(req(), deps({ clock: { now: dead, today: dead } }));
  assert.equal(r2.ok, false);
  assert.equal(r2.meta.request_id, 'unavailable');
});

test('pipeline: non-object input never throws', () => {
  for (const v of [null, undefined, 'x', 5]) assert.equal(Pipeline.handle(v, deps()).error.code, 'VALIDATION');
});
