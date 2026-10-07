'use strict';
const { defineArc } = require('./lib/harness');
const { arc10 } = require('./lib/checks');

defineArc({
  id: 'ARC-10',
  title: 'no I/O at file load',
  check: arc10,
  violations: {
    'Google service at top level': { 'src/repository/table.js': 'const ss = SpreadsheetApp.getActive();\n' },
    'Google service in an object literal at load': { 'src/platform/cache.js': 'const api = { c: CacheService.getScriptCache() };\n' },
    'fetch at top level': { 'src/core/env.js': "const r = fetch('x');\n" },
  },
  clean: {
    'src/repository/table.js': 'function open() { return SpreadsheetApp.getActive(); }\nconst lazy = () => { return SpreadsheetApp.getActive(); };\nclass T { m() { return SpreadsheetApp.getActive(); } }\n',
  },
});
