'use strict';
// THROWAWAY, review at 0-010 (spike S-06, slice 0-005).
// Mail adapter (ARC-03: MailApp only here). For now it only READS the remaining daily mail quota; it sends nothing.
// The real send function arrives with the mail slice. Needs the script.send_mail scope (spike only).
const Mail = (function () {
  function remainingDailyQuota() {
    return MailApp.getRemainingDailyQuota();
  }
  return Object.freeze({ remainingDailyQuota: remainingDailyQuota });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Mail;
