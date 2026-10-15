# src/ui/spike

THROWAWAY spike page and fixture modules for slice 0-006 (S-01 lazy load, S-05 device storage). Review at 0-010: remove them, or re-gate them, before any live push.

- Opened with `?page=spike`; the default page is the shell.
- The only UI folder, besides `api.js`, allowed to call `google.script.run` (test `tests/arch/ui-server-calls.test.js`).
- Holds no data. The gate is in the server function `spikeLoadModule` (`src/spike/`).
