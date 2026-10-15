'use strict';
// THROWAWAY SPIKE CODE (slice 0-005, spikes S-06 and S-08). Review at 0-010: remove it or re-gate it before any live push.
// Every function here refuses unless the _meta marker of the connected spreadsheet says 'test'. No result holds an ID, an email or a URL.
const SpikeDiagnostics = (function () {
  // Why the gate refused. A fixed list of codes only: no raw error text, ID, email or URL is ever returned or logged.
  const REASONS = Object.freeze(['NO_DB_ID', 'SHEET_UNREADABLE', 'META_TAB_MISSING', 'MARKER_MISSING', 'MARKER_NOT_TEST']);

  // Sorts an error from opening the spreadsheet into PERMISSION, NOT_FOUND or OTHER. Only the kind leaves this function.
  function classifyError(err) {
    const text = String(err && err.message !== undefined ? err.message : err).toLowerCase();
    if (/permission|authorization|scope/.test(text)) return 'PERMISSION';
    if (/not found|no item/.test(text)) return 'NOT_FOUND';
    return 'OTHER';
  }

  function refuse(reason, errorKind) {
    return errorKind ? { ok: false, reason: reason, error_kind: errorKind } : { ok: false, reason: reason };
  }

  // The result a spike function returns when the gate refuses.
  function refusal(g) {
    const r = { ok: false, code: 'SPIKE_DISABLED', reason: g.reason };
    if (g.error_kind) r.error_kind = g.error_kind;
    return Object.freeze(r);
  }

  // deps: { env: {read}, meta: {readMeta}, guard: {checkEnvironment, ENVIRONMENTS}, mail: {remainingDailyQuota} }
  // Gate: the spreadsheet's own marker must be 'test'. Never trusts the ENV property, which Leo flips on purpose in the mismatch run.
  // Returns { ok: true, env, marker } or { ok: false, reason[, error_kind] }.
  function gate(deps) {
    let dbId;
    let env;
    try {
      const e = deps.env.read();
      dbId = e.dbId;
      env = e.env;
    } catch (err) {
      return refuse('NO_DB_ID');
    }
    if (!dbId) return refuse('NO_DB_ID');
    let meta;
    try {
      meta = deps.meta.readMeta(dbId);
    } catch (err) {
      return refuse('SHEET_UNREADABLE', classifyError(err));
    }
    if (!meta.tabFound) return refuse('META_TAB_MISSING');
    if (!meta.marker) return refuse('MARKER_MISSING');
    if (meta.marker !== 'test') return refuse('MARKER_NOT_TEST');
    return { ok: true, env: env, marker: meta.marker };
  }

  function guardReport(deps) {
    const g = gate(deps);
    if (!g.ok) return refusal(g);
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
    const g = gate(deps);
    if (!g.ok) return refusal(g);
    return { ok: true, mail_remaining_daily: deps.mail.remainingDailyQuota() };
  }

  return Object.freeze({ REASONS: REASONS, classifyError: classifyError, gate: gate, refusal: refusal, guardReport: guardReport, quotaReport: quotaReport });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SpikeDiagnostics;
