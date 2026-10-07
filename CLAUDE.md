# TDMS - rules for Claude Code

Training and Development Management System, Figaro Culinary Group (T&D, HRAD). Apps Script + Google Sheets now, built so only the repository layer changes when it moves to PostgreSQL + REST.

Map: STATUS = `docs/PROJECT-STATE.md` · PLAN = `docs/ROADMAP.md` · adr = `docs/DECISIONS.md` · index = `docs/README.md`

## Working with Leo

- Leo owns the project and approves every structural change, scoring rule and deploy. Plan -> Leo's OK -> build -> Leo reviews -> deploy.
- Reply in Taglish. Write docs, specs and UI text in plain formal English.
- Leo is learning Git: create the branch, commit and open the PR for him, and explain in one line what changed. Never push to `main`.
- Never write to a live legacy sheet (SVMI, TL Monitoring, CAPAR, PMS). Import from copies.
- Never commit credentials, tokens, `.clasp.json`, or spreadsheet/Drive/script IDs.

## Read order

`CLAUDE.md` -> `docs/PROJECT-STATE.md` -> the docs the task names -> affected source -> relevant tests. Nothing else. Task packets use the template in `docs/HANDOFF-MODEL.md`.

## Authority

Handover > Plan Audit > baseline docs (`docs/`) > prototype. `DATA-MODEL.md` is the schema authority; `lheiiyy/TddProjectai` is reference only. Do not invent requirements. `docs/archive/` is superseded.

## Layers (ARCHITECTURE §0.2; enforced by `tests/arch`)

UI -> `api.js` -> `tdmsApi` pipeline -> services -> rules (pure) / repository / platform adapters. A layer calls only the layers below it; nothing calls upward.

| Layer | May call | Must not call |
| --- | --- | --- |
| UI | `api.js` only | any server function except via `api.js`; any rule |
| `api.js` | `google.script.run` -> `tdmsApi` only | business logic |
| Pipeline (`api/`) | session, permission, settings, services, audit | repository directly |
| Services | rules, repository, other services' public API, platform adapters | another service's repository; `SpreadsheetApp`; `DriveApp` |
| Rules | other rules, plain data | any I/O, `Date.now`, global state |
| Repository | platform adapters (lock, cache, props), `SpreadsheetApp` | services, rules |
| Platform adapters | the Google service they wrap | everything else |

`SpreadsheetApp` only in `repository/`; `DriveApp` only in FileStore/Backup adapters; `MailApp`/`GmailApp` only in Mail; `UrlFetchApp` only in Http; `PropertiesService` only in `core/env`; `Date`/`Utilities.getUuid` only in Clock/Ids. No I/O at file load.

## Skills

`/plan` before any task -> wait for Leo's OK -> `/execute-plan` -> `/verify-before-complete`. `/tdd` for pure logic (rules, core). `/review` before a PR, `/ship-check` before a release, `/handoff` at the end of a session. `/one-shot` is never used for Apps Script. Use `tdms-module-planning` before any new module.

## Stop rule

On a missing or conflicting rule, unclear data owner, undefined permission or scope, schema change beyond the packet, possible history corruption, security impact, cross-module change, or unclear calculation: stop and report `BLOCKED — REASON — DECISION REQUIRED`. Do not guess or widen scope.

## Definition of done and commits

Implementation complete · relevant tests pass (`npm test`) · server-side authorization verified · validation and errors handled · docs updated · no unrelated files changed · `docs/PROJECT-STATE.md` and `docs/CHANGELOG.md` updated. One commit per slice milestone, citing the task ID and RULE/PERM ids; feature branches only.
