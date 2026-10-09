'use strict';
const { defineArc } = require('./lib/harness');
const { arc13 } = require('./lib/checks');

// Addresses are built at run time so this file holds no email literal itself.
const addr = (user, host) => [user, host].join('@');

defineArc({
  id: 'ARC-13',
  title: 'no email address literal in src, tests, tools or config',
  check: arc13,
  violations: {
    'address in a service': { 'src/services/NotificationService.js': `const FROM = '${addr('someone', 'gmail.com')}';\n` },
    'address in a test': { 'tests/core/mail.test.js': `const to = "${addr('officer', 'company.ph')}";\n` },
    'address in a tool': { 'tools/notify.js': `// send to ${addr('lead', 'gmail.com')}\n` },
    'address in a config seed': { 'config/seed/settings.json': JSON.stringify({ CFG_107: addr('editor', 'gmail.com') }) },
  },
  clean: {
    'src/core/settings.js': 'function get(key) { return key; }\n',
    'tests/core/mail.test.js': `const to = '${addr('officer', 'example.com')}';\nconst bad = '${addr('x', 'mail.invalid')}';\n`,
    'config/seed/settings.json': JSON.stringify({ CFG_107: '' }),
    'docs/note.md': `The interim owner is ${addr('someone', 'gmail.com')}.\n`,
  },
});
