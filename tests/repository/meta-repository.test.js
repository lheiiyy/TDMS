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

test('meta readMeta: tells a missing tab from a missing row or an empty value', () => {
  assert.deepEqual(MetaRepository.readMeta('db', app([['key', 'value'], ['environment', 'test']])), { tabFound: true, marker: 'test' });
  assert.deepEqual(MetaRepository.readMeta('db', app(null)), { tabFound: false, marker: null });
  assert.deepEqual(MetaRepository.readMeta('db', app([['key', 'value']])), { tabFound: true, marker: null });
  assert.deepEqual(MetaRepository.readMeta('db', app([['environment', '']])), { tabFound: true, marker: null });
});

test('meta readMeta: an unreadable spreadsheet throws', () => {
  assert.throws(() => MetaRepository.readMeta('db', { openById: () => { throw new Error('no access'); } }));
});
