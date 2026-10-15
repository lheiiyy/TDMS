'use strict';
// Reads the `_meta` tab of the environment's database spreadsheet (key | value rows; DATA-MODEL, ARCHITECTURE §16.3).
// Read-only code. SpreadsheetApp appears only under repository/ (ARC-01). Needs the spreadsheets scope: openById requires it (spike finding F1).
const MetaRepository = (function () {
  // Reads the `_meta` tab. Returns { tabFound, marker }: marker is the value of the `environment` row, or null when the row
  // is missing or its value is empty. Throws if the sheet cannot be opened. `app` is injectable for tests; it defaults to SpreadsheetApp.
  function readMeta(dbId, app) {
    const sheet = (app || SpreadsheetApp).openById(dbId).getSheetByName('_meta');
    if (!sheet) return { tabFound: false, marker: null };
    const rows = sheet.getDataRange().getValues();
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === 'environment') {
        const v = rows[i][1];
        return { tabFound: true, marker: v === undefined || v === null || v === '' ? null : String(v) };
      }
    }
    return { tabFound: true, marker: null };
  }

  // Returns the environment marker, or null when the tab or the row is missing. Throws if the sheet cannot be opened.
  function readEnvironmentMarker(dbId, app) {
    return readMeta(dbId, app).marker;
  }
  return Object.freeze({ readMeta: readMeta, readEnvironmentMarker: readEnvironmentMarker });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MetaRepository;
