'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Env = require('../../src/core/env');

const props = (o) => ({ getProperty: (k) => (k in o ? o[k] : null) });

test('env: reads ENV and DB_ID from the properties', () => {
  assert.deepEqual(Env.read(props({ ENV: 'test', DB_ID: 'x' })), { env: 'test', dbId: 'x' });
});

test('env: a missing or empty property is undefined', () => {
  assert.deepEqual(Env.read(props({ ENV: '' })), { env: undefined, dbId: undefined });
});
