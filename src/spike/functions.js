'use strict';
// THROWAWAY SPIKE CODE (slice 0-005, spikes S-06 and S-08). Review at 0-010: remove it or re-gate it before any live push.
// Every function here refuses unless the _meta marker of the connected spreadsheet says 'test'. No result holds an ID, an email or a URL.
// The four spike functions. Run them from the Apps Script editor (Run). Like every global function they can also be called through
// google.script.run by anyone who can load the web app, so each one is gated and returns no ID, email or URL.
// The helper below ends in an underscore, so the browser cannot call it.
function spikeDeps_() {
  return {
    env: Env,
    meta: MetaRepository,
    guard: EnvGuard,
    mail: Mail,
    diagnostics: SpikeDiagnostics,
    lockService: LockService,
    sleep: Utilities.sleep,
  };
}

function spikeGuard() {
  const r = SpikeDiagnostics.guardReport(spikeDeps_());
  Logger.log(JSON.stringify(r));
  return r;
}

function spikeQuotas() {
  const r = SpikeDiagnostics.quotaReport(spikeDeps_());
  Logger.log(JSON.stringify(r));
  return r;
}

// No argument on purpose: always holds the lock for the 10 second cap.
function spikeLockHold() {
  const d = spikeDeps_();
  d.gateDeps = d;
  const r = SpikeLockProbe.hold(SpikeLockProbe.MAX_HOLD_SECONDS, d);
  Logger.log(JSON.stringify(r));
  return r;
}

function spikeLockTry() {
  const d = spikeDeps_();
  d.gateDeps = d;
  const r = SpikeLockProbe.tryOnce(d);
  Logger.log(JSON.stringify(r));
  return r;
}
