'use strict';
// THROWAWAY SPIKE CODE (slice 0-006, spikes S-01 and S-05). Review at 0-010: remove it or re-gate it before any live push.
// Server side of the S-01 lazy-load test: returns the static text of one fixture module, only when the _meta marker says 'test'.
const SpikeModules = (function () {
  // The only modules that can be fetched. Anything else is refused, so no other project file can be read through this.
  const ALLOWED = Object.freeze(['alpha', 'beta']);

  // deps: { diagnostics: {gate, refusal}, gateDeps, loadFile(path) -> text }
  function get(name, deps) {
    const g = deps.diagnostics.gate(deps.gateDeps);
    if (!g.ok) return deps.diagnostics.refusal(g);
    if (typeof name !== 'string' || ALLOWED.indexOf(name) === -1) return { ok: false, code: 'SPIKE_UNKNOWN_MODULE' };
    return { ok: true, name: name, html: deps.loadFile('ui/spike/modules/' + name) };
  }

  return Object.freeze({ ALLOWED: ALLOWED, get: get });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SpikeModules;
