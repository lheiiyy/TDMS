# src/spike

THROWAWAY spike code for slice 0-005 (S-06, S-08). Review at 0-010: remove it, or re-gate it, before any live push.

- `diagnostics.js`: guard report and mail-quota report, behind a gate (the `_meta` marker must be `test`).
- `lockProbe.js`: script-lock probe; the hold is capped at 10 seconds.
- `functions.js`: the four global functions (`spikeGuard`, `spikeQuotas`, `spikeLockHold`, `spikeLockTry`).

Only the TEST project is ever deployed as a web app. The deployment is archived after the results are recorded (docs/spikes/S-06-S-08.md).
