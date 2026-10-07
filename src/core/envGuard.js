'use strict';
// Environment guard (ARCHITECTURE §16.3, AD-12). Pure comparison only: no Google service is called here.
// The caller reads ENV from Script Properties and the marker from the `_meta` tab, then passes both in.
// On a mismatch the platform disables all writes and returns code SERVER with the guard code.
const EnvGuard = (function () {
  const ENVIRONMENTS = Object.freeze(['dev', 'test', 'live']);

  function isBlank(v) {
    return v === undefined || v === null || v === '';
  }

  // input: { env: string (Script Property ENV), marker: string (value of `_meta` row `environment`) }
  // Values are compared exactly: no trimming, no case folding.
  function checkEnvironment(input) {
    const env = input ? input.env : undefined;
    const marker = input ? input.marker : undefined;
    if (isBlank(env)) return fail('ENV_MISSING');
    if (ENVIRONMENTS.indexOf(env) === -1) return fail('ENV_INVALID');
    if (isBlank(marker)) return fail('MARKER_MISSING');
    if (marker !== env) return fail('ENV_MISMATCH');
    return { ok: true, env: env, writesAllowed: true };
  }

  function fail(guard) {
    return { ok: false, code: 'SERVER', guard: guard, writesAllowed: false };
  }

  return Object.freeze({ ENVIRONMENTS: ENVIRONMENTS, checkEnvironment: checkEnvironment });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = EnvGuard;
