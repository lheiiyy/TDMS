'use strict';
// System service. system.ping only for now (API-CONTRACT §5): no data, no token.
const SystemService = (function () {
  // deps: { build, minBuild }. Returns the method's DTO.
  function ping(params, deps) {
    return { ok: true, server_date: deps.clock.today(), build: deps.build, min_build: deps.minBuild };
  }
  return Object.freeze({ ping: ping });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SystemService;
