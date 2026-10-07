'use strict';
const { defineArc } = require('./lib/harness');
const { arc08 } = require('./lib/checks');

// Convention until PH-2 fixes the ownership map: <Name>Service.js uses only repository modules named <Name>*.
defineArc({
  id: 'ARC-08',
  title: 'a service uses only its own repository',
  check: arc08,
  violations: {
    "namespace of another service's repository": { 'src/services/VisitService.js': 'function f() { return CaparRepository.find(id); }\n' },
    "import of another service's repository module": { 'src/services/TlService.js': "const r = require('../repository/trainee');\n" },
  },
  clean: {
    'src/services/VisitService.js': 'function f() { return VisitRepository.find(id); }\n',
    'src/services/CaparService.js': "const r = require('../repository/capar');\nfunction f() { return CaparRepository.find(id); }\n",
  },
});
