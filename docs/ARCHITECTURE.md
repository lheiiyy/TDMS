# TDMS Architecture v1.0 — approved v1 platform (Google Sheets + Apps Script), migration-ready

Status: FINAL specification for review. Replaces v0.1. Logical design only. No application code, no sheet layout.
Authority: Handover §2, §7.4–§7.11, §8, D012, D020, D021, D023, D024, D027, D041, D047, D049 > Plan Audit §B > other approved docs > prototype (UX evidence only).

> **Amendment D069 (2026-10-08).** Decision D069 supersedes D012: one personal Gmail (`lheii.fcsitraining@gmail.com`, interim) owns the scripts, sheets and Drive for dev, test and live, and ownership must stay transferable ([account-transfer runbook](runbooks/account-transfer.md); Google ownership behaviour is verified in spike S-09). Wherever this document says "company account" or "company-owned" (the Files row in §0.1, §7 reset mail and quotas, §9 storage, the §20 gate paragraph), read it as "the owner account of D069". The live row of §16.1, AO-02 and S-06 are rewritten below. A personal account has no domain, so the "within the company domain" fallback of AD-01 exists only if the project later moves to a Workspace account.
Companions: [API-CONTRACT](API-CONTRACT.md) · [DATA-MODEL](DATA-MODEL.md) · [PERMISSIONS](PERMISSIONS.md) · [WORKFLOWS](WORKFLOWS.md) · [CONFIGURATION](CONFIGURATION.md) · [DECISION-GATE](DECISION-GATE.md).

**Marks.** *Approved* = stated in an approved source (cited). **Proposed** = engineering design made by this document inside the approved platform; it changes no business rule and needs the owner's sign-off through the packet that implements it. **Spike** = an assumption about the Apps Script platform that must be proven in Phase 0 before it is relied on (Appendix A). **Verify** = a Google quota or limit quoted from general knowledge; confirm on Google's current quota page before relying on the number.

---

## 0. Overview

### 0.1 Approved platform (not redesigned here)

| Concern | Approved v1 direction | Source |
| --- | --- | --- |
| Frontend | Apps Script `HtmlService` web app | §2 |
| Client abstraction | `api.js` (same method names later reused over `fetch()`) | §2, Audit §B |
| Backend | Modular Apps Script services | §2, Instruction §11 |
| Database | Google Sheets, one tab per table, built from scratch | §2, D047 |
| Files | Private Drive folder owned by the company account; opened only through TDMS after a role check | D012, D027 |
| Test | Separate development/test spreadsheet and Drive folder; never writes live data | D047, §2 |
| Source of truth | GitHub `lheiiyy/TDMS` | D041 |
| Future | New PostgreSQL schema in the same repo; only the repository and API transport are swapped | §2, D041 |

No part of this is changed. Where this document adds mechanism it is marked **Proposed** and listed in the decision register (§0.5) with the exact problem it solves.

### 0.2 Layers and the one rule that matters

```
UI (HtmlService shell + module views)
  → api.js (client abstraction)
    → tdmsApi (single server entry point) → request pipeline
      → Services (one per module; single writer per entity — DATA-MODEL §13)
        → Business rules (pure functions; no I/O; settings passed in)
        → Repository (the only code that touches SpreadsheetApp)
           → Google Sheets
        → Platform adapters (Clock, Lock, Cache, Mail, FileStore, Pdf, Http, Props)
           → CacheService / LockService / MailApp / DriveApp / UrlFetchApp / PropertiesService
```

Dependency directions (a layer may call only the layer(s) to its right in the list; nothing calls upward):

| Layer | May call | Must not call |
| --- | --- | --- |
| UI | `api.js` only | Any server function except via `api.js`; any rule |
| `api.js` | `google.script.run` → `tdmsApi` only | Business logic |
| Pipeline (`api/`) | Session, Permission, Settings, Services, Audit | Repository directly |
| Services | Rules, Repository, other Services' **public API**, Platform adapters | Another service's repository; `SpreadsheetApp`; `DriveApp` |
| Rules | Other rules, plain data | I/O of any kind, `Date.now`, global state |
| Repository | Platform adapters (Lock, Cache, Props), `SpreadsheetApp` | Services, rules (it knows tables, not business) |
| Platform adapters | The Google service they wrap | Everything else |

**Enforced, not hoped for (Proposed, tests ARC-01..ARC-13 in §0.6).** `SpreadsheetApp` appears only under `repository/`; `DriveApp` only in the FileStore adapter and the backup adapter; `MailApp`/`GmailApp` only in the Mail adapter; `UrlFetchApp` only in the Http adapter; `PropertiesService` only in `core/env`; `Date`/`Utilities.getUuid` only in Clock/Ids. A static test fails the build otherwise.

### 0.3 Repository layout (Proposed; confirms HANDOFF-MODEL §7 for gate G-04)

```
CLAUDE.md
docs/                        docs set
src/
  appsscript.json            manifest: V8, time zone (G-03), web-app settings
  api/                       tdmsApi, request pipeline, method registry, schemas
  services/                  one namespace per module (AuthService, VisitService, …)
  rules/                     pure business rules (grading, store health, SLA dates, timeline)
  repository/                table registry, readers/writers, unit of work, counters, history writers
  platform/                  adapters (clock, lock, cache, mail, filestore, pdf, http, props)
  core/                      ids, errors, validation, env guard, schema check, job runner
  ui/
    shell/                   index shell, router, api.js, session, offline-drafts, components
    modules/<module>/        view fragment + controller + styles (loaded on demand)
config/
  settings/                  setting definitions (CFG ids; type, validation, bundle)
  schema/                    table definitions generated from DATA-MODEL
  permissions/               seed role_permissions (PERMISSIONS §8, Appendix A)
tests/
  rules/ services/           run in Node with fakes (no Sheets)
  repository/                contract tests against the TEST spreadsheet
  arch/                      ARC-nn static checks
tools/                       clasp scripts, deploy, schema check, seed (owner-run only)
```

Source language: plain JavaScript (V8) with JSDoc types and `clasp`. No bundler, no front-end framework, no TypeScript build step (AD-13).

### 0.4 Request pipeline (every call, in this order)

| # | Step | Failure → error code |
| --- | --- | --- |
| 1 | `tdmsApi(envelope)` receives the call; size and shape check; unknown fields rejected | `VALIDATION` |
| 2 | Client build vs server build; stale clients are told to reload | `CLIENT_OUTDATED` |
| 3 | Method registry lookup. A method not in the registry does not exist (deny by default) | `NOT_FOUND` |
| 4 | Authenticate: hash the session token, load the session, idle check (CFG-001), user active, password-change gate | `AUTH_REQUIRED`, `SESSION_EXPIRED` |
| 5 | Build `RequestContext`: user, role, effective roles (delegation), scope (brands/stores), FLAG-001, `now`, `request_id`, environment | — |
| 6 | Authorize: PERM id from the registry + scope; record-state rules are checked inside the service | `FORBIDDEN`, `NOT_IN_SCOPE` |
| 7 | Validate params against the method's schema (type, required, enum, length) | `VALIDATION` |
| 8 | Writes only: take the script lock (short critical section, §14) | `BUSY` |
| 9 | Service runs: rules (pure) + repository through a unit of work; optimistic checks re-done under the lock | `CONFLICT`, `LOCKED`, `BLOCKED_BY_RULE`, `CONFIG_MISSING` |
| 10 | Flush unit of work (batched); audit and history rows included; release lock; enqueue jobs; bump cache epochs | `SERVER` |
| 11 | Map to a DTO (explicit fields only; never raw rows); build the envelope | — |
| 12 | Log: failures to `error_log`; slow calls flagged | — |

### 0.5 Architecture decision register

Status **APPROVED-SRC** = follows an approved source. **PROPOSED** = this document's design; the "Problem" column is the exact reason it exists.

| ID | Problem it solves | Decision | Status | Alternatives rejected |
| --- | --- | --- | --- | --- |
| AD-01 | Users sign in with Employee ID + password, not Google identity (D024); only the owner account may edit the database (§7.6); users may have no Google account | Web app deployed **Execute as: owner**, **Access: Anyone**. Identity comes only from the app session token. `Session.getActiveUser()` is never used for identity. Fallback if IT policy forbids "Anyone": "Anyone within the company domain" (all users then need company Google accounts; app sign-in still applies) | APPROVED-SRC (D024, §7.6, D012); the access setting is **Spike S-06** | Execute as user (users would need access to the database file; breaks §7.6) |
| AD-02 | `google.script.run` can call any public top-level function; many entry points bypass authorization | Exactly two public globals: `doGet` and `tdmsApi`. Everything else is namespaced or private (`_` suffix). All calls go through one dispatcher and a **method registry** (`module.action` → handler, PERM id, schema, lock, audit event) | PROPOSED (matches API-CONTRACT v0.1 naming) | One global function per method |
| AD-03 | One page holding all screens loads slowly on phones (Audit §B) | **Shell + lazy module views.** The shell loads once; each module's view fragment and controller load on first visit. Code is classic scripts in namespaces (no `import`). Fallback: ship all modules in the first load if lazy loading cannot run in the sandbox | PROPOSED; **Spike S-01** | Full page navigation (loses the session token, which has no cookie); one bundled page (the prototype's problem) |
| AD-04 | HtmlService pages run in a sandboxed iframe; cookies are not a reliable session carrier | Session token held in JS memory (and `sessionStorage` when available, wrapped in try/catch). Sent in every envelope. Server stores only its hash. No cookies, no token in URLs (except the 30-minute reset link) | PROPOSED (resolves ISS-P0-03) | Cookies; token in URL |
| AD-05 | Sheets silently converts text to numbers/dates ("9E-26" bug, §6.3); `google.script.run` cannot carry `Date` objects | Dates `yyyy-mm-dd` and timestamps ISO-8601 UTC stored and transported as **text**; ID-like columns formatted as plain text by the repository; all JSON, no `Date` over the wire | APPROVED-SRC (§8, DATA-MODEL P8–P9) | Native date cells |
| AD-06 | One spreadsheet is capped (10,000,000 cells, **verify**); history and audit tables grow fastest | One primary database spreadsheet per environment + yearly **archive** spreadsheets for audit and history (SY-009). The repository holds a table → location map, so a later split needs no service change | PROPOSED | Many spreadsheets from day one (more opens per request) |
| AD-07 | Saves must not run heavy rebuilds (6-minute timeouts; SVMI lesson, §2); trigger count is capped (20 per script, **verify**) | A `jobs` queue table + a `job_schedule` table, drained by **one** time trigger (every 5 minutes). Saves enqueue; the worker computes. Schedules (backup, digest, expiry scan) live in data, so the digest time (CFG-091) needs no redeploy | APPROVED-SRC for "queued, never in a save" (§2); mechanism PROPOSED | One trigger per job type |
| AD-08 | Sheets has no transactions and a script-wide lock is shared by everyone | `LockService` script lock around the read-check-write of each write only; **unit of work** flushes in a fixed order; best-effort atomicity plus a daily integrity check (§14, §10) | PROPOSED (resolves ISS-P0-13) | Long locks; per-entity locks (not available at script scope) |
| AD-09 | `CacheService` can evict at any time, has a 100 KB value limit and no tags | **Epoch invalidation:** each cached table carries an epoch; writers bump it; readers rebuild when the epoch moved. Authorization-relevant caches have a short TTL (§12) | PROPOSED | Time-only expiry (stale permissions) |
| AD-10 | Apps Script has no bcrypt/Argon2; D024 requires salted, repeated hashing | Iterated HMAC-SHA256 (PBKDF2-style) with a per-user salt, stored with algorithm id and iteration count so it can be upgraded at next sign-in; iteration count set by benchmark (**Spike S-02**) | APPROVED-SRC (D024); algorithm PROPOSED | Plain SHA-256 (too fast) |
| AD-11 | Files cannot be shared by link (D027) and Drive links cannot be handed out; payloads over `google.script.run` are bounded | Single-call upload with enforced size limit and client-side image compression; downloads returned by the server after a role check; folders bucketed by kind and month, the `files` table is the authority | PROPOSED; **Spike S-03** | Per-record folders (thousands of folders, no benefit — access is checked by the app) |
| AD-12 | "Dev never writes live data" (D047) | Separate Apps Script project, spreadsheet, Drive folder and Script Properties per environment. An **environment guard** compares the project's `ENV` property to a marker inside the spreadsheet and refuses to start on mismatch | APPROVED-SRC (D047); guard PROPOSED | Convention only |
| AD-13 | Keep the toolchain supportable by one owner | Plain JS (V8) + JSDoc, `clasp`, Node test harness with fakes. No framework, no bundler | PROPOSED | TypeScript/bundler (adds a build to a platform that has none) |
| AD-14 | Backups must be restorable, and consistent | Nightly copy of the database under a brief lock; extra copy before month close, month reopen and each import commit; restore drill in PH-6 (slice 6-008) and PH-17 | APPROVED-SRC (nightly, §9); extras PROPOSED | — |
| AD-15 | Handover D013 lists "PDF, Google Sheets and print" but D027 forbids link sharing | Treat "Google Sheets" output as a downloadable spreadsheet file (.xlsx) generated server-side; no sharing | **OPEN** (§20, AO-04) | Sharing generated Sheets to named accounts |

### 0.6 Architecture conformance checks (run in CI-style test runner; mapped into the PLAT- family of TEST-STRATEGY)

| ID | Check |
| --- | --- |
| ARC-01 | `SpreadsheetApp` referenced only under `repository/` |
| ARC-02 | `DriveApp` only in FileStore and Backup adapters |
| ARC-03 | `MailApp`/`GmailApp` only in the Mail adapter; `UrlFetchApp` only in the Http adapter |
| ARC-04 | `PropertiesService` only in `core/env`; no secret, spreadsheet ID or folder ID literal anywhere else |
| ARC-05 | Public globals are exactly `doGet` and `tdmsApi` (everything else namespaced or `_`-suffixed) |
| ARC-06 | Every registry method has a PERM id, a schema and an audit event (or declares "read, no audit") |
| ARC-07 | No file under `rules/` references a platform adapter, `Date.now`, `new Date()` or global state |
| ARC-08 | No service imports another service's repository module |
| ARC-09 | No hard-coded configurable value: every CFG id used is read through SettingsService |
| ARC-10 | No file performs I/O at load time (load order independence) |
| ARC-11 | Every list method declares a filter whitelist and a sort whitelist |
| ARC-12 | Every repository read of a scoped entity requires a scope argument (explicit `SCOPE_ALL` allowed only for system callers) |
| ARC-13 | No email address literal in `src/`, `tests/`, `tools/` or `config/`. Addresses come from Script Properties (owner account) or the `settings` table (CFG-007, 061, 107). Docs may name the interim account. Active immediately |

---

## 1. Frontend architecture

### 1.1 Shape

- **One web app, one shell.** `doGet` returns the shell page (login screen until signed in, then navigation + content area). It carries no data.
- **Module views loaded on demand** (AD-03): each module has a view fragment, a controller and a style block. The shell asks `ui.module(name)` once; the controller registers itself in a namespace. Views are served from template files (`HtmlService` includes), so no extra hosting is needed.
- **Namespaces, not modules:** the sandbox serves inline classic scripts, so code is organised as `TDMS.ui.<module>` objects, not `import`. Every file defines things only; nothing runs at load (ARC-10). The shell calls `init()` per module when it is opened.
- **No framework.** Plain DOM with a small helper set (element builder, event delegation, form binding, table/card renderer, modal, toast). One shared component set serves all screens, so the prototype's ~60 modal variants collapse into typed modals (ISS-P2-05).
- **All text through `textContent`/escaped templates.** No user value is ever inserted as HTML (stored XSS).

### 1.2 Responsibilities (and non-responsibilities)

| UI does | UI never does |
| --- | --- |
| Render DTOs; collect input; show server errors against fields; keep per-screen state | Authorization (hiding a control is not protection — §7.4); business calculation of any stored value; clock-based decisions (it uses `meta.server_time`); ID generation; storing passwords or secrets |
| Client-side validation **for convenience only** (required, format); the server repeats all of it | Trust its own role display: the role comes from `auth.me` and is advisory |
| Offline drafts (§1.5) | Keep tokens in `localStorage` |

### 1.3 Navigation and screens

- Router keyed by screen id (the 22–23 prototype screens, PROTOTYPE-INVENTORY). Menu items are built from `auth.me().capabilities` (the permission ids the server says this user holds). This is display only; each call is re-checked server-side.
- **Few, chunky calls.** Every `google.script.run` round trip has fixed latency, so a screen loads with one composite read (`<module>.load…`) or one `api.batch` of reads, not ten small calls.
- Lists are paged at 50 (§13); wide tables become cards on phones (D020, §7.3); the calendar switches to day/agenda view on narrow screens; drag has a "Move to date" alternative (D016, E-11).

### 1.4 Prototype: what is kept, what is rebuilt

| Keep (UX idea) | Rebuild (technical) |
| --- | --- |
| App shell, navigation, role-aware menu | Global store `T`, `TODAY` constant, 190 year literals → server data and server clock |
| Shared "Plan visit" form from any store screen (D061) | Two permission systems (`CAN`, `PD`) → one server matrix |
| Calendar with drag + "Move to date" | Plain-text passwords, role switcher, demo users → real sign-in |
| Boards as stage tracker and workload view | Browser-minted IDs, names as keys → server IDs |
| Import review screen (validate, preview, fix/skip, confirm) | Every list renders every record → paging |
| Offline drafts with a dedupe key | Prototype bundle (`.dc.html`) → shell + lazy modules |
| "Acting as" banner, "updated at" on dashboards | ~60 modal variants → typed modals |
| Undo toast (UI only; the server does not undo) | Sample data and rules in one file → nothing seeded except config |

### 1.5 Offline drafts (§2, §7.9)

- Device storage holds **drafts of new records only** (e.g. a visit log). No offline edits of existing records and no offline reads of server data beyond the shell.
- Each draft has a client-generated `client_ref`, is visible only to its author (keyed by user id), and is removed after sync. Sync submits drafts as ordinary creates carrying `client_ref`; the server enforces one record per (user, `client_ref`), so a double sync saves once.
- Storage use is wrapped in try/catch and the screen works without it. **Spike S-05:** confirm the iframe's storage persists on iOS Safari and Android Chrome. If it does not, the offline-draft feature degrades to an in-memory warning; no other function depends on it.

### 1.6 Session handling in the UI

Token in memory (+ `sessionStorage` when available); a 30-minute idle timer on the client mirrors the server (the server decides). On `SESSION_EXPIRED` the shell clears state and shows sign-in, keeping unsent drafts. On `CLIENT_OUTDATED` it asks the user to reload.

### 1.7 Accessibility and devices

Same functions on phone, tablet, desktop (D020). Touch targets, keyboard alternatives for drag, focus management in modals, no sideways page scroll on phones. Checked in the PH-17 phone pass and in each slice's acceptance (§12 of the Handover).

---

## 2. API architecture

Full contract: [API-CONTRACT](API-CONTRACT.md). Architecture rules:

1. **One entry point** `tdmsApi(envelope)`; method names `module.action` (AD-02). `api.js` is the only client of it.
2. **Envelope in, envelope out.** Request: version, request id, method, params, token. Response: `{ok, data, meta}` or `{ok:false, error, meta}`. The server catches every exception inside the dispatcher; the browser's failure handler fires only for transport failures.
3. **JSON only.** No `Date`, no functions. Dates are `yyyy-mm-dd` text; timestamps ISO-8601 UTC.
4. **Caller identity comes from the session**, never from the payload. A payload field named `user_id` for "who am I" does not exist.
5. **DTOs, not rows.** Every method returns explicit fields. Credential columns (`password_hash`, `token_hash`) are marked `secret` in the schema and never returned by default reads.
6. **Reads are scope-filtered before data leaves the server**; writes check scope and record state.
7. **Writes carry `row_version`** (MUT entities) and, where the user's intent needs it, `reason`. Writes from drafts carry `client_ref`.
8. **Batch of reads:** `api.batch` runs up to N read methods in one round trip with one authentication (Proposed, N set by Spike S-04). Writes are never batched.
9. **Idempotency:** a repeated create with the same `client_ref` returns the original result. Other writes are protected by `row_version`, duplicate rules and state machines.
10. **Versioning:** `api_version` = 1; within v1 only additive changes (new optional fields, new methods). A server build id is returned in `meta`; a mismatched client gets `CLIENT_OUTDATED`.
11. **Transport failures on writes are "unknown outcome":** the client reloads the record before offering a retry (the 6-minute limit or a dropped connection may have committed the write).
12. **PostgreSQL later:** the same method names and envelope map to HTTP (`POST /api` with the envelope, or `/module/action`). The token moves to a header. Services and DTOs do not change (§18).

---

## 3. Service architecture

### 3.1 Services (one writer per entity; DATA-MODEL §13)

| MOD | Service (namespace) | Owns (ENT) | Notes |
| --- | --- | --- | --- |
| 001 | MasterDataService | brands, regions, locations, positions, stations, programs, station plans | |
| 003 | AuthService, SessionService, UserService, DelegationService, PermissionService | users, sessions, resets, delegations, role_permissions | PermissionService is read by every other service |
| 015 | SettingsService, LookupService, HolidayService | settings, lookups, holidays | Configuration layer (§5) |
| 015 | AuditService, HistoryService, RecycleService, AdminService | audit_log, status/record history, recycle_bin, reassignment queue | |
| 002 | PersonService, EmployeeService | persons, aliases, employees, assignments | PersonService is the single writer of identity |
| 004 | VisitService | visit plans, visits, officers, failure types | |
| 005 | StoreHealthService | derived summaries | Computes through `rules/storeHealth`; never stores a counter (D029) |
| 006 | CaparService | cases, findings, actions, photos | |
| 007 | TraineeService, AssessmentService, ImportService | batches, enrollments, station results, assessments, imports | |
| 008 | TlService | TL enrollments, extensions, officers, uniforms | |
| 009 | ProficiencyService, ExpiryService | certifications, validations, expiry tasks | |
| 010 | TrainingService | sessions, attendance | |
| 011 | LibraryService | resources, FAQs, LMS questions | |
| 012 | KpiService | KRA definitions, targets, survey, attendance log | |
| 012 | CloseService | month closes, snapshots | |
| 013 | ReportService | none (reads) | |
| 014 | NotificationService, ApprovalService | notifications, email log, approvals | |
| — | FileService, BackupService, JobService | files, backup log, jobs, schedule | Platform-facing services |

### 3.2 Rules of service design

- **A service owns a state machine and its transitions** (WORKFLOWS WF-001–014). A transition is one method; invalid transitions return `BLOCKED_BY_RULE` with the rule id.
- **Cross-module effects go through the owner's public method**, not its tables: marking a CAPAR case Verified calls `VisitService.createVerificationVisit` (linking instead of duplicating, D062).
- **Rules are pure.** A service fetches the settings in force for the relevant date (SettingsService returns a **bundle version**), reads data through its repository, and calls a rule with plain values. This is what makes grading, Store Health, SLA dates and the trainee timeline unit-testable in Node and portable.
- **Shared rule kernel** (Audit §B): dates and working days (with the holiday list), grades, permissions, scope. Modules cannot compute these differently.
- **Derived values are not stored** (DATA-MODEL P11) except in month snapshots and queued summary tables with an `updated_at`.
- **Events inside a request** are explicit calls, not a hidden event bus. Side effects that are slow (summary refresh, emails, PDF, AI) are **enqueued** (§10).
- **Unit of work per request:** a service collects writes (rows, history, audit, jobs) and the pipeline flushes them (§14.3).
- **No service reads another module's table directly**; where a reporting read needs several modules it goes through ReportService, which calls public read methods or reads summary tables.

### 3.3 Ownership of a write path (example, CAPAR Verified)

`capar.markVerified` → pipeline authorizes PERM-022 + scope → CaparService validates the transition (stage = Scheduled) → under lock re-reads the case (`row_version`) → asks VisitService to create or link the verification visit → writes case + status_history + audit in one unit of work → enqueues "refresh Store Health for store" → returns the case DTO.

---

## 4. Repository / data-access layer

### 4.1 Contract (what the rest of the system sees)

The repository exposes **entity operations**, never ranges, row numbers or sheet names:

| Operation | Meaning |
| --- | --- |
| `get(entity, id, ctx)` | One record by ID (scope-checked) |
| `list(entity, query, scope, ctx)` | Filter + sort + page. `query` = equality, in-list, range, "contains" on whitelisted columns; stable sort with ID tiebreak; max page 50 |
| `insert(entity, record, uow)` | Allocates ID under the lock; stamps profile columns; adds history/audit rows to the unit of work |
| `update(entity, id, patch, expected_row_version, uow)` | Optimistic; increments `row_version` |
| `insertVersion(entity, record, supersedes_id, uow)` | VER profile: insert only; head must equal `supersedes_id` |
| `append(entity, record, uow)` | APP profile |
| `remove` / `restore` (Admin, D021) | Snapshot to recycle bin and remove the row; restore re-inserts |
| `count(entity, query, scope)`, `exists(...)` | Cheap checks (duplicates) |
| `exportAll(entity)` | Full dump for migration and backup verification |

The query object is deliberately SQL-shaped (equality/range/in/sort/page) so a PostgreSQL adapter can implement it without a service change (§18).

### 4.2 Table registry and schema

- **Schema registry** in `config/schema/` is generated from DATA-MODEL: table name, columns (name, logical type, required, `secret`, text-guard), profile (MUT/APP/VER/SYS), history code, ID prefix. The repository reads its structure from the registry, never from code scattered in services.
- **Header-driven mapping:** columns are found by header name, not position. Column order may change without breaking code.
- **Schema check** (owner-run tool and a daily job): sheet headers vs registry; extra or missing columns reported; **only additive migrations** are allowed, each a versioned idempotent script recorded in `_migrations`. Destructive schema change = architecture decision.
- **Tabs:** one tab per table, named as the table. System tabs start with `_`: `_meta` (environment marker, schema version), `_counters` (ID counters; the `id_counters` SYS table), `_migrations`.
- **No formulas, no merged cells, no manual edits.** Only the script owner (and the named co-owner) have access to the spreadsheet; people work through the app (§7.6).

### 4.3 Read strategy (Sheets has no indexes)

| Table kind | Strategy |
| --- | --- |
| Small and hot (settings, lookups, brands, regions, positions, stations, programs, holidays, role_permissions) | Read whole table once, cache with epoch (§12), memoize per request |
| Get by ID in a large table (employees ~4,000; certifications ~20,000+) | Find the row from the ID column only (column read or `TextFinder`), then read that row |
| List with filters in a large table | Read only the columns the query needs, filter and sort in memory, page the result. If a list stays slow in the PH-0 benchmark (**Spike S-04**) it moves to a **summary table** refreshed by the queue |
| Dashboards, matrix, Store Health, scorecards | Read pre-computed summary tables with an `updated_at` shown to the user (§2, REQ-005) |
| History and audit | Cursor paging on the append order (§13); archived years live in archive spreadsheets |

Reads inside a write lock **bypass the cache** and read fresh rows. The cache is for read paths.

### 4.4 Write strategy

- Appends: write at the next row inside the lock, one `setValues` per table per unit of work.
- Updates: locate by ID under the lock, verify `row_version`, write the changed row.
- Deletes (Admin only): snapshot row → recycle bin → remove the row with row deletion so tables stay dense.
- Values written as text where the schema says text-guard (IDs, HR numbers, mobile, batch codes), so Sheets cannot reinterpret them (§8 of the Handover).
- Row counts and cell budget are tracked; the integrity job warns at 70% of the cell limit (**verify** limit).

### 4.5 IDs and counters

Server-generated prefixed IDs (DATA-MODEL §2). Counters live in `_counters` keyed by (prefix, year); allocation happens inside the same lock as the insert; year digits come from the record date, never a literal (§8). Overflow of the numeric width is an error, not a silent wrap. IDs are never reused or changed.

### 4.6 Repository contract tests

The same test suite runs against (a) an in-memory fake and (b) the TEST spreadsheet. A PostgreSQL adapter must pass the identical suite (§18).

---

## 5. Configuration layer

Business settings are specified in [CONFIGURATION](CONFIGURATION.md). Architecture:

- **SettingsService** is the only reader/writer of `settings` (ENT-001, VER). It resolves "the version in force on date D", returns **bundle versions** (CONFIGURATION Part 2), and enforces R1–R14 (no backdating, group validation, audit).
- **Setting definitions** live in `config/settings/` (CFG id, type, validation, bundle, who may change, default if approved). The database holds values; the definition file holds shape. A deploy check fails if a definition and a stored key disagree.
- **Typed accessor:** services ask for a setting by CFG id and date; no service reads the sheet. ARC-09 fails the build on literals for configurable values.
- **Pure rules receive settings as arguments.** A rule never fetches configuration.
- **REQUIRES DECISION values are absent, not guessed (R14).** A feature whose setting is unset returns `CONFIG_MISSING`; the UI shows "needs setup (Admin)". Nothing is defaulted silently.
- **Result stamps:** a service that saves a result writes the bundle version id with it (CONFIGURATION §2.2). Settings versions are never edited; a change is an insert with `supersedes_id`, and the second of two simultaneous savers gets `CONFLICT`.
- **Technical/system settings** (SYSTEM, FIXED) are code constants or Script Properties and are **not** exposed to the Settings screen (CONFIGURATION §2).
- **Cache:** the in-force settings map is cached with the settings epoch (§12) and bypassed inside write locks for the settings being saved.

---

## 6. Permission / authorization layer

Rules and matrix: [PERMISSIONS](PERMISSIONS.md). Architecture:

### 6.1 One server-side system (D023, §7.4)

`PermissionService.can(ctx, PERM-id, resource?)` is the only authority. The fixed prototype role list is removed. The matrix is data (`role_permissions`, VER; editor pending gate G-06) cached per role with a short TTL and epoch.

### 6.2 What every protected call validates

| Check | Where |
| --- | --- |
| Authenticated, active user, password-change gate | Pipeline step 4 |
| Role and permission (PERM id) | Pipeline step 6, from the method registry |
| Organizational scope (own / assigned brand / assigned store / all / delegated) | Pipeline builds the scope; repository requires it on every scoped read (ARC-12) |
| Delegation | Effective roles = own + delegator's while an approved delegation is Active; "Acting as" recorded in audit (`acting_as_role`, `delegation_id`) |
| FLAG-001 (EXECom officer) | Context flag; not delegable |
| Record ownership and officer edit window (CFG-004) | Service (needs the record) |
| Record state (closed month → `LOCKED`; stage rules) | Service / rules |

### 6.3 Design rules

- **Deny by default:** a method without a registry entry, or a PERM id with no matrix row for the role, is refused. Cells marked `?` in PERMISSIONS are implemented as deny until decided.
- **Scope on reads:** a list or get for an out-of-scope record returns `NOT_FOUND` (no existence leak); a filter that names an out-of-scope brand/store returns `NOT_IN_SCOPE`.
- **Delegation is read live** (dates computed against today; early end bumps the epoch) so access ends **at once** (WF-007), never from a stale cache.
- **No self-escalation:** no self role change, no self approval, no re-delegation; last-Admin guard (FX-023). Implemented in the service that owns the action.
- **Admin edits** carry a reason and appear as `A(reason)`; they do not become operational authority.
- **Denials** are counted in `error_log` (code `FORBIDDEN`), not in the audit log.
- Matrix changes are audited (A2) and invalidate permission caches immediately.

---

## 7. Authentication

Spec: Handover §7.8, D024, E-06; Roles spec. Architecture:

| Topic | Design |
| --- | --- |
| Identity | Employee ID (HR number, digits only) + password. App-level only (AD-01) |
| Password storage | Per-user salt + iterated HMAC-SHA256, with algorithm id and iteration count stored for upgrade (AD-10); optional server-side pepper in Script Properties (**Proposed**). Passwords never reach the browser or the audit log |
| Temporary password | Admin-issued; forced change before any other screen opens (pipeline gate allows only `auth.changePassword`, `auth.signOut`, `auth.me`) |
| Password rule | ≥ 8, letters + numbers, not equal to current (FX-002) |
| Throttle | Failed count and `locked_until` on the user row, updated under lock: CFG-002 failures → CFG-003 pause. The response never says whether the ID exists |
| Session token | 256-bit random value from two UUIDs; the server stores only its SHA-256 hash in `sessions` with a cache read-through. Sliding idle timeout CFG-001; the last-activity write is limited to once per minute per session so reads do not take the lock |
| Sign-out | Ends the session row; Admin deactivation ends all sessions at once (WF-012) |
| Reset | Link valid 30 minutes (FX-001), token hashed in `password_resets`, single use; mail from the company account (CFG-007, ISS-P0-04); reset page served by `doGet` with the token as a parameter |
| Transport | Token in the envelope only (AD-04). No cookies. No `doPost` endpoint exists |
| Identity for audit | The user's own ID plus HR number on every audit row. `Session.getActiveUser()` is not used |
| What cannot be logged | Client IP and device: Apps Script web apps do not expose them. A self-reported client string may be stored but is not trusted |
| Owner account | Used only for deployment; 2-step verification (§7.9) |
| Environment | A demo-date override exists only outside live (E-02) |

Quotas: all users run as the owner, so Apps Script quotas apply to one account (concurrent executions about 30 per user, email limits, trigger runtime — **verify** all against the chosen account type, gate G-01).

---

## 8. Audit logging

Design adopted pending gate G-05 (PROP-004): one mechanism, three views.

| Store | Written by | Content |
| --- | --- | --- |
| `audit_log` (APP) | AuditService, in the request's unit of work | Every authenticated action: sign-in/out, failures, create, edit, approve, delete, restore, role change, email sent, AI call, config change. Fields: event code (WORKFLOWS event names), user id, HR number, acting-as role, delegation id, entity, record id, reason, `request_id`, time |
| `status_history` (APP) | HistoryService | One row per status transition with effective date and remark (§7.5, "as of" reads) |
| `record_history` (APP) | HistoryService | Field-level old/new for designated entities (D048, D008) |

Rules:

- **Written inside the unit of work** with the business rows, same `request_id`. A business write without its audit rows is a defect.
- **If the audit flush fails after the business flush**, the request returns `SERVER`, the full audit payload is stored in `error_log`, and the integrity job (§10) reports the gap. No change is silently unaudited.
- **Append-only by construction:** the repository's audit/history interfaces have no update or delete method. Direct spreadsheet access is the only bypass; it is limited to the owner and co-owner (§7.9) and detected by the integrity job (rows whose `request_id` has no matching business write, gaps in the sequence).
- **Sensitive actions** (settings, permissions, FLAG-001, Admin edit/delete, month reopen, delegation approval, password resets) always carry a `reason` where CONFIGURATION says A2.
- **Visibility:** Admin and Senior Training Manager (all Admin actions, §7.9); others see the history tab of records they can read.
- **Growth:** yearly archive of `audit_log` past about 50,000 rows to an archive spreadsheet (SY-009); the viewer reads current + archive with cursor paging.
- **No PII in `error_log` payloads beyond IDs;** passwords and tokens are never logged.

---

## 9. File handling

Rules: D027, D035, D059, D066, §7.7, §7.11; PERM-130.

- **Storage:** private Drive folder tree per environment, owned by the company account. Layout `kind/yyyy/mm/` (library, capar-reports, capar-photos, visit-reports, validation-proof, memos, imports, exports, backups). The `files` table (`FIL-`, ENT-005) is the authority: Drive file ID, owner record type/id, kind, mime, size, `sha256`, uploader.
- **No sharing, ever.** The app never calls a sharing method. The integrity job (§10) lists the folder tree and fails if any file has link sharing or any non-owner viewer.
- **Upload:** validated on the server — type allow-list (CFG-016), size limit (CFG-062, pending), magic-bytes check for PDF/JPEG/PNG/Word, name sanitized, `sha256` computed. Images are resized and compressed in the browser before upload to stay under the payload limit. Upload is one call carrying the file as base64; **Spike S-03** measures the practical limit. If the limit is below the required file size, chunked upload to a staging file is designed then (not before).
- **Download/open:** `file.open` checks PERM-130 (category + role + record scope, per request) and returns the content to the client for display/save. There is no Drive URL in any DTO.
- **Linking:** a file row is created in the same unit of work as the record it belongs to; a failed Drive write rolls back the record; an orphan Drive file (record write failed afterwards) is found by the integrity job and trashed after review.
- **Deletion:** "delete" moves the `files` row and the Drive file to the Recycle bin policy (D021, FX-025); purge is Admin-only and audited. The app never calls permanent delete on its own.
- **Generated files** (CAPAR PDF, visit report PDF, memos, exports) are written by the same FileService and recorded the same way.
- **Backup of files:** not covered by the nightly database copy. **OPEN (AO-05):** whether files need their own backup beyond Drive trash; recommended: no app-level hard deletes, `sha256` verification in the integrity job, and Drive's own versioning.

---

## 10. Background jobs and triggers

### 10.1 Mechanism (AD-07)

One installed time-driven trigger (every 5 minutes, SYSTEM) runs the **worker**. Triggers are installed by an owner-run function, never from the API. The worker:

1. tries the script lock without waiting; if another worker run holds it, exits;
2. reads `job_schedule` and enqueues any job whose time (in the organisation zone) has come;
3. drains `jobs` oldest first with a **time budget** (stops about 1.5 minutes before the 6-minute limit), resumable from a cursor stored on the job row;
4. retries failed jobs with back-off (attempt count, `next_attempt_at`); after the attempt limit a job becomes `Failed`, is written to `error_log` and shows on the Admin health screen and in the Admin digest.

Jobs hold the script lock only inside each repository write, never across computation, email, Drive, PDF or AI calls. Job rows are deduplicated by (type, key) so a burst of saves coalesces into one refresh.

### 10.2 Job catalogue

| Job | Trigger | Content | Source |
| --- | --- | --- | --- |
| J-01 Summary refresh | Enqueued by saves; nightly full rebuild | Store Health, coverage, matrix, scorecards, EXECom counts into summary tables with `updated_at` | §2, REQ-005 |
| J-02 Nightly backup | Schedule | Copy the database to the backup folder; prune beyond the retention count (CD-22 / G-02); log result | §7.6, §9 |
| J-03 Daily digest | Schedule (time: CFG-091 pending) | One email per user: overdue, due this week, awaiting approval; supervisors also unassigned expiry tasks and overdue CAPAR stages | §7.2 |
| J-04 Expiry scan | Daily | Raise warnings and one expiry task per store when a certification enters the window (CFG-051); flag unassigned/unscheduled tasks (CFG-052) | §5.4, WF-005 |
| J-05 Deadline and overdue scan | Daily | TL deadlines, CAPAR stage targets, unscheduled TLTC | §5.3, §5.7 |
| J-06 Month-close reminders and snapshot | Schedule / on close request | Reminders before the 5th; **snapshot job staged** across runs, writing rows not blobs (PROP-003) | §5.6, WF-006 |
| J-07 Email sender | Enqueued | Reset links, QA PDF, digest; rate-limited to the account's quota; `email_log` | §7.2, D030 |
| J-08 Report/PDF builder | Enqueued | Heavy PDFs and exports into the private `exports` folder; notification on completion | §7.1, D013 |
| J-09 Purge | Daily | Expired sessions, used reset tokens, old exports | — |
| J-10 Integrity check | Daily (light) / weekly (full) | Audit/history coverage per `request_id`; FK orphans; text-guard columns; cell budget; file sharing; environment marker; sequence gaps; Store Health parity checks | §7.9 |
| J-11 AI draft (conditional) | Enqueued | CAPAR checklist draft; only if IT approval (ISS-P0-18) | D065, §7.11 |
| J-12 Archive (manual) | Admin | Yearly audit/history archive | SY-009 |

Delegation start and end need no job: effective roles are derived from the dates at read time (§6.3).

### 10.3 Limits designed for

6-minute execution, trigger count and total trigger runtime (**verify**), email quota (**verify**), lock contention. Job steps are idempotent so a re-run after a timeout is safe.

---

## 11. Reporting

- **One source of truth.** Reports read the same authoritative records, summary tables and snapshots as the operational screens, through ReportService calling public read methods. No report has its own formula (Project goal; D029, D033, D034 stay in `rules/`).
- **Three read modes:** (1) **live**, paged, from services; (2) **summary**, from queued tables with `updated_at`; (3) **frozen**, from month snapshots. A report "as of a date" uses `status_history` and the settings version in force on that date; a **closed month always reads its snapshot** and is never recomputed (CONFIGURATION R5–R6).
- **Report registry:** each report is declared once (id, title, inputs, PERM id, read mode, outputs). EXECom, Store Health, KPI, CAPAR, certification/expiry, store-visit, training, historical and operational reports all register here.
- **Outputs (D013):**
  - **On screen:** paged, 50 rows (§13).
  - **Print:** an A4 print view in the browser from the same HTML; identical on phone and desktop.
  - **PDF:** server-rendered from the same HTML template (`HtmlService` → PDF). Apps Script PDF supports simple CSS only, so layouts are kept simple and the print view is the exact-layout path (§6.5). Batch size per PDF and photo-heavy CAPAR reports are tested (**Spike S-03**).
  - **"Google Sheets":** delivered as a generated spreadsheet **download** (AD-15, OPEN), not a shared Sheet.
- **Heavy reports are jobs** (J-08): the user gets a notification and opens the file from the private `exports` folder through `file.open`. Light ones return inline.
- **Generated documents are recorded:** issued letters/memos store template version and data snapshot so a reprint is identical (D051, pending approval); report headers/sign-offs come from CFG-092 and are stamped in the stored file.
- **Report access:** per-report PERM id plus scope; EXECom and trainee reports are Training Department only and never reach Store Head/Area Manager (D037).
- **Daily Activities** (Messenger-ready text) and **Store Visit Report** (Option B template unless ISS-P0-18 changes it) are services' report methods; they cover logged work only.

---

## 12. Caching

| Cache | Content | Key / invalidation | TTL (Proposed; SYSTEM CFG-102) |
| --- | --- | --- | --- |
| Reference tables | brands, regions, positions, stations, programs, lookups, holidays | `ref:<table>:<epoch>` | up to 6 h; epoch bumped by every write to the table |
| Settings in force | resolved setting map per effective date window | `set:<epoch>` | up to 6 h; epoch bump on any settings write |
| Permission matrix | role → permissions | `perm:<epoch>` | short (about 1–5 min) + epoch bump on matrix change |
| Sessions | token hash → session record | `sess:<hash>` | to idle limit; sheet is the truth |
| User context | user, role, brand/store scope | `user:<id>:<epoch>` | short; epoch bump on user/assignment change |
| Per-request memo | any table read twice in one request | in memory | one request |

Rules:

- `CacheService` (script cache) is shared across users: **nothing user-private is cached without the user in the key**, and no DTO is cached.
- Values over about 100 KB (**verify**) are chunked or not cached; a table that does not fit is read directly.
- **Epoch protocol:** every write to a cached table bumps its epoch (in cache and in `_meta` for durability). A reader whose cached entry carries an older epoch rebuilds. If the bump fails the entry lives at most until its TTL, which is why authorization caches have short TTLs.
- **Eviction is normal.** Every cache read has a fall-back to the sheet; nothing depends on cache survival (sessions included — the sheet is the truth, ISS-P0-03).
- **Delegation and permission changes are never served stale beyond the epoch bump** ("access removed at once", WF-007).
- Dashboards use summary tables, not the cache, so "updated at" is truthful.

---

## 13. Pagination

- **Page size 50** (approved §8), server-enforced maximum; the client cannot request more. Exports and reports are jobs, not pages.
- **Offset paging** (`page`, `page_size`) for UI lists with stable ordering (declared sort + ID tiebreak). Response `meta.page = {page, page_size, total, has_more}`; `total` is returned for lists where counting is cheap or cached, otherwise `null` with `has_more`.
- **Cursor paging** (`cursor`) for append-heavy history: audit log, status/record history, notifications. The cursor is the (sort value, ID) of the last row, so new rows do not shift pages.
- **Scope filter first, then filter, then sort, then page.** A page never contains out-of-scope rows and totals never count them.
- **Whitelists:** every list method declares which filters and sorts it accepts (ARC-11). Unknown filter → `VALIDATION`.
- **Summary-backed lists** return `meta.as_of` (the summary's `updated_at`).
- **Client:** shows "Load more"/page controls; keeps the current page's `row_version`s; never loads "all rows to filter in the browser".

---

## 14. Concurrency and `row_version`

### 14.1 Optimistic concurrency (MUT entities; DATA-MODEL §1.1)

1. A read returns `row_version` with the record.
2. An update sends the `row_version` it was based on.
3. Under the script lock the repository re-reads the row. If its `row_version` differs → `CONFLICT` with a hint (who changed it, when, current version): "changed by X, reload" (§7.9).
4. Otherwise it writes and increments `row_version` by 1 on **every** write, including Admin edits.

| Profile | Rule |
| --- | --- |
| MUT | as above |
| APP | no update exists; ID allocation under lock |
| VER | insert only; the head version must equal `supersedes_id`, else `CONFLICT` |
| SYS | read-increment under lock |

### 14.2 The lock

- `LockService` **script lock** (one shared lock; document locks are unavailable to a standalone web app).
- **Critical section = read target rows fresh → check `row_version`, state, uniqueness → build writes → flush → release.** Everything else (validation, computation, PDF, email, Drive, AI) is outside.
- Target hold time is short (**proposed budget: well under 2 seconds**, validated by Spike S-07); waits time out as `BUSY` and the client may retry reads automatically but writes only after the user confirms.
- Re-check inside the lock everything the pre-lock read established: state-machine position, duplicate keys (e.g. CAPAR store + audit type + audit date), month lock.
- The worker never holds the lock longer than one repository write.

### 14.3 Unit of work and atomicity

Sheets has no transaction. The unit of work collects all rows for the request and flushes **per table in this fixed order**: counters → business rows → child rows → status/record history → audit. Each table is a single batch write.

- A failure before the first flush leaves nothing changed.
- A failure part-way is reported as `SERVER`, written to `error_log` with the request id and the rows already flushed, and caught by the integrity check. This is a **stated limit of the platform**, mitigated, not eliminated; the PostgreSQL migration replaces it with real transactions (§18).
- Cross-module writes inside one request are grouped in the same unit of work.

### 14.4 Duplicates and retries

`client_ref` uniqueness per user for draft syncs; business duplicate rules (§7.9: same store/date/purpose warns, CAPAR duplicate blocks); state-machine checks make a repeated "advance stage" fail instead of advancing twice.

---

## 15. Error handling

### 15.1 Shape and codes

All failures return `{ok:false, error:{code, message, fields?, rule_id?, retry_after?, current?}, meta:{request_id}}`. Codes (full table in API-CONTRACT): `AUTH_FAILED`, `AUTH_REQUIRED`, `SESSION_EXPIRED`, `AUTH_LOCKED`, `FORBIDDEN`, `NOT_IN_SCOPE`, `NOT_FOUND`, `VALIDATION`, `CONFLICT`, `LOCKED`, `BLOCKED_BY_RULE`, `CONFIG_MISSING`, `BUSY`, `QUOTA`, `EXTERNAL`, `CLIENT_OUTDATED`, `SERVER`.

### 15.2 Rules

- **Layered:** validation errors name fields; rule errors name the rule (`rule_id` = RULE-nnn); authorization errors say nothing about why beyond the code; unexpected errors become `SERVER` with the `request_id` only. **No stack trace, sheet name or internal ID in any response.**
- **The dispatcher catches everything.** Uncaught exceptions would reach the browser as an opaque message; the contract forbids relying on that.
- **`error_log`** (APP): request id, method, user id, code, message, truncated stack, duration, environment. Admin health screen shows counts and recent entries.
- **User messages** are generated on the client from the code and field list (translatable); the server's `message` is for developers.
- **Retry policy:** reads auto-retry once on `BUSY`/transport failure; writes never auto-retry (unknown outcome → reload the record, then ask).
- **Quota errors** (`QUOTA`) from Apps Script services are mapped, logged and shown as "try again shortly".
- **External services** (mail, Drive, AI) fail as `EXTERNAL` without blocking the business write; the job is queued with retries and shown on the Admin health screen.
- **Time and clock:** all "today" logic uses the Clock adapter and the organisation time zone (CFG-104 / G-03); nothing calls `new Date()` directly (ARC-07).
- **Logging hygiene:** console logs carry request id and codes, never passwords, tokens or full records.

---

## 16. Development vs production environments

### 16.1 Environments (AD-12)

| Env | Purpose | Apps Script project | Spreadsheet | Drive folder | Data |
| --- | --- | --- | --- | --- | --- |
| **dev** | Daily development | own project | own | own | Synthetic only |
| **test** | Acceptance and regression before release (Handover §12) | own project | own | own | Synthetic or masked; reset on demand |
| **live** | Production | own project, owned by the D069 account (interim personal Gmail; was company-owned, D012) | own | own | Real |

Minimum approved is one non-live environment (D047); two are recommended because acceptance needs a stable data set while development churns (**Proposed**).

### 16.2 What is separate

Each environment has its own Apps Script project (script ID), web-app deployment URL, database spreadsheet, archive spreadsheets, backup folder, files folder and Script Properties (`ENV`, `DB_ID`, `ARCHIVE_IDS`, `DRIVE_ROOT_ID`, `BACKUP_ROOT_ID`, owner account, AI key if any; the mail sender and the backup editor are settings, CFG-007 and CFG-107). All IDs and secrets live in Script Properties only (ARC-04, CFG-101, R12).

Drive layout (D070): one mother folder `TDMS` holds one subfolder per environment (`TDMS-dev`, `TDMS-test`, `TDMS-live`) and `_apps-script`; `DRIVE_ROOT_ID` is the environment subfolder, never the mother, and the mother is never shared. See [dev-environment runbook](runbooks/dev-environment.md).

### 16.3 Environment guard

On every cold start the platform compares `ENV` (Script Properties) with the marker stored in the spreadsheet's `_meta`. A mismatch disables all writes and returns `SERVER` with a guard code. Code pointing at the wrong spreadsheet cannot write live data. The demo-date override and any seed/reset tools exist only when `ENV` ≠ `live`.

### 16.4 Deployment flow (Proposed; for gate G-04)

- `main` is the release branch in `lheiiyy/TDMS`; short-lived feature branches; one commit per slice milestone citing task ID and RULE/PERM ids (HANDOFF-MODEL §6).
- `clasp` pushes the **same commit** to dev, then test, then live. A release is a tagged commit; a live deployment is a **versioned** deployment (not the head `/dev` URL).
- Schema check and migration scripts run on each environment before the code that needs them; migrations are additive and recorded.
- The head (`/dev`) URL is editor-only and used for development; testers and users use versioned deployments.
- Rollback = redeploy the previous version; data migrations are additive so a rollback needs no data change.
- Promote only when the test environment passes the slice's acceptance checks.
- The owner account performs deployment only (2-step verification, §7.9); developers have editor access to dev/test projects only.

### 16.5 Test data

Live personal data is never copied to dev or test. Seed tools create synthetic stores, employees and records. HR masterlist samples for the 1F import (G-07) are masked.

---

## 17. Backup strategy

Approved: a nightly time-trigger copy of the database to a backup Drive folder (§7.6, §9). Retention count is an open gate item (G-02, CD-22).

| Item | Design |
| --- | --- |
| Nightly (J-02) | `makeCopy` of the database spreadsheet into `backups/<env>/yyyy-mm/` named with date and schema version; brief script lock so the copy is consistent; result logged; failures alert the Admin digest |
| Extra points (**Proposed**) | Before each import commit, before month close, before month reopen, before any schema migration |
| Retention | The count from G-02; the job prunes beyond it. Month-end backups may be kept longer once Leo sets a rule (not invented here) |
| Archives | Yearly audit/history archive spreadsheets are included in the backup set |
| Files | Not duplicated by the nightly job (AO-05); Drive trash/versions plus `sha256` checks; no app-level permanent deletes |
| Restore | Procedure documented and rehearsed: (1) stop writes (maintenance flag in `_meta`), (2) copy the chosen backup, (3) set `DB_ID` to the copy or copy tables back with the repository restore tool, (4) run schema check and integrity check, (5) re-enable writes, (6) record an audit entry |
| Drill | PH-6 and PH-17 restore drills on the test environment; result recorded in PROJECT-STATE |
| Access | Backup folder private, owner/co-owner only |
| Quota | The backup count × database size must fit the Drive quota (G-02 note) |

---

## 18. Future PostgreSQL / full-stack migration boundary (D041, §2)

### 18.1 What swaps, what stays

| Swaps | Becomes | Stays unchanged |
| --- | --- | --- |
| Repository (Sheets) | SQL adapter implementing the same contract and passing the same contract tests | Services |
| `api.js` transport (`google.script.run`) | `fetch` to HTTP endpoints, same method names and envelope; token in a header | Rules (pure) |
| Session/token carrier | Header or cookie, server session store | Permission model and registry |
| LockService | Database transactions / row locks (`row_version` becomes a column check) | Method registry, DTOs, error codes |
| CacheService | In-process or Redis cache with the same epoch idea | Setting definitions, bundles and stamps |
| Time triggers + job table | Cron/worker with the same job table | IDs, audit/history model, workflows |
| DriveApp FileStore | Object storage behind the same FileStore interface (files stay private; role-checked) | UI views and controllers |
| MailApp / Pdf adapters | SMTP/service and a PDF renderer fed by the same HTML templates | Business documentation |

### 18.2 Constraints observed from day one (so the boundary stays cheap)

1. **Stable IDs** are the keys everywhere (D049); the prefixed text IDs become primary keys unchanged. Row numbers and sheet names are never identity.
2. **No formulas, merged cells or sheet features in logic** (P7). Derived values are computed in rules or summary jobs.
3. **Portable types:** ISO dates/timestamps → `date`/`timestamptz`; text-guard columns → `text`; numbers → numeric; booleans; no JSON blobs in cells (P10) so child data are real child tables.
4. **The repository query object is SQL-shaped** (§4.1): equality, in, range, sort, page, no spreadsheet functions.
5. **Optimistic concurrency by `row_version`** maps directly to an integer column check.
6. **Unit-of-work boundaries = future transaction boundaries**; the flush order is also a valid FK order.
7. **Business rules are pure and settings are passed in**; they run unchanged in Node or any host.
8. **Result stamps** (bundle version, `valid_until`, due dates) are stored values, so history survives the move without recomputation.
9. **`legacy_ref`** on imported rows traces back to source; the same pattern is used for Sheets → PostgreSQL row mapping.
10. **Schema registry** (`config/schema/`) is the single source for both the Sheets headers and the generated PostgreSQL DDL (kept in `lheiiyy/TDMS`, not in SVMI's schema, D041).

### 18.3 Migration outline (detail in MIGRATION-PLAN)

Generate DDL from the schema registry → freeze writes → `exportAll` each table → load → verify counts, checksums and sampled records against Sheets → run the repository contract tests on the SQL adapter → switch adapter and transport behind a flag → keep Sheets read-only as the rollback source for an agreed period. No service, rule or DTO is edited in this sequence.

### 18.4 What the migration will **not** be able to fix

History written without a rule stamp cannot gain one afterwards. That is why CONFIGURATION Part 2 requires the stamps now (DATA-MODEL §15).

---

## 19. Platform risks and limits (designed for)

| # | Limit / risk | Where handled |
| --- | --- | --- |
| 1 | 6-minute execution limit | Job time budgets, staged snapshot (§10), no heavy work in saves |
| 2 | One account's quotas (all users run as the owner): concurrent executions, email, trigger runtime (**verify**) | Chunky calls and `api.batch` (§2), cached references (§12), queued email (§10), Spike S-06/S-07 |
| 3 | Script-wide lock contention | Short critical sections (§14) |
| 4 | No transactions | Unit of work order + integrity check (§14.3) |
| 5 | Cache eviction, 100 KB values | Fallback to the sheet, chunking, epoch (§12) |
| 6 | 50,000-character cells; 10M cells per spreadsheet (**verify**) | Rows not blobs (P10); archives; cell budget check (§4.4) |
| 7 | No indexes | Read strategy and summary tables (§4.3) |
| 8 | Sandboxed iframe: no cookies, storage may be blocked | Token in memory; drafts optional (§1.5) |
| 9 | Global load order of Apps Script files | No I/O at load; registration by namespace (ARC-10) |
| 10 | PDF conversion supports simple CSS only | Print view is the exact-layout path (§11) |
| 11 | "Anyone" web-app access may be restricted by Workspace policy | AD-01 fallback, Spike S-06 |
| 12 | Client IP/device unavailable | Stated in §7; audit relies on user identity |
| 13 | Spreadsheet owner can bypass the app | Owner/co-owner only, 2-step verification, integrity job (§8) |

---

## 20. Open architecture items (not business decisions)

| ID | Item | Blocks | Recommended (not approved) |
| --- | --- | --- | --- |
| AO-01 | Confirm repository layout and deploy flow (gate G-04) | TDMS-0-001 | Approve §0.3 and §16.4 |
| AO-02 | Google account that owns the scripts, sheets and Drive, and its type (gate G-01, answered by D069: personal Gmail, all environments, interim): decides quotas and the "Anyone" policy | AD-01, AD-12, §7 | Keep the personal Gmail with a documented transfer path and a named backup editor (G-08, open); company account only if Leo records a new decision |
| AO-03 | Time zone (gate G-03) | Clock adapter, manifest | Leo names the zone |
| AO-04 | Meaning of "Google Sheets" report output (AD-15) | Report slice | Downloadable .xlsx; no sharing |
| AO-05 | Backup of files (§9, §17) | Hardening | No hard deletes + `sha256` verification + Drive versions |
| AO-06 | Backup retention count (gate G-02 / CD-22) | Backup slice | Leo's number |
| AO-07 | Approval of the history design (gate G-05 / PROP-004) | First data-layer slice | Approve |
| AO-08 | Bundle-version stamp design (CD-38 / PROP-006) | Data layer (stamps) | Adopt |

---

## Appendix A — PH-0 spikes (validate platform assumptions before relying on them)

Each is a small, throwaway test run in the **dev** environment inside packet TDMS-0-001/0-002. A failed spike changes only the mechanism named, not the platform.

| ID | Question | If it fails |
| --- | --- | --- |
| S-01 | Can a shell load a module's view and script on demand inside the HtmlService sandbox? | Ship all module code in the first load (AD-03 fallback) |
| S-02 | How many HMAC-SHA256 iterations run in an acceptable sign-in time? | Lower count and compensate with throttling and pepper; record the number with each hash |
| S-03 | Maximum practical upload size over `google.script.run`; PDF rendering time for photo-heavy CAPAR reports and a batch of memos | Lower size limit / chunked upload; smaller PDF batches |
| S-04 | Read time for 4,000-row and 20,000-row tables (whole-table read, ID lookup); `api.batch` size | Move the slow lists to summary tables; reduce batch size |
| S-05 | Do browsers keep storage inside the iframe (iOS Safari, Android Chrome)? | Offline drafts degrade to a warning (§1.5) |
| S-06 | Does the D069 account (personal Gmail) allow **Execute as owner / Access: Anyone**? What are its mail, trigger and concurrency quotas (a personal account may have lower limits than Workspace; to verify)? | Fallback to "Anyone within the company domain" (AD-01) exists only on a Workspace account; size the digest and job rates to the quotas |
| S-07 | Lock contention: N concurrent writers (e.g. 20) each holding a realistic critical section | Shorten the section; raise the `BUSY` wait; queue the heaviest writes |
| S-08 | Environment guard and `clasp` multi-project push work as designed | Adjust the deploy tool; the guard itself is required |

## Appendix B — Where each approved requirement lands

REQ-001 → §0.2, ARC-01..12 · REQ-002/003 → §16 · REQ-004 → §4.2 · REQ-005 → §4.3, §10, §13 · REQ-006 → §9 · REQ-007 → §17 · REQ-008 → §18 · REQ-009/010 → §1 · REQ-020 → §7 · REQ-025 → §6.

---

**ARCHITECTURE READY FOR IMPLEMENTATION: YES**

Meaning and limits of this answer:

- **YES for the architecture specification.** Every layer in your list is defined, nothing in the approved platform was redesigned, and every addition is marked Proposed with the problem it solves (§0.5). Implementation can start with packet TDMS-0-001, whose first work is Appendix A spikes S-01–S-08. A failed spike changes one mechanism, not the platform.
- **This is not the project-level gate.** DECISION-GATE still answers *READY FOR PHASE 0: NO* until **G-01** (company account, which also decides AD-01/S-06), **G-02** (backup count), **G-03** (time zone) and **G-04** (repository layout) are answered, and the first data-layer slice also needs **G-05**. Those are decisions for you, not architecture gaps.
- **Open architecture items** that do not block the start are AO-04 and AO-05 (§20).
