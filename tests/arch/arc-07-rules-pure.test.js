'use strict';
const { defineArc } = require('./lib/harness');
const { arc07 } = require('./lib/checks');

defineArc({
  id: 'ARC-07',
  title: 'rules/ has no adapters, clock, Google services or global state',
  check: arc07,
  violations: {
    'Date.now in a rule': { 'src/rules/sla.js': 'function due() { return Date.now() + 1; }\n' },
    'new Date in a rule': { 'src/rules/sla.js': 'function due() { return new Date(); }\n' },
    'platform import in a rule': { 'src/rules/grade.js': "const clock = require('../platform/clock');\n" },
    'Google service in a rule': { 'src/rules/grade.js': 'function f() { return CacheService.getScriptCache(); }\n' },
    'module-level state in a rule': { 'src/rules/grade.js': 'let counter = 0;\nfunction next() { return counter; }\n' },
  },
  clean: {
    'src/rules/grade.js': 'const PASS = 85;\nfunction grade(score, passMark) { let r = score >= passMark; return r; }\n',
    'src/services/VisitService.js': 'function today() { return new Date(); }\n',
  },
});
