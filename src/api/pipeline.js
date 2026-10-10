'use strict';
// Request pipeline behind tdmsApi (ARCHITECTURE §0.2): validate the envelope, find the method, call the service, wrap the result.
// Pure apart from the injected `deps`: { clock: {now, today}, ids: {uuid}, services, build, minBuild }.
// The registry holds exactly the methods the spike needs. Anything else is NOT_FOUND.
const Pipeline = (function () {
  // method -> { service, fn, params (allowed input fields) }
  const REGISTRY = Object.freeze({
    'system.ping': Object.freeze({ service: 'system', fn: 'ping', params: Object.freeze([]) }),
  });

  function methodNames() {
    return Object.keys(REGISTRY);
  }

  function makeCtx(raw, deps) {
    let ctx = { rid: raw && typeof raw.rid === 'string' ? raw.rid : undefined, build: deps.build, requestId: 'unavailable', serverTime: '', serverDate: '' };
    try {
      ctx = Object.assign(ctx, { requestId: deps.ids.uuid(), serverTime: deps.clock.now(), serverDate: deps.clock.today() });
    } catch (e) {
      // keep the placeholders: a response is still returned
    }
    return ctx;
  }

  // Never throws. Returns the §2.2 success or failure object.
  function handle(raw, deps) {
    const E = deps.envelope;
    const ctx = makeCtx(raw, deps);
    try {
      const v = E.validateRequest(raw);
      if (!v.ok) return E.failure('VALIDATION', 'Invalid request.', ctx, { fields: v.fields });
      const req = v.value;
      if (!Object.prototype.hasOwnProperty.call(REGISTRY, req.method)) return E.failure('NOT_FOUND', 'Unknown method.', ctx);
      const entry = REGISTRY[req.method];
      const extra = Object.keys(req.params).filter(function (k) { return entry.params.indexOf(k) === -1; });
      if (extra.length) {
        return E.failure('VALIDATION', 'Invalid request.', ctx, {
          fields: extra.map(function (k) { return { path: 'params.' + k, code: 'UNKNOWN_FIELD', message: 'Unknown field.' }; }),
        });
      }
      return E.success(deps.services[entry.service][entry.fn](req.params, deps), ctx);
    } catch (e) {
      return E.failure('SERVER', 'Unexpected error.', ctx);
    }
  }

  return Object.freeze({ methodNames: methodNames, handle: handle });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Pipeline;
