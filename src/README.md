# src

Apps Script source (plain JavaScript V8 with JSDoc; no bundler, no framework). Layers follow [ARCHITECTURE §0.2](../docs/ARCHITECTURE.md): UI -> `api.js` -> `tdmsApi` -> services -> rules / repository / platform adapters.

Calls go downward only. Enforced by `tests/arch`.

`appsscript.json` (manifest, time zone) is added by slice 0-002; not part of TDMS-0-001.
