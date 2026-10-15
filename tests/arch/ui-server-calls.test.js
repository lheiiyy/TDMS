'use strict';
// UI calls the server only through api.js (CLAUDE.md layers). The one exemption is path-specific: the throwaway spike page folder.
const { defineArc } = require('./lib/harness');
const { uiServerCalls } = require('./lib/checks');

const CALL = 'google.script.run.withSuccessHandler(f).tdmsApi(x);';

defineArc({
  id: 'UI-API',
  title: 'only api.js (and the spike page folder) may call google.script.run',
  check: uiServerCalls,
  violations: {
    'a module view calls the server directly': { 'src/ui/modules/visits/view.html': `<script>${CALL}</script>` },
    'the shell page calls the server directly': { 'src/ui/shell/index.html': `<script>${CALL}</script>` },
    'a different shell file than api.html': { 'src/ui/shell/session.html': `<script>${CALL}</script>` },
    'a lookalike path of the spike folder': { 'src/ui/spikes/index.html': `<script>${CALL}</script>` },
    'a call hidden behind an apostrophe': { 'src/ui/modules/x/view.html': `<p>don't</p><script>${CALL}</script>` },
    'the exemption is not wider than the spike folder': { 'src/ui/spike-old/index.html': `<script>${CALL}</script>` },
  },
  clean: {
    'src/ui/shell/api.html': `<script>${CALL}</script>`,
    'src/ui/spike/index.html': `<script>${CALL}</script>`,
    'src/ui/spike/modules/alpha.html': `<script>${CALL}</script>`,
    'src/ui/shell/index.html': '<script>api.ping();</script>',
    'src/ui/modules/visits/view.html': '<script>api.call("visits.list", {});</script>',
  },
});
