'use strict';
// Clock adapter: the only place the current time is read (ARCHITECTURE §0.2).
const Clock = (function () {
  // ISO-8601 UTC timestamp.
  function now() {
    return new Date().toISOString();
  }
  // Today as yyyy-mm-dd in the project time zone (manifest timeZone, gate G-03).
  function today() {
    return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return Object.freeze({ now: now, today: today });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Clock;
