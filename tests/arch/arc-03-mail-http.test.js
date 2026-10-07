'use strict';
const { defineArc } = require('./lib/harness');
const { arc03 } = require('./lib/checks');

defineArc({
  id: 'ARC-03',
  title: 'MailApp/GmailApp only in Mail; UrlFetchApp only in Http',
  check: arc03,
  violations: {
    'MailApp in a service': { 'src/services/NotificationService.js': 'function f() { MailApp.sendEmail(a, b, c); }\n' },
    'GmailApp in core': { 'src/core/errors.js': 'function f() { GmailApp.sendEmail(a, b, c); }\n' },
    'UrlFetchApp in a service': { 'src/services/ReportService.js': 'function f() { UrlFetchApp.fetch(u); }\n' },
  },
  clean: {
    'src/platform/mail.js': 'function send() { MailApp.sendEmail(a, b, c); }\n',
    'src/platform/http.js': 'function get(u) { return UrlFetchApp.fetch(u); }\n',
  },
});
