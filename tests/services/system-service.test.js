'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const SystemService = require('../../src/services/SystemService');

test('system.ping returns ok, the organisation date, build and min_build and nothing else', () => {
  const deps = { clock: { today: () => '2026-10-10' }, build: 'b1', minBuild: 'b0' };
  assert.deepEqual(SystemService.ping({}, deps), { ok: true, server_date: '2026-10-10', build: 'b1', min_build: 'b0' });
});
