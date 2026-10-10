'use strict';
// Reads the `_meta` tab of the environment's database spreadsheet (key | value rows; DATA-MODEL, ARCHITECTURE §16.3).
// Read-only. SpreadsheetApp appears only under repository/ (ARC-01). Needs spreadsheets.readonly.
const MetaRepository = (function () {
  // Returns the value of the `environment` row, or null when the tab or the row is missing. Throws if the sheet cannot be opened.
  // `app` is injectable for tests; it defaults to SpreadsheetApp.
  function readEnvironmentMarker(dbId, app) {
    const sheet = (app || SpreadsheetApp).openById(dbId).getSheetByName('_meta');
    if (!sheet) return null;
    const rows = sheet.getDataRange().getValues();
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === 'environment') {
        const v = rows[i][1];
        return v === undefined || v === null || v === '' ? null : String(v);
      }
    }
    return null;
  }
  return Object.freeze({ readEnvironmentMarker: readEnvironmentMarker });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MetaRepository;
