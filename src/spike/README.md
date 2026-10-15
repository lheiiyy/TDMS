# src/spike

THROWAWAY spike code for slice 0-005 (S-06, S-08). Review at 0-010: remove it, or re-gate it, before any live push.

- `diagnostics.js`: guard report and mail-quota report, behind a gate (the `_meta` marker must be `test`).
- `lockProbe.js`: script-lock probe; the hold is capped at 10 seconds.
- `functions.js`: the global functions (`spikeGuard`, `spikeQuotas`, `spikeLockHold`, `spikeLockTry`, and `spikeLoadModule` for slice 0-006).
- `modules.js`, `page.js`: the S-01 module fetch (allowlisted, gated) and the `?page=spike` chooser used by `doGet` (slice 0-006). The page is in `src/ui/spike/`.

Only the TEST project is ever deployed as a web app. The deployment is archived after the results are recorded (docs/spikes/S-06-S-08.md).
