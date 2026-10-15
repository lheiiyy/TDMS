'use strict';
// THROWAWAY SPIKE CODE (slice 0-006, spikes S-01 and S-05). Review at 0-010: remove it or re-gate it before any live push.
// Chooses which page doGet serves. The default is always the shell; only ?page=spike opens the spike page.
const SpikePage = (function () {
  function pick(e) {
    return e && e.parameter && e.parameter.page === 'spike' ? 'spike' : 'shell';
  }
  return Object.freeze({ pick: pick });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SpikePage;
