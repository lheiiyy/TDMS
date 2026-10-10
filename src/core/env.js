'use strict';
// Script Properties reader (ARCHITECTURE §16.2). The only place PropertiesService may appear (ARC-04).
// Values are read inside the function, never at file load (ARC-10). `props` is injectable for tests.
const Env = (function () {
  // Returns { env, dbId }; a missing property is undefined. dbId must never be returned to a client.
  function read(props) {
    const p = props || PropertiesService.getScriptProperties();
    return { env: p.getProperty('ENV') || undefined, dbId: p.getProperty('DB_ID') || undefined };
  }
  return Object.freeze({ read: read });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Env;
