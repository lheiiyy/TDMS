'use strict';
// API envelope (API-CONTRACT §2): request validation and response builders. Pure logic, no Google service.
// The caller supplies request id, times and build in `ctx`; nothing here reads a clock.
const Envelope = (function () {
  const API_VERSION = 1;
  const ERROR_CODES = Object.freeze([
    'AUTH_FAILED', 'AUTH_LOCKED', 'AUTH_REQUIRED', 'SESSION_EXPIRED', 'FORBIDDEN', 'NOT_IN_SCOPE', 'NOT_FOUND', 'VALIDATION',
    'CONFLICT', 'LOCKED', 'BLOCKED_BY_RULE', 'CONFIG_MISSING', 'BUSY', 'QUOTA', 'EXTERNAL', 'CLIENT_OUTDATED', 'SERVER',
  ]);
  const KNOWN = ['v', 'build', 'rid', 'method', 'params', 'token', 'client_ref', 'reason'];
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const METHOD_RE = /^[a-z][a-zA-Z]*\.[a-z][a-zA-Z0-9]*$/;

  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  function bad(path, code, message) {
    return { path: path, code: code, message: message };
  }

  // Returns { ok: true, value } or { ok: false, fields: [{ path, code, message }] }.
  function validateRequest(req) {
    if (!isPlainObject(req)) return { ok: false, fields: [bad('$', 'TYPE', 'Request must be an object.')] };
    const fields = [];
    Object.keys(req).forEach(function (k) {
      if (KNOWN.indexOf(k) === -1) fields.push(bad(k, 'UNKNOWN_FIELD', 'Unknown field.'));
    });
    ['v', 'build', 'rid', 'method', 'params'].forEach(function (k) {
      if (req[k] === undefined) fields.push(bad(k, 'REQUIRED', 'Required.'));
    });
    if (req.v !== undefined && req.v !== API_VERSION) fields.push(bad('v', 'VALUE', 'Unsupported API version.'));
    if (req.build !== undefined && (typeof req.build !== 'string' || req.build === '')) fields.push(bad('build', 'TYPE', 'Must be non-empty text.'));
    if (req.rid !== undefined && !(typeof req.rid === 'string' && UUID_RE.test(req.rid))) fields.push(bad('rid', 'FORMAT', 'Must be a UUID.'));
    if (req.method !== undefined && !(typeof req.method === 'string' && METHOD_RE.test(req.method))) fields.push(bad('method', 'FORMAT', 'Must be module.action.'));
    if (req.params !== undefined && !isPlainObject(req.params)) fields.push(bad('params', 'TYPE', 'Must be an object.'));
    if (req.token !== undefined && typeof req.token !== 'string') fields.push(bad('token', 'TYPE', 'Must be text.'));
    if (req.reason !== undefined && typeof req.reason !== 'string') fields.push(bad('reason', 'TYPE', 'Must be text.'));
    if (req.client_ref !== undefined && !(typeof req.client_ref === 'string' && UUID_RE.test(req.client_ref))) fields.push(bad('client_ref', 'FORMAT', 'Must be a UUID.'));
    return fields.length ? { ok: false, fields: fields } : { ok: true, value: req };
  }

  // ctx: { rid, requestId, serverTime (ISO-8601 UTC), serverDate (yyyy-mm-dd), build }
  function meta(ctx) {
    return {
      request_id: ctx.requestId,
      rid: typeof ctx.rid === 'string' ? ctx.rid : null,
      server_time: ctx.serverTime,
      server_date: ctx.serverDate,
      api_version: API_VERSION,
      build: ctx.build,
    };
  }

  function success(data, ctx) {
    return { ok: true, data: data, meta: meta(ctx) };
  }

  // extra: optional { fields } for VALIDATION. No stack trace, ID or internal path may be passed in `message`.
  function failure(code, message, ctx, extra) {
    const error = { code: ERROR_CODES.indexOf(code) === -1 ? 'SERVER' : code, message: message };
    if (extra && extra.fields) error.fields = extra.fields;
    return { ok: false, error: error, meta: meta(ctx) };
  }

  return Object.freeze({ API_VERSION: API_VERSION, ERROR_CODES: ERROR_CODES, validateRequest: validateRequest, success: success, failure: failure });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Envelope;
