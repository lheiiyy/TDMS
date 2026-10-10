'use strict';
// THROWAWAY SPIKE CODE (slice 0-005, spikes S-06 and S-08). Review at 0-010: remove it or re-gate it before any live push.
// Every function here refuses unless the _meta marker of the connected spreadsheet says 'test'. No result holds an ID, an email or a URL.
const SpikeDiagnostics = (function () {
  const DISABLED = Object.freeze({ ok: false, code: 'SPIKE_DISABLED' });

  // deps: { env: {read}, meta: {readEnvironmentMarker}, guard: {checkEnvironment, ENVIRONMENTS}, mail: {remainingDailyQuota} }
  // Gate: the spreadsheet's own marker must be 'test'. Never trusts the ENV property, which Leo flips on purpose in the mismatch run.
  function gate(deps) {
    try {
      const e = deps.env.read();
      if (!e.dbId) return null;
      const marker = deps.meta.readEnvironmentMarker(e.dbId);
      return marker === 'test' ? { env: e.env, marker: marker } : null;
    } catch (err) {
      return null;
    }
  }

  function guardReport(deps) {
    const g = gate(deps);
    if (!g) return DISABLED;
    const r = deps.guard.checkEnvironment({ env: g.env, marker: g.marker });
    return {
      ok: true,
      guard_passed: r.ok,
      guard: r.ok ? 'OK' : r.guard,
      writes_allowed: r.writesAllowed,
      env_property: deps.guard.ENVIRONMENTS.indexOf(g.env) === -1 ? null : g.env,
      marker: g.marker,
    };
  }

  function quotaReport(deps) {
    if (!gate(deps)) return DISABLED;
    return { ok: true, mail_remaining_daily: deps.mail.remainingDailyQuota() };
  }

  return Object.freeze({ gate: gate, guardReport: guardReport, quotaReport: quotaReport, DISABLED: DISABLED });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SpikeDiagnostics;
