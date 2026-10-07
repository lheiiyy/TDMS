'use strict';
const { defineArc } = require('./lib/harness');
const { arc04 } = require('./lib/checks');

// Fake, clearly non-real values shaped like Google IDs, built at run time so this file holds no ID-like literal.
const fakeId = ['1', 'AbCdEfGhIjKlMnOpQrStUvWxYz', '0123456789'].join('');

defineArc({
  id: 'ARC-04',
  title: 'PropertiesService only in core/env; no ID or secret literals',
  check: arc04,
  violations: {
    'PropertiesService in a service': { 'src/services/AuthService.js': 'function f() { PropertiesService.getScriptProperties(); }\n' },
    'spreadsheet ID literal': { 'src/repository/table.js': `const SHEET = "${fakeId}";\nfunction f() {}\n` },
    'Drive folder URL with ID': { 'src/platform/filestore.js': `const U = 'https://drive.google.com/drive/folders/${fakeId}';\n` },
    'hard-coded secret': { 'src/core/ids.js': 'const password = "hunter2hunter2";\n' },
  },
  clean: {
    'src/core/env.js': 'function get(k) { return PropertiesService.getScriptProperties().getProperty(k); }\n',
    'src/repository/table.js': 'const NAME = "visit_plans";\nconst KEY = "SPREADSHEET_ID";\n',
  },
});
