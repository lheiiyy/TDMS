'use strict';
// THROWAWAY SPIKE CODE (slice 0-005, spikes S-06 and S-08). Review at 0-010: remove it or re-gate it before any live push.
// Every function here refuses unless the _meta marker of the connected spreadsheet says 'test'. No result holds an ID, an email or a URL.
// The spike functions. Run them from the Apps Script editor (Run); spikeLoadModule is called by the spike page. Like every global function they can also be called through
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

// Public on purpose (slice 0-006, spike S-01): the spike page calls it to fetch one fixture module on demand, which is the whole point of the test.
// It is gated (the _meta marker must be 'test'), answers only to the names in SpikeModules.ALLOWED, and returns static fixture text only.
// Removed at 0-010; the real transport for lazy loading is decided in slice 4-006 after the S-01 result.
function spikeLoadModule(name) {
  const d = spikeDeps_();
  d.gateDeps = d;
  d.loadFile = function (path) {
    return HtmlService.createHtmlOutputFromFile(path).getContent();
  };
  return SpikeModules.get(name, d);
}
