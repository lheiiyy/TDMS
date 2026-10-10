'use strict';
// Ids adapter: the only place a random id is made (ARCHITECTURE §0.2).
const Ids = (function () {
  function uuid() {
    return Utilities.getUuid();
  }
  return Object.freeze({ uuid: uuid });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Ids;
