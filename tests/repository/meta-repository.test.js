'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const MetaRepository = require('../../src/repository/MetaRepository');

const app = (rows, opened) => ({
  openById: (id) => {
    if (opened) opened.push(id);
    return { getSheetByName: (name) => (name === '_meta' && rows ? { getDataRange: () => ({ getValues: () => rows }) } : null) };
  },
});

test('meta: returns the environment marker', () => {
  const opened = [];
  assert.equal(MetaRepository.readEnvironmentMarker('db', app([['key', 'value'], ['environment', 'test']], opened)), 'test');
  assert.deepEqual(opened, ['db']);
});

test('meta: no _meta tab, no environment row or an empty value gives null', () => {
  assert.equal(MetaRepository.readEnvironmentMarker('db', app(null)), null);
  assert.equal(MetaRepository.readEnvironmentMarker('db', app([['key', 'value']])), null);
  assert.equal(MetaRepository.readEnvironmentMarker('db', app([['environment', '']])), null);
});

test('meta: an unreadable spreadsheet throws (the caller maps it to a guard code)', () => {
  const broken = { openById: () => { throw new Error('no access'); } };
  assert.throws(() => MetaRepository.readEnvironmentMarker('db', broken));
});
