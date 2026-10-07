'use strict';
const { defineArc } = require('./lib/harness');
const { arc02 } = require('./lib/checks');

defineArc({
  id: 'ARC-02',
  title: 'DriveApp only in FileStore and Backup adapters',
  check: arc02,
  violations: {
    'DriveApp in a service': { 'src/services/LibraryService.js': 'function f() { DriveApp.getFolderById(x); }\n' },
    'DriveApp in the Mail adapter': { 'src/platform/mail.js': 'DriveApp.getRootFolder();\n' },
  },
  clean: {
    'src/platform/filestore.js': 'function save() { DriveApp.createFile(b); }\n',
    'src/platform/backup.js': 'function copy() { DriveApp.getFileById(x); }\n',
  },
});
