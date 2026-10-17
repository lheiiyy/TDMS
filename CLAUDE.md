# TDMS - rules for Claude Code

Training and Development Management System, Figaro Culinary Group (T&D, HRAD). Apps Script + Google Sheets now, built so only the repository layer changes when it moves to PostgreSQL + REST.

Map: STATUS = `docs/PROJECT-STATE.md` · PLAN = `docs/ROADMAP.md` · adr = `docs/DECISIONS.md` · index = `docs/README.md`

## Working with Leo

- Leo owns the project and approves every structural change, scoring rule and deploy. Plan -> Leo's OK (one per slice, see Batch approval) -> build -> Leo reviews every PR -> deploy.
- Reply in Taglish. Write docs, specs and UI text in plain formal English.
- Leo is learning Git: create the branch, commit and open the PR for him, and explain in one line what changed. Never push to `main`. Merge a PR only when Leo says so in the session, naming the PR (D073, see Batch approval per slice).
- Never write to a live legacy sheet (SVMI, TL Monitoring, CAPAR, PMS). Import from copies.
- Never commit credentials, tokens, `.clasp.json`, or spreadsheet/Drive/script IDs.
- Deploy to live only when Leo says so, after a dated live backup (`node tools/deploy.js live --live --backup-date yyyy-mm-dd`; the date is a reminder, not proof of a backup).
- No real employee data in `live` before slice 2-006 and gate G-09 (DECISION-GATE).

## Batch approval per slice

One approved plan covers one whole slice: a single ROADMAP row (`<phase>-<nnn>`, one task packet, ROADMAP R-05) with every part named in its task text. Slices are never grouped unless Leo asks. A task that is not a ROADMAP row (a fix, a docs task, a spike follow-up) is its own slice and needs its own plan and OK.

- At the start of a slice, write the plan with the template in `docs/HANDOFF-MODEL.md` §3A and wait for Leo's OK. After the OK, do the slice's tasks in order, with the planned commits and PRs, and do not ask again. A slice whose "Blocked by" item is open is not planned: report `BLOCKED — REASON — DECISION REQUIRED`.
- Inside a slice nothing else changes: Leo reviews every PR; never merge without Leo's explicit word naming the PR (D073); never push to `main`; the stop rule applies, and any BLOCKED item stops the slice.
- Needs a separate OK from Leo, at the time, even inside an approved slice: a schema change beyond the packet; a scoring or calculation rule; a permission or scope change; security impact; a cross-module change; anything touching LIVE; any decision listed in `docs/DECISION-GATE.md`; any push or deploy to an Apps Script project.
- Scope change (a task added or dropped; a file in another module or layer, or config, schema, permissions or manifest; a new dependency; a change to API, schema, permission or calculation): stop, say what changed and why, re-plan, and continue only after Leo's OK. Commits already made stay on the branch.
- Builder merges on Leo's word (D073): merge a PR only after Leo writes in the session, naming the PR (e.g. "OK i-merge #N"). Then: CI green and PR mergeable; merge commit (not squash); delete the branch; pull `main`; report the merge commit hash. Never merge without that message. Never merge a PR touching the LIVE deploy or the live manifest without a dated backup. Never push to `main` directly. A general OK or an approved plan is not a merge order.
- Where the plan splits a slice into several PRs, stop after each PR until Leo merges it, then branch the next from updated `main`. No stacked PRs.
- End of slice: report in at most 10 lines (slice ID, PR link(s), files changed, commits, `npm test` result, deviations from the plan, open issues, next slice). `docs/PROJECT-STATE.md` and `docs/CHANGELOG.md` are updated inside the slice.

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

`/plan` before any slice -> wait for Leo's OK -> `/execute-plan` -> `/verify-before-complete`. `/tdd` for pure logic (rules, core). `/review` before a PR, `/ship-check` before a release, `/handoff` at the end of a session. `/one-shot` is never used for Apps Script. Use `tdms-module-planning` before any new module.

## Stop rule

On a missing or conflicting rule, unclear data owner, undefined permission or scope, schema change beyond the packet, possible history corruption, security impact, cross-module change, or unclear calculation: stop and report `BLOCKED — REASON — DECISION REQUIRED`. Do not guess or widen scope.

## Definition of done and commits

Implementation complete · relevant tests pass (`npm test`) · server-side authorization verified · validation and errors handled · docs updated · no unrelated files changed · `docs/PROJECT-STATE.md` and `docs/CHANGELOG.md` updated. One commit per slice milestone listed in the approved plan, citing the task ID and RULE/PERM ids; feature branches only.
