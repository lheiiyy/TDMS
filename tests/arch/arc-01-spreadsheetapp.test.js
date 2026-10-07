'use strict';
const { defineArc } = require('./lib/harness');
const { arc01 } = require('./lib/checks');

defineArc({
  id: 'ARC-01',
  title: 'SpreadsheetApp only under repository/',
  check: arc01,
  violations: {
    'SpreadsheetApp in a service': { 'src/services/VisitService.js': 'function f() { return SpreadsheetApp.getActive(); }\n' },
    'SpreadsheetApp in a platform adapter': { 'src/platform/clock.js': 'const s = SpreadsheetApp;\n' },
  },
  clean: {
    'src/repository/table.js': 'function open() { return SpreadsheetApp.openById(id); }\n',
    'src/services/VisitService.js': '// SpreadsheetApp is only named in this comment\nconst note = "SpreadsheetApp";\n',
  },
});
