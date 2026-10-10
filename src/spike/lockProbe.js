'use strict';
// THROWAWAY SPIKE CODE (slice 0-005, spikes S-06 and S-08). Review at 0-010: remove it or re-gate it before any live push.
// Every function here refuses unless the _meta marker of the connected spreadsheet says 'test'. No result holds an ID, an email or a URL.
// Shows how the script lock behaves when two executions meet (spike S-08). The full 20-writer test is S-07, a later slice.
const SpikeLockProbe = (function () {
  const MAX_HOLD_SECONDS = 10;

  // deps: { diagnostics: {gate}, gateDeps, lockService, sleep(ms) }
  // Holds the script lock for min(seconds, 10) seconds. Waits at most 1 second to get it.
  function hold(seconds, deps) {
    if (!deps.diagnostics.gate(deps.gateDeps)) return deps.diagnostics.DISABLED;
    const s = Math.min(MAX_HOLD_SECONDS, Math.max(0, Number(seconds) || 0));
    const lock = deps.lockService.getScriptLock();
    if (!lock.tryLock(1000)) return { ok: true, acquired: false };
    try {
      deps.sleep(s * 1000);
    } finally {
      lock.releaseLock();
    }
    return { ok: true, acquired: true, held_seconds: s };
  }

  // Tries the script lock once without waiting and lets it go at once.
  function tryOnce(deps) {
    if (!deps.diagnostics.gate(deps.gateDeps)) return deps.diagnostics.DISABLED;
    const lock = deps.lockService.getScriptLock();
    const got = lock.tryLock(0);
    if (got) lock.releaseLock();
    return { ok: true, acquired: got };
  }

  return Object.freeze({ MAX_HOLD_SECONDS: MAX_HOLD_SECONDS, hold: hold, tryOnce: tryOnce });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SpikeLockProbe;
