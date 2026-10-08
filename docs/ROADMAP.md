# TDMS Implementation Roadmap v1.0

Status: FINAL roadmap for review. Replaces v0.1 (Deliverable I). Planning document only; no application code.
Built from the finalized: [PROJECT-BIBLE](PROJECT-BIBLE.md) · [REQUIREMENTS](REQUIREMENTS.md) · [DECISIONS](DECISIONS.md) · [DATA-MODEL](DATA-MODEL.md) · [PERMISSIONS](PERMISSIONS.md) · [WORKFLOWS](WORKFLOWS.md) · [CONFIGURATION](CONFIGURATION.md) · [ARCHITECTURE](ARCHITECTURE.md) · [API-CONTRACT](API-CONTRACT.md). Open items: [DECISION-GATE](DECISION-GATE.md), [ISSUE-REGISTER](ISSUE-REGISTER.md).
Packet template and Claude Code rules: [HANDOFF-MODEL](HANDOFF-MODEL.md).

**What changed from v0.1.** Phases are now ordered by dependency and follow your foundation sequence (repository → environment → core utilities → database → configuration → authentication → authorization → audit → master data → person/employee → business modules → reporting → hardening). v0.1's phases 0 and 1A–1F became PH-0 to PH-8; its phases 2–9 became PH-9 to PH-17 (mapping in §8). Every phase is split into small vertical slices, each with its own task ID, tests and open-item blockers. A pre-live security and restore check was pulled forward from hardening (§1 rule R-12).

---

## 1. Planning rules

| # | Rule | Why |
| --- | --- | --- |
| R-01 | Phases follow **dependencies**, not screen order. The dashboard is not early; it needs every module's data | Instruction §12 |
| R-02 | Inside every module the slice order is fixed: **D** data + schema freeze → **R** pure rules → **S** service + permissions + validation + API + tests → **J** jobs/imports → **U** UI | No UI on an unstable data model |
| R-03 | A **U** slice starts only when its module's D, R and S slices are merged and green and the module's schema is **tagged frozen** (§6). A U slice may not change the schema. If it needs to, it stops with `BLOCKED — schema change — DECISION REQUIRED` and returns to a D slice | Instruction §14, §16 |
| R-04 | Each slice is independently testable: rules and services run in Node with fakes; repository behaviour is proven by the contract suite on the test spreadsheet | ARCHITECTURE §4.6 |
| R-05 | One slice = one task packet (HANDOFF-MODEL §3). Task titles are full verticals (e.g. "Implement training session CRUD + permissions + validation + API + tests"), never "Build the Training module" | Instruction §13 |
| R-06 | No business module writes data before the audit writer (PH-2) and authorization (PH-5) exist. A method without a PERM id cannot be registered (ARC-06) | Instruction §10 |
| R-07 | A setting whose value REQUIRES DECISION is **not guessed**. The slice builds the mechanism and the feature returns `CONFIG_MISSING` until an authorized user sets it | CONFIGURATION R14 |
| R-08 | A permission cell marked ⛔/`?` is implemented as **deny** and tested as deny until decided | PERMISSIONS §12 |
| R-09 | A slice whose "Blocked by" item is still open is not issued. If it surfaces mid-slice Claude Code stops and reports `BLOCKED — REASON — DECISION REQUIRED` | Instruction §16 |
| R-10 | Parallel lanes (§3) run only when they share no table and no open slice | Avoids merge and schema collisions |
| R-11 | Every phase ends with a **phase exit review** by Claude Work: Definition of Done (§0 below), docs updated, PROJECT-STATE updated, schema tag set, test environment promoted | Instruction §26 |
| R-12 | **No live release before a minimal security and restore check.** Hardening (PH-17) is the full pass, but slice 9-013 runs a scoped version before the first live release (REL-1) | Handover §10 puts live use at the end of each phase |
| R-13 | A phase that replaces a legacy sheet is done only when that sheet is read-only and the team enters new records only in TDMS | Handover §10 |
| R-14 | New ideas go to the parking lot and are reviewed at each phase exit, never added mid-phase | Handover §9 |

### 1.1 Slice notation

| Field | Meaning |
| --- | --- |
| **ID** | `<phase>-<nnn>`; the task ID is `TDMS-<phase>-<nnn>` (e.g. TDMS-2-004) |
| **Type** | **T** tooling/environment/spike · **D** data (schema, repository tables, freeze) · **R** pure rules · **S** service + permissions + validation + API · **J** job, import or integration · **U** UI |
| **Size** | **S** one rule or one small entity · **M** an entity with service and API · **L** a multi-entity workflow. An L must be reconsidered for splitting when its packet is written |
| **Depends** | Slice IDs that must be merged first |
| **Blocked by** | Open item that must be answered before the slice is issued: gate `G-nn` (DECISION-GATE), `ISS-…`, `CD-nn` (CONFIGURATION §3), `AMB-nn` (PERMISSIONS), `AO-nn` (ARCHITECTURE §20), spike `S-nn` (ARCHITECTURE Appendix A). "—" = none |
| **Tests** | Test ID family (§7). Exact IDs are fixed in the packet |

### 1.2 Definition of Done (every slice; Instruction §26)

Implementation complete · relevant tests pass · server-side authorization verified · validation and error handling done · audit events written where the method writes · documentation updated where needed · no unrelated files changed · no hidden blocker · PROJECT-STATE updated · ready to commit (one commit per slice milestone citing task ID and RULE/PERM ids).

---

## 2. Phase map

| PH | Name | Your foundation step | Handover §10 item | Depends on | Release |
| --- | --- | --- | --- | --- | --- |
| PH-0 | Repository and environments | 1 repository · 2 environment | 1 Foundation | — | — |
| PH-1 | Core utilities and platform adapters | 3 core utilities | 1 | PH-0 | — |
| PH-2 | Database and data layer | 4 database (+ audit writer) | 1 | PH-1 | — |
| PH-3 | Configuration | 5 configuration | 1 | PH-2 | — |
| PH-4 | Authentication | 6 authentication | 1 | PH-3 | — |
| PH-5 | Authorization | 7 authorization | 1 | PH-4 | — |
| PH-6 | Audit, Admin and platform services | 8 audit (+ Admin, files, backup) | 1 | PH-5 | — |
| PH-7 | Master data | 9 master data | 1 | PH-6 | — |
| PH-8 | Person and Employee | 10 person/employee | 1 | PH-7 | — |
| PH-9 | Store visits, Calendar, Store Health | 11 business modules | 2 | PH-8 | **REL-1** |
| PH-10 | CAPAR | 11 | 3 | PH-9 | REL-2 |
| PH-11 | Trainees and EXECom | 11 | 4 | PH-8 (+ PH-6 imports) | REL-3 |
| PH-12 | Team Leaders | 11 | 5 | PH-11, PH-9 | REL-4 |
| PH-13 | Proficiency and expiry | 11 | 6 | PH-11, PH-12, PH-9 | REL-5 |
| PH-14 | Training sessions, Library, LMS help | 11 | 7 | PH-8, PH-6 (calendar slice needs PH-9) | REL-6 |
| PH-15 | KPI/KRA and month close | 11 | 8 | PH-9, 11, 12, 13, 14 | REL-7 |
| PH-16 | Reporting and notifications | 12 reporting | 8 | PH-9 to PH-15 | REL-7 |
| PH-17 | Hardening and go-live readiness | 13 hardening | — | all | REL-8 (full go-live) |

The audit **writer** (append-only primitive inside the unit of work) is built in PH-2, before authentication, because authentication itself writes audit rows (sign-in, failure, lock). PH-6 builds the audit **module**: viewer, Admin edit/delete, Recycle bin, queue, integrity. This is the one place the dependency graph reorders your list; it is recorded as conflict R-05 in §8.

---

## 3. Dependency graph and lanes

```
PH-0 ─ PH-1 ─ PH-2 ─ PH-3 ─ PH-4 ─ PH-5 ─ PH-6 ─ PH-7 ─ PH-8
                                                          │
                      ┌───────────────────────────────────┼──────────────────────┐
                      ▼                                   ▼                      ▼
                    PH-9 Visits/Health                  PH-11 Trainees        PH-14 Training/Library/LMS
                      │                                   │                      │ (calendar slice needs PH-9)
                      ▼                                   ▼                      │
                    PH-10 CAPAR                         PH-12 TL (needs PH-9 TLTC)│
                                                          │                      │
                                                          ▼                      │
                                                        PH-13 Proficiency (needs PH-9 plans)
                      └───────────────────────┬───────────┴──────────────────────┘
                                              ▼
                                            PH-15 KPI + month close
                                              ▼
                                            PH-16 Reporting + notifications
                                              ▼
                                            PH-17 Hardening and go-live
```

- **Strictly sequential:** PH-0 → PH-8. Nothing in PH-1 to PH-8 runs in parallel except where a slice says so (spikes in PH-0; UI slices after their API).
- **Lanes after PH-8** (parallel only if no shared table): Lane A = PH-9 → PH-10. Lane B = PH-11 → PH-12 → PH-13. Lane C = PH-14 (its calendar slice waits for PH-9).
- **Critical path:** PH-0 → … → PH-8 → PH-9 → PH-10 → PH-15 → PH-16 → PH-17. Lane B joins at PH-15 (EXECom and proficiency feed snapshots and KRAs).
- **Release trains:** REL-1 after PH-9 (SVMI read-only), REL-2 after PH-10, REL-3 after PH-11 (EXECom/ENDORSEMENT sheets read-only), REL-4 after PH-12, REL-5 after PH-13, REL-6 after PH-14, REL-7 after PH-16, REL-8 after PH-17.

---

## 4. Decision calendar — what Leo must answer, and by when

"Needed before" = the first slice that cannot be issued without it. Items marked **gate** are in DECISION-GATE; the rest are module decisions.

| Needed before | Item | Decision |
| --- | --- | --- |
| **0-001** | **G-04** | Approve or amend the repository layout and deploy flow (ARCHITECTURE §0.3, §16.4) |
| **0-002** | **G-01** | Google account that owns the scripts, sheets and Drive. Answered 2026-10-08: personal Gmail for all environments (D069). Backup editor open (G-08) |
| **0-002**, 1-001 | **G-03** | Organisation time zone |
| 0-005 | AO-02 / S-06 | Confirm the account may run a web app as owner with "Anyone" access |
| 2-001 | **G-05** | Approve DATA-MODEL and the history design (PROP-004) |
| 3-002 | CD-38 | Approve the bundle-version stamp (PROP-006) |
| 4-005 | CD-01 | Company email address that sends reset links |
| 5-004 | AMB-14, CD-24 | Delegation details and any maximum length |
| 5-007 | **G-06** (AMB-01, AMB-02) | Who edits the permission matrix; does Admin count as "higher" |
| 6-004 | ISS-P1-16 | Reassignment queue: table or view |
| 6-005 | CD-17, S-03 | File size limits; upload mechanism |
| 6-006 | **G-02** | Nightly backup retention count |
| 6-010 | AMB-07 | Who may view/configure Settings (S, M, Sr) |
| 7-001 | — | Leo supplies brand/region/store/position/station lists |
| 8-003, 8-004 | **G-07** | HR masterlist sample and TDD team list |
| 8-002 | AMB-04 | Who creates/edits a single employee |
| 8-005 | AMB-15 | Who may request a deactivation |
| 9-001 | ISS-P1-06 (PROP-001) | Visit plan vs visit: one entity or two |
| 9-008 | ISS-P1-18 | Store Visit Report: Option A (AI) or B (template) |
| REL-1 acceptance | ISS-P1-07 | Provide `SVMKPI_RISK.gs` for Store Health parity tests |
| 10-001, 10-005 | ISS-P1-01, ISS-P1-10, CD-04, CD-07, CD-15, CD-16 | QA endorsement trigger and status values; later stage targets; failure-type list; QA email |
| 10-003 | ISS-P1-15 (CD-17) | Photos per finding and size |
| 10-004 | AMB-05, ISS-P1-19 | Who schedules verification; multi-officer and remote verification counting |
| 10-009 | ISS-P0-18, CD-29 | AI in v1 and IT approval (the slice is on hold until then) |
| 11-001 | ISS-P1-20, CD-27, CD-30 | Training duration per brand; starting assessment components |
| 11-007 | ISS-P1-02, CD-09, CD-10 | Extension semantics and limit; failed-at-end rule; HR result values |
| 11-005, 11-009 | AMB-06, AMB-12, ISS-P1-12 | Batch creation role; import verify/commit role; template columns |
| 11-011 | D051 | Training memo approval (on hold) |
| 12-002 | ISS-P1-03 (D053, CD-26) | Current TL formula |
| 12-004, 12-005 | ISS-P1-04, CD-06, CD-11 | TL extension limit and quit reasons |
| 13-003 | ISS-P1-05, CD-14 | Cross-training pass rule |
| 13-002, 13-006 | CD-12, CD-13, ISS-P1-08 | Validity per station; warning window; flag days; visit purpose for expiry |
| 14-005 | AMB-13 | Who may ask an LMS question |
| 15-004 | AMB-09, CD-19 | Attendance marker role; coaching survey source and maximum |
| 15-002 | CD-18 | Cap KRA at 100% |
| 15-003 | AMB-08 | Who sets targets |
| 15-006 | AMB-10, CD-20, ISS-P0-16 | Who closes a month; month-close day |
| 16-006 | CD-21 | Digest time and opt-out |
| 16-005 | AO-04 | Meaning of "Google Sheets" report output |
| 17-003 | AO-05, CD-22 | File backup; retention |

---

## 5. Phase specifications

Each phase has: objective, prerequisites, modules, database work, backend work, frontend work, tests, documentation, acceptance criteria, risks, definition of done, then its slices.

---

### PH-0 — Repository and environments

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-0 |
| **Objective** | A working repository, three isolated environments, a test runner and proof of the platform assumptions, before any application code exists |
| **Prerequisites** | G-04 (layout); G-01 (account; answered, D069) and G-03 (time zone) for the Apps Script and spreadsheet slices. Handover §11 lists G-01/G-02 as "needed before Phase 0 starts"; see §9 for what can safely start earlier |
| **Modules** | Platform only (no business module) |
| **Database work** | Create the dev, test and live spreadsheets as empty shells with the `_meta` environment marker. No tables yet |
| **Backend work** | None beyond spike code kept in `spikes/` (throwaway). Deploy tooling (`clasp` per environment), Script Properties, environment configuration |
| **Frontend work** | None (spike pages only) |
| **Tests** | Node test runner; architecture conformance checks ARC-01–12 as static tests; spike reports |
| **Documentation** | `CLAUDE.md`; docs set copied into `docs/`; `docs/spikes/S-0n.md` reports; ARCHITECTURE updated with spike results; PROJECT-STATE |
| **Acceptance criteria** | `npm test` passes with the ARC checks active and proven to fail on a planted violation; dev, test and live each have their own Apps Script project, spreadsheet, Drive folder and Script Properties; a deliberately mismatched environment refuses to start; all nine spikes (S-01 to S-09) have a written result; any spike that failed has its fallback recorded in ARCHITECTURE |
| **Risks** | The owner account cannot run "Execute as owner / Anyone" (AD-01) → fallback is domain-only access (Workspace accounts only); spike results contradict an assumption (cache limit, payload size) → change one mechanism, not the platform; live shell under a personal account (D069) → ownership transfer is unverified until spike S-09 (0-011) |
| **Definition of done** | The slice DoD (§1.2), plus: three environments exist and are documented; no secret or ID is committed; PROJECT-STATE names the account owner and the environment table |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 0-001 | T | Initialise `lheiiyy/TDMS`: folder layout, `CLAUDE.md`, docs copy, `.gitignore`, `package.json` with a dependency-free Node test runner, ARC static checks (ARC-01–04, 07, 08, 10 active; 05, 06, 09, 11, 12 scaffolded as pending), minimal CI workflow. **First Claude Code task, §9** | — | G-04 | ARC-01–12, PLAT | M |
| 0-002 | T | Create the **dev** environment: Apps Script project (V8, manifest with time zone), database spreadsheet with `_meta`, Drive folders, Script Properties, `clasp` config template, deploy script, environment guard test | 0-001 | G-01, G-03 | PLAT | M |
| 0-003 | T | Create the **test** environment and the promotion tool (same commit pushed dev → test); repeat the guard test; document reset-to-seed procedure | 0-002 | G-01 | PLAT | S |
| 0-004 | T | Create the **live shell**: project owned by the interim personal account (D069), empty spreadsheet with marker, folder, 2-step verification on the account and a named backup editor (G-08, open until the first real import), no data and no users, no web app deployment | 0-003 | — | PLAT | S |
| 0-005 | T | Run **spike S-06 + S-08**: deploy a hello web app as owner with "Anyone" access, echo a `system.ping` envelope, record mail/trigger/concurrency quotas, prove multi-project `clasp` push and the environment guard | 0-003 | AO-02 | spike report | S |
| 0-006 | T | Run **spike S-01 + S-05**: lazy-load a module view and script in the sandbox; test device storage persistence on iOS Safari and Android Chrome | 0-005 | — | spike report | S |
| 0-007 | T | Run **spike S-02**: benchmark iterated HMAC-SHA256 to choose the iteration count and record the sign-in time | 0-003 | — | spike report | S |
| 0-008 | T | Run **spike S-04 + S-07**: read time for 4,000 and 20,000 rows, `api.batch` size, and 20 concurrent writers against the script lock | 0-003 | — | spike report | S |
| 0-009 | T | Run **spike S-03**: maximum upload size over `google.script.run`, PDF render time with photos and a memo batch | 0-003 | — | spike report | S |
| 0-011 | T | Run **spike S-09 (account-transfer rehearsal)**: on the *test* environment, move ownership of the project, spreadsheet and Drive folder to a second Gmail and record what holds (file IDs, Script Properties, web app deployment URL, triggers, clasp login, mail sender). Needs a second Gmail from Leo and the "TDMS test" Apps Script project to exist. Verifies [account-transfer](runbooks/account-transfer.md) | 0-003 | D069 | spike report | S |
| 0-010 | T | Close PH-0: write all spike results into ARCHITECTURE (changes limited to the mechanism named), update the risk table, PROJECT-STATE, phase exit review | 0-004 to 0-009, 0-011 | — | — | S |

---

### PH-1 — Core utilities and platform adapters

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-1 |
| **Objective** | The shared kernel every module will use: clock and dates, errors, validation, ID formats, platform ports with fakes, and the dispatcher skeleton |
| **Prerequisites** | PH-0 complete; G-03 (time zone) |
| **Modules** | `core/`, `platform/`, `api/` skeleton, `api.js` skeleton |
| **Database work** | None |
| **Backend work** | Date kernel (business date, working days, first-Thursday-on-or-after, month boundaries); error model and envelope builder; validation kernel; ID format registry; ports and in-memory fakes (Lock, Cache with epochs, Props, Mail, Http, FileStore, Pdf); Apps Script implementations of Lock/Cache/Props/Clock; method registry, dispatcher and pipeline steps 1–3 and 11–12 with `system.ping` |
| **Frontend work** | `api.js` transport (envelope, error mapping, `TRANSPORT` handling, batch of reads) and an empty shell page; no module screens |
| **Tests** | Pure Node tests with fixed vectors; adapter integration tests on the dev environment; API-001, 006, 010, 016, 020; ARC-05, 06, 07, 10 activated |
| **Documentation** | ARCHITECTURE appendix "kernel contract"; API-CONTRACT unchanged unless a spike forces it; PROJECT-STATE |
| **Acceptance criteria** | Handover date vectors pass (Juan Luna: Training Start Mon 05 Oct 2026 → tech val 19 Nov, exam 20 Nov, end 10 Dec; batch 1A-26 vectors); an unknown method returns `NOT_FOUND`; an old client build returns `CLIENT_OUTDATED`; no response carries a stack trace; no rule file touches an adapter |
| **Risks** | Clock and time-zone mistakes leak into every module (G-03); adapters hide platform quirks that only show under load (S-04/S-07); over-building the kernel |
| **Definition of done** | Slice DoD; the kernel is covered by vectors; ARC-05/06/07/10 are active |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 1-001 | R | Implement the date kernel (business date from the Clock port, add working days with a holiday provider interface, first Thursday on/after, month start/end, ISO date/timestamp helpers) + vectors + tests | 0-010 | G-03 | PLAT | M |
| 1-002 | R | Implement the error model, envelope builder (success/failure, codes of API-CONTRACT §4) and validation kernel (type, required, enum, length, `fields` list) + tests | 0-010 | — | API, PLAT | M |
| 1-003 | T | Define the platform ports (Lock, Cache with epoch protocol, Props, Mail, Http, FileStore, Pdf, Clock) with in-memory fakes + port contract tests | 1-002 | — | PLAT | M |
| 1-004 | T | Implement the Apps Script adapters for Lock, Cache, Props and Clock and run the port contract tests against the dev environment (cache eviction fallback included) | 1-003 | — | PLAT | M |
| 1-005 | R | Implement the ID kernel (prefix/format registry from DATA-MODEL §2, year-from-date, width overflow error, parse) + tests | 1-001 | — | DATA | S |
| 1-006 | S | Implement the method registry, `tdmsApi` dispatcher, pipeline steps 1–3 and 11–12, `system.ping`, `CLIENT_OUTDATED`; the `api.js` client skeleton and an empty shell page deployed to dev; activate ARC-05/06 | 1-002, 1-004 | — | API, ARC | M |

---

### PH-2 — Database and data layer

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-2 |
| **Objective** | The repository, the schema registry and the provisioned tables, with concurrency, history and the job queue, so that every later module only writes through one proven path |
| **Prerequisites** | PH-1; **G-05** (DATA-MODEL and history design approved) |
| **Modules** | `repository/`, `config/schema/`, `core/jobs`, AuditService (writer), HistoryService (writer), `error_log` |
| **Database work** | Schema registry generated from DATA-MODEL (ENT-001–118, profiles, text-guard, secret columns, FK map); sheet provisioner and schema check; `_meta`, `_counters`, `_migrations`; tables for settings, lookups, audit, history, jobs, schedule, error_log, files, users/sessions shells; tables of modules whose blockers (M2–M5, M7) are open are registered but marked **deferred** and not provisioned |
| **Backend work** | Header-driven reader/writer; `get`, `list` (scope argument mandatory), insert/append/update/insertVersion; `row_version`; counters under lock; unit of work and flush order; audit and history writers; cache epochs for reference tables; job queue and worker; environment guard with `_meta`; synthetic seed framework |
| **Frontend work** | None |
| **Tests** | One contract suite run twice (in-memory fake and the test spreadsheet): DATA, AUDIT, JOB, PLAT. Concurrency: two writers, stale `row_version`, duplicate counters |
| **Documentation** | DATA-MODEL updated to the registry; ARCHITECTURE §4 confirmed against spike S-04; TEST-STRATEGY gains DATA and JOB families |
| **Acceptance criteria** | Every table in the registry round-trips; a stale `row_version` returns `CONFLICT` with `current`; counters never repeat under concurrent allocation; a business write without audit rows fails the contract suite; "9E-26" and a 12-digit HR number round-trip as text; a mismatched environment refuses writes; list reads without a scope argument are impossible (ARC-12) |
| **Risks** | Platform limits (lock contention, 6-minute limit, read time) appear here first; a table list that is rebuilt later (hence G-05); partial flush leaves unaudited rows (§14.3 of ARCHITECTURE) |
| **Definition of done** | Slice DoD; **schema freeze SG-1** tagged; ARC-12 active; read benchmark recorded against spike S-04 |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 2-001 | D | Generate the schema registry from DATA-MODEL (all entities, columns, profiles, text-guard, `secret`, FK map, ID prefixes) + registry lint tests (FK targets exist, MUT has `row_version`, prefixes unique, deferred tables flagged) | 1-005 | **G-05** | DATA | M |
| 2-002 | T | Implement the sheet provisioner and schema check tools (create tabs and headers from the registry, text-format guard columns, `_meta`/`_counters`/`_migrations`, additive migration runner); run on dev and test | 2-001, 0-003 | — | DATA | M |
| 2-003 | D | Implement repository reads (header-driven loader, `get` by ID, `list` with filters/sort/paging ≤ 50, mandatory scope argument, secret-column exclusion, text coercion) + in-memory twin + contract suite | 2-002, 1-004 | — | DATA | L |
| 2-004 | D | Implement repository writes (insert, append, update with `row_version`, `insertVersion` with `supersedes_id`, counters under lock, profile columns, unit of work with fixed flush order) + concurrency contract tests | 2-003 | — | DATA, PLAT | L |
| 2-005 | S | Implement AuditService and HistoryService writers (audit_log, status_history, record_history inside the unit of work, append-only interfaces, `request_id`, `error_log` with failed-flush payload) + AUDIT tests | 2-004 | **G-05** | AUDIT | M |
| 2-006 | T | Implement the environment guard (`ENV` vs `_meta` marker), schema-version check at start and the maintenance flag (read-only mode) + tests | 2-004 | — | PLAT | S |
| 2-007 | D | Implement the cached reference-table reader (epoch bump on write, TTL, per-request memo, eviction fallback) + tests | 2-004, 1-004 | — | DATA, PLAT | M |
| 2-008 | J | Implement the job queue, schedule table, worker (5-minute trigger installer, owner-run), time budget, resumable cursor, retry/back-off, dedupe, `Failed` handling + tests with fake jobs | 2-004, 1-004 | — | JOB | L |
| 2-009 | T | Implement the synthetic seed framework (refuses to run when `ENV` is live) and the reset-to-seed tool for test | 2-004, 2-006 | — | DATA | S |
| 2-010 | D | Freeze **SG-1**: re-run the contract suite and the S-04 benchmark on the test environment; tag `schema-core`; update DATA-MODEL; phase exit review | 2-005 to 2-009 | — | DATA, AUDIT, JOB | S |

---

### PH-3 — Configuration

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-3 |
| **Objective** | Versioned, effective-dated settings and lists that every later rule reads, with result stamps ready before any result is saved |
| **Prerequisites** | PH-2; CONFIGURATION decisions only for what each slice includes (CD-38 for bundles) |
| **Modules** | SettingsService, LookupService, HolidayService, setting definitions |
| **Database work** | `settings` (VER), bundle versions (DM-A0, CD-38), `lookups`, `holidays`; seeds for approved values only |
| **Backend work** | In-force resolution by date; no backdating; group validation; `supersedes_id` conflicts; reason on A2 settings; bundle resolver and stamp helper; `CONFIG_MISSING` mechanism; lookup rules (system items locked, deactivate-not-delete); holiday list and working-day service |
| **Frontend work** | None (screens come in PH-6 after authorization and audit) |
| **Tests** | TEST-CFG (versioning, effective dates, bundles, missing values), DATA, API-012 |
| **Documentation** | CONFIGURATION updated with the final definition-file format; DATA-MODEL DM-A0 if CD-38 is approved |
| **Acceptance criteria** | A new version never alters an old one; a result saved with bundle version N still reads N after a change; backdating is refused; weights not totalling 100 are refused as one group; two simultaneous savers → one `CONFLICT`; every REQUIRES-DECISION setting is absent and its consumers return `CONFIG_MISSING`; the approved defaults in CONFIGURATION Section 1 are seeded exactly |
| **Risks** | Seeding a guessed value (R14); bundle design changing after results exist (CD-38) |
| **Definition of done** | Slice DoD; seed test proves approved values present and pending ones absent |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 3-001 | S | Implement SettingsService (version insert, in-force by date, no backdating, group validation, `supersedes_id` conflict, `CONFIG_MISSING`, audit with reason) + `settings.get/list/set` registered without UI | 2-010 | — | TEST-CFG, API | L |
| 3-002 | D | Implement bundle versions and the result-stamp helper (members as rows, one `settings_version_id` per result) | 3-001 | CD-38 | TEST-CFG | M |
| 3-003 | S | Implement LookupService (CRUD, deactivate, system items locked, referenced items undeletable) + `lookups.*` + seeds for visit purposes, location types, employee statuses (approved values only) | 3-001 | — | TEST-CFG | M |
| 3-004 | S | Implement HolidayService + the working-day service wired to the date kernel + `holidays.*` + vectors for stage-target counting | 3-001, 1-001 | — | TEST-CFG | S |
| 3-005 | J | Implement the setting-definition files for every CONFIGURABLE CFG id and the seed loader for approved defaults; deploy check that definitions and stored keys agree; test that pending values are absent | 3-001 to 3-004 | — | TEST-CFG | M |
| 3-006 | D | Freeze **SG-2a** for configuration tables; tag `schema-config`; phase exit review | 3-005 | — | TEST-CFG | S |

---

### PH-4 — Authentication

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-4 |
| **Objective** | Employee ID + password sign-in, sessions, throttle and reset, with the first real screens |
| **Prerequisites** | PH-3 (CFG-001–003, 007); S-02 and S-06 results; CD-01 for the reset slice |
| **Modules** | AuthService, SessionService, PasswordService, EmailService (queue), the shell and sign-in UI |
| **Database work** | `users` (credential fields marked `secret`), `sessions`, `password_resets`, `email_log` |
| **Backend work** | Iterated HMAC-SHA256 with salt, algorithm id and iteration count; first-Admin bootstrap tool (owner-run); 256-bit token, hashed at rest, cache read-through, sliding idle timeout; throttle under lock; forced password change gate; reset flow through the job queue |
| **Frontend work** | Shell, sign-in screen, forced-change screen, reset pages, idle timer, expiry handling, `CLIENT_OUTDATED` prompt |
| **Tests** | AUTH, API-002, 003, 005, 018; acceptance §12 checks for sign-in |
| **Documentation** | API-CONTRACT §5 confirmed; ARCHITECTURE §7 updated with the chosen iteration count; PROJECT-STATE |
| **Acceptance criteria** | A new user must change the temporary password before any other screen opens; five wrong passwords pause that ID for 15 minutes and the response never says whether the ID exists; a session idle for 30 minutes is refused; a deactivated user's token is refused at once; a reset link works once and expires after 30 minutes; no password or token appears in any log |
| **Risks** | Hashing too slow or too weak (S-02); sessions lost to cache eviction (sheet is the truth); the owner account mail quota (personal Gmail, to verify in S-06) |
| **Definition of done** | Slice DoD; the first-Admin bootstrap is documented and the tool refuses to run on a populated live database |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 4-001 | S | Implement PasswordService (salt, iterated HMAC, versioned parameters, rehash on sign-in, password rule FX-002) + users table + the owner-run first-Admin bootstrap tool + tests | 3-006, 0-007 | — | AUTH | M |
| 4-002 | S | Implement SessionService (random token, hash at rest, cache read-through, sliding idle timeout, once-a-minute touch, end, purge job) + tests | 4-001 | — | AUTH | M |
| 4-003 | S | Implement `auth.signIn`, `auth.signOut`, `auth.me`, the throttle under lock, generic failure, `AUTH_LOCKED`, pipeline steps 4–5 (authenticate, context) and the `must_change_password` gate + audit events + tests | 4-002, 2-005 | — | AUTH, API | L |
| 4-004 | S | Implement `auth.changePassword` (rule, end other sessions, audit) + tests | 4-003 | — | AUTH | S |
| 4-005 | S | Implement the reset flow (`requestReset`, `completeReset`, hashed single-use 30-minute token, mail through the job queue with `email_log`) + tests | 4-003, 2-008 | CD-01 | AUTH | M |
| 4-006 | U | Build the shell, sign-in, forced password change and reset screens with idle timer and expiry handling; phone/tablet/desktop; acceptance §12 sign-in checks | 4-003 to 4-005 | S-01 | AUTH, UI smoke | L |

---

### PH-5 — Authorization

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-5 |
| **Objective** | One server-side permission system: roles, scope, delegation and FLAG-001 enforced in the pipeline and in every read |
| **Prerequisites** | PH-4; G-06 only for the matrix-editor slice |
| **Modules** | PermissionService, DelegationService, UserService |
| **Database work** | `role_permissions` (VER), `user_brands`, `user_locations`, `delegations`; users: role and FLAG-001 |
| **Backend work** | Seed the matrix from PERMISSIONS (⛔ cells as deny); `can(ctx, PERM, resource)`; scope specs; deny-by-default registry enforcement; delegation effective roles read live; users administration with guards |
| **Frontend work** | Navigation built from `auth.me` capabilities; "Acting as" banner; delegation and Users screens |
| **Tests** | TEST-PERM generated from the matrix (every PERM × role × scope, including deny cells), API-004, 005, 019 |
| **Documentation** | PERMISSIONS updated with the implemented AMB outcomes; API-CONTRACT catalogue confirmed |
| **Acceptance criteria** | An Officer calling a restricted method gets an access error from the server; an out-of-scope record returns `NOT_FOUND`; delegation end removes the extra access on the next call; nobody approves their own delegation or delegates onward; FLAG-001 is not delegated; the last active Admin cannot be removed; every `?` cell is denied |
| **Risks** | An undecided cell becomes an accidental grant (R-08); cached grants outliving a delegation (epoch and short TTL); privilege escalation through the matrix editor (G-06) |
| **Definition of done** | Slice DoD; the generated matrix test is green; ARC-06 and ARC-12 active; **schema freeze SG-2** tagged |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 5-001 | S | Implement the `role_permissions` seed (PERMISSIONS Appendix A and §8; ⛔ cells deny) and `PermissionService.can` with epoch cache and short TTL + generated TEST-PERM matrix tests | 4-003 | — | TEST-PERM | L |
| 5-002 | S | Implement the scope engine (`user_brands`, `user_locations`, scope spec builder, mandatory scope on repository reads, `NOT_FOUND` vs `NOT_IN_SCOPE`) + tests | 5-001 | — | TEST-PERM, API | L |
| 5-003 | S | Implement pipeline step 6 (registry-driven authorization, record-state hook interface for edit window CFG-004 and month lock) and activate ARC-06/12 + tests | 5-002 | — | API, TEST-PERM | M |
| 5-004 | S | Implement DelegationService (request, approval chain, cancel, end, effective roles from dates, no self-approval, no re-delegation, epoch bump) + `delegation.*` + tests | 5-003 | AMB-14, CD-24 | TEST-PERM, API | L |
| 5-005 | S | Implement FLAG-001 (user flag, PERM-117, at-least-one-holder guard, context flag, not delegable) + `users.setExecomFlag` + tests | 5-003 | — | TEST-PERM | S |
| 5-006 | S | Implement users administration (`users.*`: create with one-time temporary password, update, brands, reset password, clear cooldown, deactivate/reactivate ending sessions, no self-role-change, last-Admin guard) + tests | 5-003, 4-004 | AMB-15 (deactivate) | TEST-PERM, AUTH | L |
| 5-007 | S | Implement the permission-matrix editor backend (`perms.matrix.get/set`, VER, reason, last-Admin lockout guard, cache invalidation) + tests | 5-003 | **G-06** | TEST-PERM | M |
| 5-008 | U | Build navigation from capabilities, the "Acting as" banner, delegation request/approve/end screens and the Users administration screens; phone layout | 5-004 to 5-006 | — | TEST-PERM, UI smoke | L |

---

### PH-6 — Audit, Admin and platform services

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-6 |
| **Objective** | Make the audit trail visible and the Admin powers safe, and add the services every module relies on: files, backup, queue, integrity, health |
| **Prerequisites** | PH-5; G-05 (history design); G-02 for backup; CD-25 for purge |
| **Modules** | AuditService (viewer), AdminService, RecycleService, FileService, BackupService, IntegrityService, configuration screens |
| **Database work** | `recycle_bin`, `reassignment_queue` (table or view, ISS-P1-16), `files`, `backup_log`; audit archive structure |
| **Backend work** | Audit viewer with cursor paging; Admin edit with reason; Recycle bin delete/restore with unreferenced check; reassignment queue; FileService (private Drive, validation, `sha256`, role-checked open, no sharing); nightly backup and extra backups; integrity job; health API; restore tool |
| **Frontend work** | Audit viewer, Recycle bin, reassignment queue, health screen, Settings/Lookups/Holidays/permission-matrix screens |
| **Tests** | AUDIT, ADMIN, FILE, PLAT, API-013, 017 |
| **Documentation** | Runbooks: backup, restore, integrity findings; PERMISSIONS AMB-16 outcome; ARCHITECTURE §9, §17 confirmed |
| **Acceptance criteria** | Admin delete hides a record from every screen and report; restore brings it back; both appear in the audit log with reason; a referenced record cannot be deleted; a library or report file cannot be opened by link outside TDMS; the nightly backup runs and prunes to the count; the integrity job finds a planted unaudited write, orphan row and shared file; a restore on the test environment returns the data |
| **Risks** | Admin edit bypasses business rules; Drive quota and file size (S-03); backup run time near the limit; restoring over live data |
| **Definition of done** | Slice DoD; **schema freeze SG-3a** tagged; restore drill rehearsed once on test |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 6-001 | S | Implement the audit viewer (`audit.list` cursor paging, filters, Admin and Senior views, current + archive stub), `history.get` and `AUDIT.VIEWED` + tests | 5-003 | — | AUDIT, TEST-PERM | M |
| 6-002 | S | Implement `admin.edit` (reason required, validation by the owning entity schema, `row_version` +1, old/new in audit) and the closed-month correction rule + tests | 6-001 | AMB-16 | ADMIN, AUDIT | M |
| 6-003 | S | Implement Recycle bin (`admin.delete` only when unreferenced, snapshot rows, `restore`, list; purge deferred) + referential checker from the FK map + tests | 6-002 | CD-25 (purge only) | ADMIN | L |
| 6-004 | S | Implement the reassignment queue (`queue.list/reassign/close`, reason on close, deactivation hook registry used by later modules) + tests | 6-003 | ISS-P1-16 | ADMIN, TEST-PERM | M |
| 6-005 | S | Implement FileService (private folder buckets, `files` table, type/size/magic-byte validation, `sha256`, `files.upload/open/info`, PERM-130 per category and scope, no sharing, orphan detection) + tests with the FileStore fake and one run on dev Drive | 5-003, 2-010 | CD-17, S-03 | FILE | L |
| 6-006 | J | Implement BackupService (nightly copy under a brief lock, retention prune, extra backups before import/close/reopen/migration, log, failure alert) + tests | 2-008, 6-005 | **G-02** | PLAT, ADMIN | M |
| 6-007 | J | Implement the integrity job (audit coverage per `request_id`, FK orphans, text-guard, cell budget, file sharing, env marker, sequence gaps) and `system.health` + tests with planted defects | 6-001, 6-005 | — | PLAT, AUDIT | M |
| 6-008 | T | Implement the restore tool (maintenance flag, copy back or switch database, schema and integrity check, audit entry) and rehearse it on test | 6-006, 6-007 | — | PLAT | M |
| 6-009 | U | Build the audit viewer, Recycle bin, reassignment queue and health screens (cursor paging, reason prompts); phone layout | 6-001 to 6-007 | — | ADMIN, UI smoke | L |
| 6-010 | U | Build the Settings (effective date, reason, version history), Lookups and Holidays screens and the permission-matrix viewer (editor if 5-007 is done) | 3-006, 5-007 or view only, 6-001 | AMB-07 | TEST-CFG, UI smoke | L |

---

### PH-7 — Master data

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-7 |
| **Objective** | The controlled lists everything else points to: brands, regions, locations/stores, positions, stations, programs, with a generic import engine |
| **Prerequisites** | PH-6; Leo's lists (brands, regions, stores, positions, stations) |
| **Modules** | MasterDataService, ImportService (engine) |
| **Database work** | `brands`, `regions`, `locations` (typed), `positions`, `stations`, `programs`; import staging tables with row statuses and `legacy_ref` |
| **Backend work** | CRUD with deactivate-not-delete, brand code immutability, location type rules (D045), referential protection; WF-011 location deactivation skeleton with queue hook; generic import (upload, validate, preview, fix/skip, confirm, backup before commit) |
| **Frontend work** | Master data screens and the reusable import review screen |
| **Tests** | EMP (identity-adjacent), ADMIN, TEST-PERM for PERM-061, TEST-CFG |
| **Documentation** | DATA-MODEL M-items closed for these tables; migration notes |
| **Acceptance criteria** | A store other records point to cannot be deleted, only deactivated; only Store-type locations count in coverage; import saves nothing until the review shows every row valid or skipped; commit takes a backup first |
| **Risks** | Wrong seed lists; import engine too specific to one source; location type growth (CD-03) |
| **Definition of done** | Slice DoD; **schema freeze SG-3b** tagged |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 7-001 | S | Implement brands and regions (CRUD, code immutable, deactivate, history F) + permissions (PERM-061) + validation + API + tests | 6-009 | Leo's lists | TEST-PERM, ADMIN | M |
| 7-002 | S | Implement locations/stores (typed per D045, brand, region, frequency, status, unique name per brand) + permissions + validation + API + tests | 7-001 | CD-03 | TEST-PERM, ADMIN | M |
| 7-003 | S | Implement positions (level, requires HO tech val), stations (certification required, brand scope) and programs + permissions + validation + API + tests | 7-001 | — | TEST-PERM, ADMIN | M |
| 7-004 | S | Implement the WF-011 location-deactivation skeleton (status history, queue hook registry for later modules, past records keep the location ID) + tests | 7-002, 6-004 | — | ADMIN | S |
| 7-005 | J | Implement the generic ImportService (staging, validation framework, preview, fix/skip, confirm, `legacy_ref`, backup before commit) and use it to import brands, locations, positions, stations | 7-003, 6-006 | Leo's lists | ADMIN | L |
| 7-006 | U | Build the master data screens and the reusable import review screen (cards on phone) | 7-001 to 7-005 | — | UI smoke | L |

---

### PH-8 — Person and Employee

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-8 |
| **Objective** | One identity per human, the employee record, the HR and TDD imports, and the deactivation workflow — the foundation every business module links to |
| **Prerequisites** | PH-7; G-07 (HR masterlist sample, TDD list); AMB-04, AMB-15 |
| **Modules** | PersonService, EmployeeService, ImportService (HR, TDD team) |
| **Database work** | `persons`, `person_aliases`, `employees`, `employee_assignments`; users linked to persons |
| **Backend work** | PersonService as the single identity writer (TEMP alias, never silent merge, duplicate check name + mobile (+ birth date)); EmployeeService (HR number as text, statuses, assignments, field history); TDD team import; HR one-time import with number match then name + store review; employee deactivation workflow WF-008 and TDD user deactivation WF-012 using the queue |
| **Frontend work** | Employee list and profile, possible-match prompts, deactivation request/approval, HR import review |
| **Tests** | EMP, TEST-PERM, ADMIN |
| **Documentation** | DATA-MODEL freeze note; MIGRATION-PLAN import mappings; PROJECT-STATE: **foundation complete** |
| **Acceptance criteria** | A trainee with the same name and a different mobile becomes a new person; the same name and mobile shows a "possible match" prompt (Handover §12); deactivating an employee, store or TDD user moves open items to the supervisor queue; the HR number round-trips as text; a Supervisor cannot deactivate directly (E-03) |
| **Risks** | Import mapping inferred from a sample that is not representative (G-07); duplicate identities that are hard to unmerge; employee fields maintained in two places |
| **Definition of done** | Slice DoD; **schema freeze SG-3c** tagged; foundation exit review; test environment holds a synthetic full foundation data set |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 8-001 | S | Implement persons and aliases (PER- IDs, TEMP alias, duplicate check D006, `persons.matchCandidates`, merge only by confirmation) + permissions + validation + API + tests | 7-006 | — | EMP, TEST-PERM | L |
| 8-002 | S | Implement employees and assignments (digits-only HR number as text, status list, field history F, `employees.list/get/create/update`) + permissions + validation + API + tests | 8-001 | AMB-04 | EMP, TEST-PERM | L |
| 8-003 | J | Implement the TDD team import (persons, employees, users with one-time temporary passwords) through the import engine + dry-run tests | 8-002, 5-006 | G-07 | EMP | M |
| 8-004 | J | Implement the one-time HR masterlist import (match by number then name + store with review, `legacy_ref`, backup before commit) + dry-run on synthetic data and masked sample | 8-002, 7-005 | G-07 | EMP | L |
| 8-005 | S | Implement WF-008 and WF-012 (deactivation request, Admin decision, queue hook, reactivation, sessions and delegations ended for users) + tests | 8-002, 6-004 | AMB-15 | EMP, ADMIN | L |
| 8-006 | U | Build the employee list and profile, match prompts, deactivation request/approval and HR import review screens | 8-001 to 8-005 | — | UI smoke | L |
| 8-007 | T | Foundation exit: run the full regression on test with a synthetic foundation data set, update PROJECT-STATE, tag `schema-foundation`, review the parking lot | 8-006 | — | all so far | S |

---

### PH-9 — Store visits, Calendar and Store Health (REL-1)

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-9 |
| **Objective** | Plan, log and count store visits, show them in Calendar and compute Store Health v2.0.0; the first release to real users, replacing SVMI |
| **Prerequisites** | PH-8; ISS-P1-06 (PROP-001); ISS-P1-18; ISS-P1-07 for the acceptance parity test; configuration values for Store Health seeded (PH-3) |
| **Modules** | VisitService, StoreHealthService, Calendar read model, report generation (Daily Activities, Store Visit Report) |
| **Database work** | `visit_plans`, `store_visits`, `visit_officers`, `visit_failure_types` (shape per PROP-001), Store Health summary table |
| **Backend work** | Visit rules; plan state machine with drag rules; visit log with duplicate warning and offline `client_ref`; Store Health pure rules with the failure input as a parameter; refresh job; calendar composite read; report generation; SVMI history import |
| **Frontend work** | Shared Plan visit form, Calendar (tap, drag, Move to date), Log visit with offline drafts, Store Health screens, Daily Activities |
| **Tests** | VISIT, CAL, RISK, REPORT, TEST-PERM |
| **Documentation** | WORKFLOWS WF-003 confirmed; Store Health parity report; PROJECT-STATE; legacy cutover note for SVMI |
| **Acceptance criteria** | Two visits to one store on the same day both count after a warning; a store whose only failure was 5 months ago carries no penalty and one that failed last month and is clean this month carries 4; planning from any store screen creates one plan shown in Calendar; Calendar drag works on a phone; an officer edits own visit within 24 hours and is blocked after; Store Health scores match SVMI on a test set (needs ISS-P1-07) |
| **Risks** | PROP-005: Store Health reads CAPAR failures that arrive in PH-10 (handled by the parameter port and slice 10-007); SVMI source file missing; visit report Option A vs B; offline storage may not persist (S-05) |
| **Definition of done** | Slice DoD; **SG-4 visits** tagged; **REL-1 readiness (9-013)** passed; SVMI read-only |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 9-001 | D | Define and provision the visit tables (plan and log per PROP-001, officers, failure types), registry and repository contract tests; freeze **SG-4a** | 8-007 | ISS-P1-06 | DATA, VISIT | M |
| 9-002 | R | Implement the visit rules (one purpose, system purposes, duplicate warning same store/date/purpose, edit window, counting every record) + vectors + tests | 9-001 | — | VISIT | M |
| 9-003 | S | Implement plans (`plans.create/move/reassign/cancel`, WF-003 state machine, D040 officer-own drag rule, same-day warning) + permissions PERM-012–014 + validation + API + tests | 9-002 | AMB (Admin move `?`) | VISIT, TEST-PERM | L |
| 9-004 | S | Implement the visit log (`visits.log/edit/list/get`, multiple officers, failure types, `client_ref` dedupe, edit window, month lock hook) + permissions PERM-010/011 + validation + API + tests | 9-002, 6-005 | — | VISIT, TEST-PERM | L |
| 9-005 | R | Implement the Store Health v2.0.0 rules (purpose scores, failure penalty and decay, compliance, cadence, tiers, attention reason, year-to-date window, floor 0) with the failure list as an input + Handover vectors + tests | 9-002, 3-006 | — | RISK | L |
| 9-006 | S | Implement StoreHealthService (summary table, `updated_at`, enqueue refresh after saves, `health.list/get/refresh`, "as of" settings bundle) + tests | 9-005, 2-008 | ISS-P1-07 (parity) | RISK, API | M |
| 9-007 | S | Implement `calendar.load` (composite read of plans and visits, scope-filtered; sessions hook for PH-14) + tests | 9-003, 9-004 | — | CAL | M |
| 9-008 | S | Implement Daily Activities and the Store Visit Report (template Option B unless decided otherwise; PDF through the Pdf port; `visits.attachReport`) + tests | 9-004, 6-005 | ISS-P1-18, S-03 | REPORT, VISIT | L |
| 9-009 | J | Implement the SVMI visit history import (pipe-separated visitors to rows, year from source tab, `legacy_ref`, backup before commit) + dry-run tests | 9-004, 7-005 | SVMI export file (ISS-P2-06) | VISIT | L |
| 9-010 | U | Build the shared Plan visit form and Calendar (tap, drag, Move to date, day/agenda view on phones) | 9-003, 9-007 | — | CAL, UI smoke | L |
| 9-011 | U | Build Log visit with offline drafts (author-only, dedupe, removed after sync) and the visit report attach/generate UI | 9-004, 9-008 | S-05 | VISIT, UI smoke | L |
| 9-012 | U | Build the Store Health list and detail screens and Daily Activities screen, showing "updated at" | 9-006, 9-008 | — | RISK, UI smoke | M |
| 9-013 | T | **REL-1 readiness:** scoped security review (auth, authz, files, XSS), restore drill on test, live provisioning check (ownership, 2-step verification, quotas, triggers installed), UAT script from Handover §12 for PH-0–9 | 9-010 to 9-012, 6-008 | — | PLAT, TEST-PERM | M |
| 9-014 | T | Release REL-1 to live, set SVMI read-only, record in PROJECT-STATE, phase exit review | 9-013 | — | — | S |

---

### PH-10 — CAPAR

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-10 |
| **Objective** | CAPAR from finding to closure and QA endorsement, linked to visits and Store Health without double counting |
| **Prerequisites** | PH-9; ISS-P1-01, ISS-P1-10, ISS-P1-15, ISS-P1-19; CD-04, CD-07, CD-15, CD-16 as each slice names |
| **Modules** | CaparService, report PDF, Boards (stage tracker framework) |
| **Database work** | `capar_cases`, `capar_officers`, `capar_findings`, `capar_corrective_actions`, `capar_finding_photos` |
| **Backend work** | Stage state machine; duplicate block; working-day due dates stamped with the SLA bundle; findings in the report's own numbering; photos; Verified creating or linking the verification visit; PDF and QA email through jobs; overdue flags; wiring failures into Store Health |
| **Frontend work** | CAPAR list/detail/forms, finding blocks, photo upload (camera), Boards CAPAR tracker |
| **Tests** | CAPAR, RISK, VISIT, TEST-PERM, REPORT |
| **Documentation** | WORKFLOWS WF-004 confirmed; open stage-target values recorded; PROJECT-STATE |
| **Acceptance criteria** | A case cannot close without a QA endorsement date; a case past its stage target shows overdue; a second case with the same store, audit type and audit date is blocked; the PDF reaches the QA address and the send date is recorded; marking Verified adds one verification visit (officer's KRA +1, store score −4) and marking again does not count twice; photos added to finding 2 appear under finding 2 in the PDF; a QA report with items 1–3 (2a and 2b inside 2) drafts three blocks |
| **Risks** | QA endorsement semantics undefined (ISS-P1-01); only the first stage target is decided; AI approval; PDF with many photos (S-03) |
| **Definition of done** | Slice DoD; **SG-5** tagged; legacy CAPAR tracking read-only; REL-2 released |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 10-001 | D | Define and provision the CAPAR tables incl. `qa_endorsed_on`, registry and contract tests; freeze **SG-5a** | 9-014 | ISS-P1-01 | DATA, CAPAR | M |
| 10-002 | R | Implement the CAPAR rules (stage machine, duplicate key, working-day due dates from the SLA bundle, overdue derivation; a stage without a configured target has no due date and returns `CONFIG_MISSING` for the target) + vectors + tests | 10-001, 3-004 | ISS-P1-10 | CAPAR | M |
| 10-003 | S | Implement case open/get/list (duplicate block, QA report file required, assignment) + permissions PERM-020 + validation + API + tests | 10-002, 6-005 | CD-04 | CAPAR, TEST-PERM | L |
| 10-004 | S | Implement finding blocks and corrective actions (report's own numbering, a/b/c inside one block, `ai_drafted` flag) and photos (limits from CFG-062) + permissions PERM-025 + API + tests | 10-003 | ISS-P1-15, M4 | CAPAR | L |
| 10-005 | S | Implement `capar.schedule` and `capar.markVerified` with the verification visit created or linked, once only, for the marking officer + permissions + API + tests | 10-003, 9-004 | AMB-05, ISS-P1-19 | CAPAR, VISIT, TEST-PERM | L |
| 10-006 | J | Implement the CAPAR PDF (photos under findings) and the QA email job, send date and `sent_to_email` stamp; `recordEndorsement` and `close` rules | 10-004, 10-005, 2-008 | ISS-P1-01, CD-16, CD-07 | CAPAR, REPORT | L |
| 10-007 | S | Implement overdue monitoring, reassignment-queue adapter (WF-013) and digest hooks for CAPAR | 10-006, 6-004 | — | CAPAR | M |
| 10-008 | J | Wire CAPAR failures into Store Health (replace the parameter source; PROP-005) and run the parity tests with real cases | 10-003, 9-006 | ISS-P1-07 | RISK, CAPAR | M |
| 10-009 | J | **On hold:** implement the AI checklist draft (provider/model settings, key in Script Properties, flagged output, call log) | 10-004 | ISS-P0-18, CD-29 | CAPAR | L |
| 10-010 | J | Implement the CAPAR history import (mapping after samples) | 10-003, 7-005 | ISS-P2-06 | CAPAR | M |
| 10-011 | U | Build CAPAR list, detail, finding blocks with photo upload/camera, stage actions and the Boards stage-tracker framework with the CAPAR board | 10-003 to 10-008 | — | CAPAR, UI smoke | L |

---

### PH-11 — Trainees and EXECom

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-11 |
| **Objective** | Track a trainee from enrollment to Passed with the approved timeline and grading, and produce EXECom from status records |
| **Prerequisites** | PH-8, PH-6 (imports, files); ISS-P1-02, ISS-P1-12, ISS-P1-17, ISS-P1-20; Leo's sample data (v0.1 R-04) |
| **Modules** | TraineeService, AssessmentService, ImportService (trainee), EXECom report |
| **Database work** | `training_durations`, `station_plans`/`blocks`, `assessment_components`, `station_components`, `batches`, `trainee_enrollments`, `trainee_station_results`, `assessments`, import staging for trainees |
| **Backend work** | Timeline rule for both tracks; grading rule with weight redistribution; station-by-station results with retakes; Passed creating the employee; duplicate check; import template with verification by FLAG-001; EXECom counts from status history |
| **Frontend work** | Trainee list/detail, enrollment, grade entry, batches, import review, EXECom, Boards trainee tracker |
| **Tests** | TRAIN, TEST-PERM, EMP, REPORT |
| **Documentation** | WORKFLOWS WF-001/009 confirmed; DATA-MODEL M3 closed; import template; PROJECT-STATE |
| **Acceptance criteria** | An imported row with blank milestone dates gets them from the timeline settings and "Dec 10 - Jan 03" saves as 2026-12-10 to 2027-01-03; HO exam 90, tech val 88, in-store 86 and ISTV 92 give 88.9 and fail the staff mark of 89; a Franchise rider with only HO exam 91 passes with 91; changing weights leaves saved grades unchanged; a Manager failing Cashier shows Extended and only Cashier is retaken on the next Friday; setting one brand's Corporate length to 60 days changes only that brand's trainees enrolled after the change; Store Head/Area Manager cannot open trainee monitoring |
| **Risks** | Extension and failure semantics undecided (ISS-P1-02); import mapping from a sample; grade history must stay immutable; the training memo is on hold (D051) |
| **Definition of done** | Slice DoD; **SG-6** tagged; ENDORSEMENT/EXECOM legacy sheets read-only; REL-3 released |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 11-001 | D | Define and provision the trainee-side configuration tables (durations, station plans/blocks, components, station components — VER) with services, validation (weights total 100, positions and stations exist) and stamps + tests | 8-007, 3-006 | ISS-P1-20, CD-27 | TRAIN, TEST-CFG | L |
| 11-002 | R | Implement the trainee timeline rule (both tracks, brand override, Thursday/Friday anchors, holidays) + Handover vectors (Juan Luna, batch 1A-26) + tests | 11-001, 1-001 | ISS-P1-17 | TRAIN | M |
| 11-003 | R | Implement the grading rule (per station, 10/20/70, SOD, weight redistribution, pass mark per station, retake grade rows) + vectors (88.9 fails; franchise 91 passes) + tests | 11-001 | — | TRAIN | M |
| 11-004 | D | Define and provision batches, trainee enrollments, station results and assessments (batch code as text) + registry and contract tests; freeze **SG-6a** | 11-001 | ISS-P1-02 (M3) | DATA, TRAIN | M |
| 11-005 | S | Implement batches (`batches.*`, DTS valid, code as text) + permissions PERM-042 (deny until AMB-06) + validation + API + tests | 11-004 | AMB-06 | TRAIN, TEST-PERM | M |
| 11-006 | S | Implement enrollment (`trainees.enroll` with duplicate check D006, TEMP alias, milestone dates stamped with the timeline version, `trainees.adjustDates` logged) + permissions PERM-041/043 + API + tests | 11-002, 11-005, 8-001 | — | TRAIN, EMP, TEST-PERM | L |
| 11-007 | S | Implement grades and station results (`recordGrade`, `confirmStationResult` stamping the bundle and `passing_mark_used`, retake scheduling, Extended while retaking, Failed at the end unless a supervisor records another result, Passed when all stations pass) + permissions + API + tests | 11-003, 11-006 | ISS-P1-02, CD-09, AMB-06 | TRAIN, TEST-PERM | L |
| 11-008 | S | Implement Passed creating the employee through EmployeeService (assigned store and position) and the HR endorsement/regularization records (D038) + tests | 11-007, 8-002 | CD-10 | TRAIN, EMP | M |
| 11-009 | J | Implement the trainee import template (MOBILE and BIRTH DATE columns, "9E-26" repair, range splitting, verification and commit by FLAG-001 only, backup before commit) + tests | 11-006, 7-005, 5-005 | ISS-P1-12, AMB-12 | TRAIN, TEST-PERM | L |
| 11-010 | S | Implement the EXECom report computed from status history on the report date (summary-backed, Training Department only) + tests | 11-007 | — | TRAIN, REPORT, TEST-PERM | M |
| 11-011 | J | **On hold:** implement the training memo (HTML templates, print view, PDF, batch, issued-letter record) | 11-006 | D051 | REPORT | L |
| 11-012 | J | Implement the legacy EXECOM MASTER_LOG import (809-row dry-run, reconciliation report) | 11-009 | sample data | TRAIN | M |
| 11-013 | U | Build trainee list/detail, enrollment, grade entry, batches, import review, EXECom screens and the Boards trainee tracker | 11-005 to 11-010, 10-011 | — | TRAIN, UI smoke | L |

---

### PH-12 — Team Leaders

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-12 |
| **Objective** | The Team Leader lifecycle from enrollment to certification, extension, quit and promotion, with full history |
| **Prerequisites** | PH-11 (assessment components and AssessmentService), PH-9 (TLTC visits); ISS-P1-03, ISS-P1-04 |
| **Modules** | TlService |
| **Database work** | `tl_enrollments`, `tl_extensions`, `tl_certifying_officers`, `uniform_transactions`, TL history view |
| **Backend work** | Deadline and certification rules with stamps; enrollment from the employee profile; entry grades; certification check; certify/extend/close/return/promote; quit with reasons; uniforms; TLTC link and queue rule |
| **Frontend work** | TL list and record with history tab, enrollment from the profile, Boards TL tracker, certification forms, uniforms |
| **Tests** | TL, TEST-PERM, VISIT, CLOSE |
| **Documentation** | WORKFLOWS WF-002 confirmed; TL formula note (D053) |
| **Acceptance criteria** | A TL cannot reach certification check without all required entry grades, or be certified without checklist, exam and one feedback score; the final equals 0.30 × checklist + 0.40 × exam + 0.30 × feedback with feedback 0.60 × kitchen + 0.40 × manager (once confirmed); extending moves the deadline by 30 days and returns the TL to certification check; only a Certified TL can be promoted; an officer can certify, extend and close without approval and promote stays hidden; a quit closes as Quit, cancels the open TLTC plan and allows re-enrollment |
| **Risks** | Formula unconfirmed (D053); extension limit and quit reasons open; legacy sheet averages that do not match; "*" meanings unknown |
| **Definition of done** | Slice DoD; **SG-7** tagged; TL Monitoring sheet read-only; REL-4 released |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 12-001 | D | Define and provision the TL tables and the history view; registry and contract tests; freeze **SG-7a** | 11-013 | ISS-P1-04 | DATA, TL | M |
| 12-002 | R | Implement the TL rules (deadline = entry + probation, certification final, feedback weights, stage machine, numbered extensions, stamps) + vectors + tests | 12-001, 3-006 | ISS-P1-03 (D053, CD-26) | TL | M |
| 12-003 | S | Implement enrollment (one open enrollment per person, from the employee profile) and entry grades (list from CFG-046) + permissions PERM-030 + API + tests | 12-002, 11-007 | — | TL, TEST-PERM | L |
| 12-004 | S | Implement certification check, certify, extend, close and return to probation (no approval, D067; numbered extension rows; limit from CFG-047 returns `CONFIG_MISSING` until set) + permissions PERM-031/033 + API + tests | 12-003 | CD-11 | TL, TEST-PERM | L |
| 12-005 | S | Implement promote (Certified only; PERM-034 deny for Admin until AMB-02) and quit (reason list, closes as Quit, cancels the TLTC plan, re-enrollment) + permissions + API + tests | 12-004, 9-003 | CD-06, AMB-02 | TL, TEST-PERM | L |
| 12-006 | S | Implement uniform transactions (duplicate block) and the TLTC link plus queue rule (no officer, visit or certification by the visit date) + tests | 12-003, 9-003, 6-004 | — | TL | M |
| 12-007 | J | Implement the legacy TL import (mapping, typed averages kept as legacy and mismatches flagged) | 12-003, 7-005 | sample + mapping confirmation | TL | M |
| 12-008 | U | Build TL list, record with history tab, enrollment from the employee profile, certification forms, uniforms and the Boards TL tracker | 12-003 to 12-006, 11-013 | — | TL, UI smoke | L |

---

### PH-13 — Proficiency and expiry

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-13 |
| **Objective** | Station certifications and cross-training with validity, the matrix, and expiry tasks that cannot pile up |
| **Prerequisites** | PH-11, PH-12, PH-9; ISS-P1-05, ISS-P1-08, ISS-P1-11; CD-12 |
| **Modules** | ProficiencyService, ExpiryService |
| **Database work** | `station_certifications`, `validations`, `expiry_tasks`, `expiry_task_items`, matrix summary |
| **Backend work** | Certification rules with `valid_until` and months stored; supersession; early flag; validation with required grades and photo proof; home-station creation from trainee Passed; matrix read model; expiry scan; assignment and scheduling |
| **Frontend work** | Proficiency matrix, record-validation form with photo proof, expiry task queue, employee certification history |
| **Tests** | CERT, TEST-PERM, REPORT |
| **Documentation** | WORKFLOWS WF-005/014 confirmed; DATA-MODEL M5 closed |
| **Acceptance criteria** | An employee regularized on 01 Apr 2026 can be recorded for Food Prep on 01 Jul 2026 only with a remark and shows the Early flag; after a passed validation with photos the matrix shows the home station and the cross-trained station with valid-until dates; a record without grades and photo proof for every required component cannot be saved; expiring certifications appear as one task per store; a task with no officer reaches the supervisor queue; a changed validity setting does not move existing expiry dates |
| **Risks** | Cross-training pass rule open; warning window and flag days open; 20,000-row matrix performance (summary table); the visit purpose for expiry visits (ISS-P1-08) |
| **Definition of done** | Slice DoD; **SG-8** tagged; proficiency legacy sheet read-only; REL-5 released |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 13-001 | D | Define and provision certification, validation and expiry tables; registry and contract tests; freeze **SG-8a** | 12-008 | M5 (expiry status names) | DATA, CERT | M |
| 13-002 | R | Implement the certification rules (validity months → `valid_until` stored with months used, derived Expiring/Expired, supersession, early flag) + vectors + tests | 13-001, 3-006 | CD-12, CD-13 | CERT | M |
| 13-003 | S | Implement `certs.recordValidation` and `certs.recordCrossTraining` (required components with grades and photo proof, early remark, pass rule from CFG-054) + permissions PERM-050 + API + tests | 13-002, 6-005, 11-007 | CD-14 | CERT, TEST-PERM | L |
| 13-004 | J | Implement home-station certifications from trainee Passed (D057), a backfill for trainees passed earlier, and the certification import | 13-003, 11-008 | sample data | CERT | M |
| 13-005 | S | Implement the matrix read model (summary table, `meta.as_of`, scope) + `certs.matrix/get/history` + permissions PERM-051 + tests | 13-003 | — | CERT, TEST-PERM | M |
| 13-006 | J | Implement the expiry scan job (warning at the window, one task per store, earliest first, unassigned/unscheduled flag from CFG-051/052; `CONFIG_MISSING` until set) + tests | 13-002, 2-008 | CD-13 | CERT, JOB | M |
| 13-007 | S | Implement expiry task assign, schedule (creates a linked plan) and complete + queue adapter + permissions PERM-052/053 + API + tests | 13-006, 9-003, 6-004 | ISS-P1-08 | CERT, TEST-PERM | L |
| 13-008 | U | Build the proficiency matrix, validation form with photo proof, expiry task queue and certification history screens | 13-003 to 13-007 | — | CERT, UI smoke | L |

---

### PH-14 — Training sessions, Library and LMS help

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-14 |
| **Objective** | Record training sessions and attendance, show them in Calendar, and provide the library and non-AI LMS help |
| **Prerequisites** | PH-8, PH-6 (files); PH-9 for the calendar slice; AMB-13 |
| **Modules** | TrainingService, LibraryService |
| **Database work** | `training_sessions`, `session_facilitators`, `attendance`, `resource_categories`, `resources`, `faqs`, `lms_questions` |
| **Backend work** | Session CRUD with types and facilitator; attendance by person ID; post-test with stamped passing score; calendar hook and drag; library with restricted flag and versions; LMS search, ask, answer, publish |
| **Frontend work** | Training screens, session items in Calendar, library, LMS help |
| **Tests** | TRAIN, CAL, FILE, TEST-PERM |
| **Documentation** | WORKFLOWS and DATA-MODEL confirmations; library category notes |
| **Acceptance criteria** | A session created in Training appears in Calendar and can be dragged to another date; attendance is stored by person ID; a restricted file is hidden from roles without PERM-071 and cannot be opened by link; an LMS question reaches the supervisors' queue and an answer can be published as an FAQ |
| **Risks** | Calendar integration touching PH-9 tables; file size limits; LMS ask permission undecided (AMB-13) |
| **Definition of done** | Slice DoD; **SG-9** tagged; REL-6 released |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 14-001 | D | Define and provision training session, facilitator and attendance tables; registry and contract tests; freeze **SG-9a** | 8-007 | — | DATA, TRAIN | S |
| 14-002 | S | Implement **training session CRUD + permissions (PERM-060) + validation (types incl. Team Leader, facilitator) + API (`training.sessions.*`) + tests** | 14-001 | — | TRAIN, TEST-PERM | M |
| 14-003 | S | Implement attendance and post-test (by person ID, score vs CFG-037 stamped) + `training.attendance.mark` + tests | 14-002 | — | TRAIN | M |
| 14-004 | S | Implement sessions in Calendar (`calendar.load` includes sessions, `training.sessions.move` for drag) + tests | 14-002, 9-007 | — | CAL, TRAIN | S |
| 14-005 | S | Implement library categories and resources (upload through FileService, restricted flag, versions, memo no.) + permissions PERM-070/071/073 + API + tests | 6-005 | — | FILE, TEST-PERM | L |
| 14-006 | S | Implement LMS help (search with brand/topic filters, FAQ suggestions, ask to the supervisors' queue, answer, publish FAQ) + permissions PERM-072/073 + API + tests | 14-005, 6-004 | AMB-13 | TRAIN, TEST-PERM | M |
| 14-007 | J | Implement the past training sessions import | 14-002, 7-005 | sample data | TRAIN | S |
| 14-008 | U | Build training session and attendance screens, session items in Calendar (drag), library and LMS help screens | 14-002 to 14-006, 9-010 | — | TRAIN, UI smoke | L |

---

### PH-15 — KPI/KRA and month close

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-15 |
| **Objective** | Monthly five-KRA scorecards, department KPI, targets, attendance and survey inputs, and the month-end close with frozen snapshots |
| **Prerequisites** | PH-9, 11, 12, 13, 14; ISS-P1-09, ISS-P0-16, ISS-P1-13; CD-18, 19, 20 |
| **Modules** | KpiService, CloseService |
| **Database work** | `kra_definitions`, `kpi_targets`, `coaching_survey_results`, `team_attendance_log`, `month_closes`, `month_snapshots`, `month_snapshot_rows`, derived summaries |
| **Backend work** | KRA rules and bands; targets by month; attendance marking; survey import; scorecard service with summary tables; month close with staged snapshot job, lock enforcement across services, late-change note, reopen with reason and backup |
| **Frontend work** | My scorecard, scorecards, department KPI, targets, attendance, survey import, Month close and snapshot viewer |
| **Tests** | KPI, CLOSE, TEST-PERM, REPORT |
| **Documentation** | WORKFLOWS WF-006 confirmed; PROP-003 outcome; PROJECT-STATE |
| **Acceptance criteria** | An officer's KRA total equals the weighted sum of the five KRAs and the department KPI equals total actual ÷ total target per KRA; a change dated inside a closed month leaves that month's snapshot unchanged and shows in the next open month; a Manager or Admin can reopen with a written reason and a backup is taken first; officers see only their own scorecard |
| **Risks** | Survey source and cap undecided; snapshot job exceeding one run (staged, PROP-003); every module must honour the month lock (hook added in PH-5) |
| **Definition of done** | Slice DoD; **SG-10** tagged |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 15-001 | D | Define and provision KPI, attendance, survey, close and snapshot tables; registry and contract tests; freeze **SG-10a** | 14-008, 13-008, 12-008, 11-013, 9-014 | — | DATA, KPI | M |
| 15-002 | R | Implement the KRA rules (five formulas, weights, bands, department KPI, optional cap) + Handover vectors + tests | 15-001, 3-006 | CD-18 | KPI | M |
| 15-003 | S | Implement monthly targets (`kpi.targets.get/set`, VER, S or M) + permissions PERM-082 + API + tests | 15-001 | AMB-08 | KPI, TEST-PERM | S |
| 15-004 | S | Implement the team attendance log (supervisor daily marking) and the coaching survey import (source and maximum from CFG-084) + permissions PERM-083/084 + API + tests | 15-001 | AMB-09, CD-19 | KPI, TEST-PERM | M |
| 15-005 | S | Implement the scorecard service (visits count every record, sessions, certifications recorded, survey, attendance; summary tables with `as_of`; `kpi.myScorecard` own only; department KPI) + tests | 15-002 to 15-004 | — | KPI, TEST-PERM | L |
| 15-006 | S | Implement month close (`close.status/request`, staged snapshot job writing rows with rule stamps, `LOCKED` enforcement through the record-state hook in every writing service, late-change note) + permissions PERM-090 + tests | 15-005, 2-008 | AMB-10, CD-20, ISS-P0-16 | CLOSE, TEST-PERM | L |
| 15-007 | S | Implement reopen (`close.reopen`, Manager/Admin, reason, backup first, re-close) and the Admin correction rule inside closed months (AMB-16) + permissions PERM-091 + tests | 15-006, 6-006 | — | CLOSE, ADMIN | M |
| 15-008 | U | Build My scorecard, scorecards, department KPI, targets, attendance marking, survey import, Month close and snapshot viewer screens | 15-005 to 15-007 | — | KPI, CLOSE, UI smoke | L |

---

### PH-16 — Reporting and notifications

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-16 |
| **Objective** | One report registry over the authoritative records, the exports, the dashboards, notifications and the daily digest |
| **Prerequisites** | PH-9 to PH-15; AO-04; CD-21 for the digest |
| **Modules** | ReportService, NotificationService, ApprovalService (aggregate queue) |
| **Database work** | `notifications`, `email_log`, report registry data, `approval_requests` |
| **Backend work** | Report registry and three read modes (live, summary, frozen) with "as of" from status history and settings versions; training/trainee/certification, visit/CAPAR/Store Health/KPI and historical reports; export engine (print HTML, PDF, spreadsheet download, exports purge); notifications from the WORKFLOWS §9 set; digest job; role dashboards from summary tables; approvals queue |
| **Frontend work** | Reports, export, notification centre, digest preferences, dashboards, approvals queue |
| **Tests** | REPORT, JOB, TEST-PERM |
| **Documentation** | Report catalogue; WORKFLOWS §9 confirmed; PROJECT-STATE |
| **Acceptance criteria** | Every report equals its operational screen on the same data (parity tests); a closed month's report reads its snapshot and never recomputes; EXECom and trainee reports never reach Store Head/Area Manager; the digest lists a user's overdue items, items due this week and items awaiting approval; supervisors also see unassigned expiry tasks and overdue CAPAR stages; every dashboard shows "updated at" |
| **Risks** | Reports drifting from operational rules (mitigated by calling `rules/` only); PDF size and time; email quota (S-06); "Google Sheets" format (AO-04) |
| **Definition of done** | Slice DoD; REL-7 released |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 16-001 | S | Implement the report registry and ReportService (live/summary/frozen modes, "as of" by status history and settings version, permissions per report, `REPORT.RUN` audit for confidential ones) + tests | 15-008 | — | REPORT, TEST-PERM | L |
| 16-002 | S | Implement the training, trainee, TL, certification and expiry reports through the registry + parity tests against the operational reads | 16-001 | — | REPORT | L |
| 16-003 | S | Implement the visit, CAPAR, Store Health and KPI/KRA reports + parity tests | 16-001 | — | REPORT | L |
| 16-004 | S | Implement the historical and closed-month reports from snapshots and status history + tests (closed months never recomputed) | 16-001, 15-006 | — | REPORT, CLOSE | M |
| 16-005 | J | Implement the export engine (print HTML, PDF jobs, spreadsheet download, private exports folder with purge job) | 16-001, 6-005 | AO-04 | REPORT | L |
| 16-006 | S | Implement NotificationService (WORKFLOWS §9 events, `notifications.list/markRead`, email log) and the daily digest job (time and opt-out settings; `CONFIG_MISSING` until set) | 16-001, 2-008 | CD-21 | REPORT, JOB | L |
| 16-007 | S | Implement role dashboards from summary tables (counts of unassigned/overdue expiry tasks, overdue CAPAR, deadlines) with `as_of` and the approvals aggregate queue | 16-006 | — | REPORT, TEST-PERM | M |
| 16-008 | U | Build the reports, export, notification centre, digest preference, dashboard and approvals queue screens | 16-002 to 16-007 | — | REPORT, UI smoke | L |

---

### PH-17 — Hardening and go-live readiness

| Attribute | Content |
| --- | --- |
| **Phase ID** | PH-17 |
| **Objective** | Prove the system under load and attack, rehearse recovery, finish accessibility and documentation, and cut over |
| **Prerequisites** | All earlier phases; every P1 item closed; AO-05 and CD-22 decided |
| **Modules** | Cross-cutting |
| **Database work** | Performance indexes as summary tables where benchmarks demand; audit archive run; no schema change without a decision |
| **Backend work** | Fixes from the review; limit handling; quota guards |
| **Frontend work** | Accessibility, phone and tablet pass, keyboard alternatives |
| **Tests** | Full regression mapped to Handover §12; load tests; authorization fuzz; restore drill; PLAT, all families |
| **Documentation** | Runbooks (deploy, rollback, backup/restore, incident); user guides; MIGRATION-PLAN v1 (PostgreSQL boundary checklist); refreshed CLAUDE.md; final PROJECT-STATE |
| **Acceptance criteria** | Every Handover §12 acceptance check passes on a phone and on a desktop; the 6-minute jobs complete at realistic volume (about 4,000 employees, 20,000 certifications, 150 visits a month); the restore drill returns the data; the authorization fuzz finds no method without a matrix row; no secret in the repository; all legacy sheets read-only |
| **Risks** | Late discovery of a quota or limit; accessibility gaps; cutover data differences |
| **Definition of done** | Slice DoD; sign-off by Leo; REL-8 released |

| ID | Type | Task | Depends | Blocked by | Tests | Size |
| --- | --- | --- | --- | --- | --- | --- |
| 17-001 | T | Run the full security review (authorization fuzz over every registry method × role, XSS review, secrets scan, sharing audit, spreadsheet access list, owner 2-step verification) and fix findings | 16-008 | — | TEST-PERM, PLAT | L |
| 17-002 | T | Run load and limit tests (realistic volumes, paging, lock contention, quotas, cache eviction, 6-minute jobs) and tune within the architecture | 16-008 | — | PLAT, JOB | L |
| 17-003 | T | Run the backup restore drill and the audit archive procedure; confirm file backup approach | 17-001 | AO-05, CD-22 | PLAT | M |
| 17-004 | U | Run the accessibility and phone/tablet pass across all screens, including keyboard alternatives to drag | 16-008 | — | UI smoke | L |
| 17-005 | T | Run the Handover §12 acceptance checklist as a regression suite on test (every check mapped to a test ID) | 17-001, 17-002, 17-004 | — | all | L |
| 17-006 | T | Run the cutover rehearsal: final imports dry-run, reconciliation reports, legacy sheets read-only | 17-005 | sample data | all | M |
| 17-007 | T | Write the runbooks, user guides and MIGRATION-PLAN v1; refresh CLAUDE.md and PROJECT-STATE | 17-003 | — | — | M |
| 17-008 | T | Release REL-8 to live after the go-live checklist and UAT sign-off | 17-005 to 17-007 | — | all | S |

---

## 6. Stability gates (schema freeze checkpoints)

A freeze is a git tag on the schema registry plus a DATA-MODEL note. After a freeze, schema changes are **additive migrations only**, each with its own task and decision (ARCHITECTURE §4.2).

| Gate | After | Tag | Tables |
| --- | --- | --- | --- |
| SG-1 | 2-010 | `schema-core` | Core system tables: settings, lookups, audit/history, jobs, errors, counters |
| SG-2a | 3-006 | `schema-config` | Configuration tables and bundles |
| SG-2 | PH-5 | `schema-identity` | Users, sessions, permissions, delegations |
| SG-3a / 3b / 3c | PH-6 / PH-7 / PH-8 | `schema-foundation` | Files, recycle, queue; master data; persons and employees |
| SG-4 … SG-10 | each module's D slice | `schema-<module>` | Module tables (visits, CAPAR, trainees, TL, certification, training/library, KPI/close) |

R-03 makes the freeze the entry condition for every U slice.

---

## 7. Test ID families

Families come from TEST-STRATEGY: AUTH, TEST-PERM, EMP, TRAIN, TL, CERT, CAPAR, RISK, VISIT, CAL, KPI, CLOSE, REPORT, ADMIN, AUDIT, PLAT, FILE. This roadmap adds **DATA** (repository and schema), **JOB** (queue and worker), **TEST-CFG** (settings; written this way to avoid clashing with setting IDs `CFG-nnn`), **API** (API-CONTRACT §10), **ARC** (ARCHITECTURE §0.6). Exact IDs are allocated in each packet, numbered from 001 within the family, and map to Handover §12 acceptance checks in slice 17-005.

---

## 8. Conflicts and changes

| ID | Item | Handling |
| --- | --- | --- |
| R-01 | v0.1 phase labels (0, 1A–1F, 2–9) | Renumbered: 0 → PH-0; 1A → PH-1 and PH-2; 1B → PH-3; 1C → PH-4; 1D → PH-5; 1E → PH-6; 1F → PH-7 and PH-8; 2 → PH-9; 3 → PH-10; 4 → PH-11; 5 → PH-12; 6 → PH-13; 7 → PH-14; 8 → PH-15 and PH-16; 9 → PH-17. Other docs updated to the new labels in this change |
| R-02 | Instruction §12 lists Person/Employee before Training | Honoured: PH-8 precedes all business modules |
| R-03 | Instruction §12 puts Administration late; the Handover puts Admin/Recycle in the first phase | Admin primitives are in PH-6 because every module writes through them; Admin screens and settings UI are built there, hardening polish in PH-17 |
| R-04 | Handover phase 4 waits for Leo's sample data | Gate retained (11-001, 11-009, 11-012) |
| **R-05** | **Your foundation order lists audit after authorization** | The audit **writer** is built in PH-2 because authentication writes audit rows; the audit **module** (viewer, Admin edit/delete, Recycle bin, integrity) is PH-6, after authorization, as listed |
| **R-06** | **PROP-005:** Handover phase 2 (Store Health) reads CAPAR failures that exist only from phase 3 | Store Health rules take failures as an input parameter (9-005); real CAPAR data is wired in 10-008. Needs Leo's approval of PROP-005 |
| R-07 | Handover puts hardening last; live use starts at the first business phase | Slice 9-013 runs a scoped security and restore check before REL-1 (R-12) |
| R-08 | Instruction §12 lists reporting after the business modules; module-specific reports (EXECom, CAPAR PDF, Store Visit Report) are needed earlier | Module-specific outputs stay in their module phase; PH-16 builds the cross-module registry, exports, dashboards and digest |
| R-09 | Training memo (D051) is "proposed, approval pending" and is not in the v1 scope list | Slice 11-011 is on hold until approved |
| R-10 | AI features (D065, Option A report) conflict with Handover §9 (AI is v2) | Slice 10-009 is on hold (ISS-P0-18); the Visit Report uses the template unless decided |

---

## 9. The FIRST Claude Code task

### TDMS-0-001 — Initialise the repository, test runner and architecture checks

Why this one: it is the only slice with no dependency on a Google account, a time zone, the data model or any open business decision. It makes every later task testable and enforces the architecture from the first commit. It needs only the layout approval (G-04).

**Before it is issued (Leo):**
1. Approve or amend the repository layout and deploy flow (ARCHITECTURE §0.3 and §16.4) — gate **G-04**.
2. Confirm Claude Code has access to `lheiiyy/TDMS` and that the repository is empty or may be restructured.
3. Handover §11 lists the company account and the backup count as "needed before Phase 0 starts" (G-01, G-02). TDMS-0-001 touches neither, so it can start on G-04 alone. If you prefer to answer G-01–G-04 first, nothing changes. **Issue 0-002 only after G-01 and G-03.** This is a sequencing proposal, not a reopened decision.

```
TASK ID:        TDMS-0-001
TITLE:          Initialise repository, test runner and architecture conformance checks
OBJECTIVE:      A committed repository with the approved layout, the docs set, CLAUDE.md,
                a dependency-free test runner, and static checks that make the layer rules
                of ARCHITECTURE §0.2 fail the build when broken.

SCOPE:
  1. Repository layout exactly as ARCHITECTURE §0.3 (src/{api,services,rules,repository,
     platform,core,ui/shell,ui/modules}, config/{settings,schema,permissions}, tests/{rules,
     services,repository,arch}, tools, docs, spikes). Each empty folder carries a short
     README stating its layer rule (what it may and may not call).
  2. docs/: copy the 21 baseline documents unchanged (index file docs/README.md listing
     them with the authority order Handover > Plan Audit > other docs > prototype).
  3. CLAUDE.md at the repo root (short): what TDMS is; read order (CLAUDE.md, PROJECT-STATE,
     the docs the task names, affected source, tests); the layer rules; "no invented
     requirements"; the stop rule `BLOCKED — REASON — DECISION REQUIRED`; definition of
     done; commit rules; link to HANDOFF-MODEL and the packet template.
  4. package.json with test scripts using the Node built-in test runner only (no
     third-party dependency); `npm test` runs tests/**.
  5. Architecture checks ARC-01, 02, 03, 04, 07, 08, 10 implemented as static tests that
     scan src/ for forbidden tokens by folder (SpreadsheetApp, DriveApp, MailApp/GmailApp,
     UrlFetchApp, PropertiesService, CacheService/LockService outside platform/,
     Date/new Date/Utilities.getUuid outside the Clock and Ids adapters, literals that look
     like spreadsheet or Drive IDs, I/O at file load). ARC-05, 06, 09, 11, 12 are present
     as named pending tests (skipped with a reason) that later slices activate.
  6. Test fixtures that plant each violation in a temporary folder and prove the check
     fails, and prove it passes on a clean tree.
  7. .gitignore (excludes real clasp config, .env, node_modules, any file with IDs),
     `.clasp.json.template` and `tools/README.md` describing the future deploy flow
     (no real IDs).
  8. A minimal CI workflow that runs `npm test` on every push and pull request.
  9. Update docs/PROJECT-STATE.md (current phase PH-0, task TDMS-0-001 done, next TDMS-0-002
     blocked by G-01 and G-03) and add a CHANGELOG entry.

OUT OF SCOPE:
  Any Apps Script project, spreadsheet, Drive folder, clasp push or deploy; any service,
  rule, repository, UI or API code; Script Properties; time zone; schema; spikes;
  branch protection and GitHub repository settings (Leo does these in GitHub).

SOURCE DOCUMENTS:
  ARCHITECTURE §0.2, §0.3, §0.6, §16.4 · HANDOFF-MODEL §1–§6 · PROJECT-BIBLE ·
  ROADMAP §1, §9 · Master Instruction §11, §19, §24, §26.

BUSINESS RULES:      none
PERMISSIONS:         none
DATA CHANGES:        none
API CHANGES:         none
UI CHANGES:          none
CONFIGURATION:       none (no CFG id is read or written)

ACCEPTANCE CRITERIA:
  - The folder tree matches ARCHITECTURE §0.3; every folder has its README.
  - `npm test` passes on the clean tree with no third-party packages installed.
  - Each active ARC check fails when its violation fixture is planted and passes
    otherwise; the pending ARC checks are listed as skipped with the slice that activates
    them.
  - CLAUDE.md, docs/README.md and the 21 docs are present; the docs are byte-identical to
    the baseline copies.
  - No secret, spreadsheet ID, Drive ID or script ID exists anywhere in the repository.
  - CI runs and is green.
  - PROJECT-STATE.md and CHANGELOG are updated.
  - No file outside the scope was modified.

TESTS:               ARC-01, 02, 03, 04, 07, 08, 10 (active); ARC-05, 06, 09, 11, 12 (pending);
                     PLAT-001 (runner works with no dependencies)
DOCUMENTATION:       CLAUDE.md, docs/README.md, PROJECT-STATE.md, CHANGELOG.md
OPEN ISSUES BLOCKING: G-04 only. (G-01, G-02, G-03 do not block this task.)
```

**After it:** 0-002 (dev environment) needs G-01 and G-03. In parallel nothing else may start, because every later slice depends on the environments and test runner.

---

**ROADMAP READY FOR IMPLEMENTATION START: conditional on G-04 for TDMS-0-001; Phase 0 slices 0-002 onward need G-01 and G-03; the first data-layer slice (2-001) needs G-05.**
