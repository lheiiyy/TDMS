'use strict';
// The thin adapters, run against stand-ins for the Apps Script globals.
const test = require('node:test');
const assert = require('node:assert/strict');

test('mail: reads the remaining daily quota and sends nothing', () => {
  global.MailApp = { getRemainingDailyQuota: () => 42 };
  try {
    const Mail = require('../../src/platform/mail');
    assert.equal(Mail.remainingDailyQuota(), 42);
    assert.deepEqual(Object.keys(Mail), ['remainingDailyQuota']);
  } finally {
    delete global.MailApp;
  }
});

test('clock: now is ISO-8601 UTC and today is yyyy-mm-dd from the script time zone', () => {
  const asked = [];
  global.Session = { getScriptTimeZone: () => 'Asia/Manila' };
  global.Utilities = { formatDate: (d, tz, f) => { asked.push([tz, f]); return '2026-10-10'; } };
  try {
    const Clock = require('../../src/platform/clock');
    assert.match(Clock.now(), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    assert.equal(Clock.today(), '2026-10-10');
    assert.deepEqual(asked, [['Asia/Manila', 'yyyy-MM-dd']]);
  } finally {
    delete global.Session;
    delete global.Utilities;
  }
});

test('ids: returns the platform uuid', () => {
  global.Utilities = { getUuid: () => 'u-1' };
  try {
    assert.equal(require('../../src/platform/ids').uuid(), 'u-1');
  } finally {
    delete global.Utilities;
  }
});
