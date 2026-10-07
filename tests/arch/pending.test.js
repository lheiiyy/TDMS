'use strict';
// Named pending architecture checks (ARCHITECTURE §0.6). A later slice replaces each skip with a real check.
const test = require('node:test');

const PENDING = [
  ['ARC-05', 'public globals are exactly doGet and tdmsApi', 'activated by the first slice that adds src/api (PH-1, tdmsApi dispatcher)'],
  ['ARC-06', 'every registry method has a PERM id, a schema and an audit event', 'activated by the method registry slice (PH-1/PH-5)'],
  ['ARC-09', 'no hard-coded configurable value; every CFG id is read through SettingsService', 'activated by the SettingsService slice (PH-3)'],
  ['ARC-11', 'every list method declares a filter whitelist and a sort whitelist', 'activated by the first list method (PH-7)'],
  ['ARC-12', 'every scoped repository read requires a scope argument', 'activated by the repository scope slice (PH-2)'],
];

for (const [id, title, slice] of PENDING) {
  test(`${id} ${title}`, { skip: `pending: ${slice}` }, () => {});
}
