# TDMS API Contract v1.0 — envelope, rules and method catalogue

Status: FINAL contract for review. Replaces v0.1. Logical specification; no code. Request/response **shapes per method** are completed by each task packet (TDMS-<phase>-<nnn>); this document fixes everything that is common and the **names, kinds, permissions and concurrency** of every method.
Architecture: [ARCHITECTURE](ARCHITECTURE.md) (pipeline §0.4, API §2). Permissions: [PERMISSIONS](PERMISSIONS.md) (Appendix A `PERM-nnn`, §8 matrix). Workflows and audit events: [WORKFLOWS](WORKFLOWS.md). Entities: [DATA-MODEL](DATA-MODEL.md). Settings: [CONFIGURATION](CONFIGURATION.md).

---

## 1. Principles

1. **One server entry point**, `tdmsApi(envelope)`; `api.js` is the only client. Methods are named `module.action`.
2. **The server is the authority.** Every rule, permission, scope and validation is enforced server-side; the client's checks are conveniences.
3. **Identity comes from the session token**, never from the payload.
4. **Deny by default.** A method that is not in the registry does not exist. A method with no PERM id is not registered (ARC-06).
5. **Explicit DTOs.** Responses list their fields; stored rows are never returned. Credential fields are never returned.
6. **Scope before data.** Reads are scope-filtered before anything leaves the server.
7. **Additive evolution inside v1.** New optional fields and new methods only; removing or retyping a field is a new API version.
8. **The same envelope and names move to HTTP** at the PostgreSQL migration (ARCHITECTURE §18).

---

## 2. Transport and envelope

### 2.1 Request

| Field | Type | Req. | Meaning |
| --- | --- | --- | --- |
| `v` | int | yes | API version (1) |
| `build` | text | yes | Client build id; a mismatch with the server returns `CLIENT_OUTDATED` |
| `rid` | text (UUID) | yes | Client correlation id (echoed in `meta`); the server's own `request_id` is authoritative for audit |
| `method` | text | yes | `module.action` from the registry |
| `params` | object | yes | Method input (may be `{}`) |
| `token` | text | except pre-auth methods | Session token |
| `client_ref` | text (UUID) | for creates that can come from an offline draft | Dedupe key; unique per (user, `client_ref`) |
| `reason` | text | for methods that require it (§6.5) | Written reason, stored in the audit row |

Unknown top-level fields and unknown `params` fields are rejected (`VALIDATION`). Maximum envelope size is set by Spike S-03 (file calls are the largest).

### 2.2 Response

Success:

| Field | Meaning |
| --- | --- |
| `ok` | `true` |
| `data` | The method's DTO (object, list or `null`) |
| `meta.request_id` | Server request id (quote in support) |
| `meta.rid` | Echo of the client `rid` |
| `meta.server_time` | ISO-8601 UTC timestamp |
| `meta.server_date` | Today in the organisation time zone, `yyyy-mm-dd` (the UI uses this, never the device clock, for rules) |
| `meta.api_version`, `meta.build` | Server versions |
| `meta.page` | For lists: `{mode, page, page_size, total, has_more, next_cursor}` |
| `meta.as_of` | For summary-backed data: the summary's `updated_at` |

Failure:

| Field | Meaning |
| --- | --- |
| `ok` | `false` |
| `error.code` | One of §4 |
| `error.message` | Developer-oriented text (the UI builds user text from the code) |
| `error.fields` | `VALIDATION`: list of `{path, code, message}` |
| `error.rule_id` | `BLOCKED_BY_RULE` / `LOCKED`: the RULE-nnn that stopped it |
| `error.retry_after` | `AUTH_LOCKED`, `BUSY`: seconds |
| `error.current` | `CONFLICT`: `{row_version, updated_by_name, updated_at}` so the UI can say "changed by X, reload" |
| `meta` | As above |

No stack trace, sheet name, spreadsheet/Drive ID or internal path appears in any response.

### 2.3 Failure outside the envelope

If `google.script.run` itself fails (network loss, 6-minute limit), the client reports `TRANSPORT`. For a **write** the outcome is unknown: the client reloads the record before offering a retry (ARCHITECTURE §2 rule 11). `TRANSPORT` is a client-side condition, not a server code.

---

## 3. Data conventions

| Item | Convention |
| --- | --- |
| Format | JSON-compatible only. No `Date`, no functions, no `undefined` |
| IDs | Prefixed text (`PER-000001`, `CAP-2026-0001`, …; DATA-MODEL §2). Opaque to the client |
| Dates | `yyyy-mm-dd` text, organisation time zone (business dates) |
| Timestamps | ISO-8601 UTC, `…Z` |
| Booleans, numbers | JSON booleans and numbers. Grades are numbers 0–100 |
| Text that looks numeric | Always text: Employee ID (HR number), mobile, batch code |
| Null vs absent | Absent in a patch = unchanged; `null` = clear (where allowed) |
| Enums | Upper-snake or the exact configured label as defined by the entity; unknown value → `VALIDATION` |
| Names | Display only; every reference is by ID (D049) |
| Lists | Always paged (§6.1); no method returns an unbounded list |
| Money | None in v1 |
| Language | Codes and rule ids are stable; messages may change |
| Size | Text fields have schema length limits; no field may carry more than 50,000 characters (cell limit) |

---

## 4. Error codes

| Code | When | Retry? | UI behaviour |
| --- | --- | --- | --- |
| `AUTH_FAILED` | Wrong ID/password (generic; never says which) | user | Show generic message |
| `AUTH_LOCKED` | Sign-in paused after CFG-002 failures; `retry_after` | after pause | Show wait time |
| `AUTH_REQUIRED` | No or invalid token | no | Show sign-in |
| `SESSION_EXPIRED` | Idle limit (CFG-001) or ended by Admin | no | Show sign-in, keep drafts |
| `FORBIDDEN` | Role lacks the PERM id, or the action is not allowed in this state for this role | no | "Not permitted" |
| `NOT_IN_SCOPE` | A filter/parameter names a brand/store outside the caller's scope | no | "Not available" |
| `NOT_FOUND` | Unknown method, unknown ID, **or a record outside the caller's scope** (no existence leak) | no | "Not found" |
| `VALIDATION` | Bad shape, type, required, range, enum, uniqueness | user | Show against `fields` |
| `CONFLICT` | `row_version` mismatch, or VER head ≠ `supersedes_id`; `current` returned | after reload | "Changed by X, reload" |
| `LOCKED` | Closed month or closed record; `rule_id` | no | Explain lock; offer the note path (WF-006) |
| `BLOCKED_BY_RULE` | A business rule or state machine refuses the action; `rule_id` | no | Show rule text |
| `CONFIG_MISSING` | A required setting is still REQUIRES DECISION / unset (CONFIGURATION R14) | no | "Needs setup (Admin)" |
| `BUSY` | Script lock wait timed out; `retry_after` | reads yes; writes after user confirms | "Try again" |
| `QUOTA` | An Apps Script service quota was hit | later | "Try again shortly" |
| `EXTERNAL` | Mail, Drive or AI call failed; the business write is not lost (queued) | automatic | Show job status |
| `CLIENT_OUTDATED` | Client build older than the server's minimum | after reload | "Reload" |
| `SERVER` | Unexpected error; `request_id` only | user may retry reads | "Something went wrong; quote the id" |

v0.1 listed `AUTH_REQUIRED, FORBIDDEN, NOT_IN_SCOPE, VALIDATION, CONFLICT, NOT_FOUND, LOCKED, BLOCKED_BY_RULE, SERVER`; this version adds `AUTH_FAILED, AUTH_LOCKED, SESSION_EXPIRED, CONFIG_MISSING, BUSY, QUOTA, EXTERNAL, CLIENT_OUTDATED`.

---

## 5. Authentication methods (pre-authorization)

These are the only methods callable without a token (except `auth.me`/`auth.signOut`/`auth.changePassword`, which need one).

| Method | K | Input | Output | Notes |
| --- | --- | --- | --- | --- |
| `system.ping` | R | — | `{ok, server_date, build, min_build}` | No data; used by the shell to detect outdated builds before sign-in |
| `auth.signIn` | W | `employee_id` (digits), `password` | `{token, must_change_password, user{id, name, role}, capabilities[], scope, flags, settings_public{idle_minutes, page_size}}` | Throttle CFG-002/003; generic failure; audit `AUTH.SIGNIN` / `.FAILED` / `.LOCKED` |
| `auth.signOut` | W | — | `{}` | Ends the session; `AUTH.SIGNOUT` |
| `auth.me` | R | — | Same user/scope/capabilities block, plus `acting_as{delegation_id, role, until}` when delegated | Also the keep-alive; updates last activity at most once a minute |
| `auth.changePassword` | W | `current`, `new` | `{}` | Rule FX-002; allowed while `must_change_password` is set; ends other sessions; `AUTH.PASSWORD_CHANGED` |
| `auth.requestReset` | W | `employee_id` | `{}` always | Never reveals whether the ID exists; mail queued (J-07); link valid 30 min (FX-001) |
| `auth.completeReset` | W | `token`, `new_password` | `{}` | Single use; `AUTH.RESET_COMPLETED` |

While `must_change_password` is set, every other method returns `FORBIDDEN` (gate in pipeline step 4).

---

## 6. Common patterns (apply to every module)

### 6.1 List methods

Input `params`:

| Field | Meaning |
| --- | --- |
| `filters` | Object of whitelisted filters (equality, `in`, ranges). Unknown key → `VALIDATION` |
| `sort` | One whitelisted key + direction; the server adds an ID tiebreak |
| `page`, `page_size` | Offset mode; `page_size` ≤ 50 (server maximum) |
| `cursor` | Cursor mode for audit/history/notifications; replaces `page` |
| `q` | Optional text search on declared columns only |

Output: `data` = list of DTOs; `meta.page = {mode, page, page_size, total|null, has_more, next_cursor|null}`. Scope is applied first. Totals never count out-of-scope rows. Summary-backed lists add `meta.as_of`.

### 6.2 Get methods

`module.get {id}` returns the DTO including `row_version` for MUT entities. Out-of-scope or unknown → `NOT_FOUND`.

### 6.3 Create

`module.create {…fields}` with optional `client_ref`. Returns the created DTO (with ID, `row_version`). Duplicate rules return `BLOCKED_BY_RULE` (blocking duplicates, e.g. CAPAR) or `data.warnings[]` with `requires_confirm:true` and a repeat call with `confirm:true` (non-blocking duplicates, e.g. same store/date/purpose visit, D028).

### 6.4 Update and state transitions

`module.update {id, row_version, patch}` for field edits. `module.<verb> {id, row_version, …}` for state transitions (`certify`, `extend`, `markVerified`, `close`, …). Both check `row_version` under the lock; both return the new DTO. A transition not allowed from the current state → `BLOCKED_BY_RULE` with `rule_id`.

### 6.5 `reason`

Required (top-level `reason`, non-empty) for: Admin edit/delete/restore/purge; month reopen; settings and permission changes marked A2 (CONFIGURATION CD-31); EXECom flag changes; delegation approvals' rejections; early cross-training (a short `remark` field, D060); return TL to probation; any method the registry marks `reason:required`. Missing → `VALIDATION`.

### 6.6 Deactivate / delete / restore

`module.deactivate {id, row_version, reason?}` and `module.reactivate`: status change, history kept. `admin.delete {entity, id, reason}` moves to the Recycle bin (Admin only, D021); `admin.restore {recycle_id, reason}`. No other method removes a record. Referenced records cannot be deleted (only deactivated, §7.9).

### 6.7 Long-running work (jobs)

A method that cannot finish inside a request returns `{job_id, status:"Queued"}` (kind **J**). The client polls `jobs.get {job_id}` (Pending → Running → Done | Failed) or reads the notification. Results that are files are opened with `files.open`. Used by: PDF/exports, Store Health refresh on demand, month snapshot, imports over a threshold, AI draft, batch memos.

### 6.8 Batch of reads

`api.batch {calls:[{id, method, params}, …]}` executes up to **N** read methods (N set by Spike S-04) with one authentication; returns `{results:[{id, ok, data|error}]}`. A write inside a batch → `VALIDATION`. Each call is authorized and scope-filtered individually.

### 6.9 Files

- Upload: `files.upload {kind, owner_ref{type,id}, name, mime, size, content_base64, client_ref}` → `{file_id, name, size, sha256}`. The server validates type, size (CFG-062/016) and magic bytes. It is called in the same logical step as the record it attaches to (the record's create/update may reference `file_id`).
- Open: `files.open {file_id}` → `{name, mime, size, content_base64}` after PERM-130 and record scope are checked. No Drive URL is ever returned.
- Delete: through `admin.delete` / the owning record's method; never directly.

### 6.10 Concurrency summary

| Entity profile | Input requirement |
| --- | --- |
| MUT | `row_version` on every update/transition |
| APP | none (append) — duplicates by `client_ref` or business rule |
| VER | `supersedes_id` (the head the caller saw) |
| SYS | server only |

### 6.11 Audit

Every write method names its **audit event** (WORKFLOWS event codes). Reads are not audited, except `files.open` of restricted categories, `audit.*` reads and `reports.run` of EXECom/confidential reports (events `FILE.OPENED`, `AUDIT.VIEWED`, `REPORT.RUN`).

---

## 7. Method registry (what every registry row contains)

| Attribute | Meaning |
| --- | --- |
| `method` | `module.action` |
| `kind` | R read · W write · J job · F file |
| `perm` | One or more `PERM-nnn` (PERMISSIONS Appendix A) or `§8 <row>/<action>` where no PERM id exists; **deny until decided** where marked ⛔ |
| `scope` | Scope strategy: own, assigned brand, assigned store, all, delegated, none |
| `schema` | Input schema (types, required, enums, lengths) |
| `lock` | Whether the write takes the script lock |
| `concurrency` | row_version / supersedes_id / none |
| `audit` | Event code or "none" |
| `reason` | required / optional / none |
| `gate` | Open item that blocks building it (DECISION-GATE / ISSUE-REGISTER) |

---

## 8. Method catalogue

Conventions: **K** = kind (R/W/J/F). **Conc** = `rv` (row_version), `sup` (supersedes_id), `—`. ⛔ = permission or behaviour not decided; implemented as deny until decided. "Gate" cites the open item. Every list method follows §6.1 and every get §6.2.

### 8.1 System and session

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `system.ping` | R | none (pre-auth) | — | none |
| `system.health` | R | §8 Administration (Admin; Senior view) | — | Last job runs, queue depth, backup status, error counts, cell budget, environment, build |
| `jobs.get` | R | caller's own job, or Admin | — | none |
| `jobs.list` | R | Admin | — | none |
| `jobs.retry` | W | Admin | rv | `JOB.RETRIED` |
| `api.batch` | R | per call | — | none |

### 8.2 Auth, users, permissions, delegation

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `auth.signIn` / `signOut` / `me` / `changePassword` / `requestReset` / `completeReset` | W/R | §5 | — | AUTH.* |
| `users.list` / `get` | R | PERM-110 | — | none |
| `users.create` | W | PERM-110 | — | `USER.CREATED` (temporary password issued once, shown once) |
| `users.update` | W | PERM-110 (no self-role-change) | rv | `USER.UPDATED` |
| `users.setBrands` | W | PERM-110 | rv | `USER.BRANDS_SET` (assigned brands, D005) |
| `users.resetPassword` | W | PERM-111 | rv | `USER.PASSWORD_RESET` (new temporary password; forces change) |
| `users.clearCooldown` | W | PERM-111 | rv | `USER.COOLDOWN_CLEARED` |
| `users.setExecomFlag` | W | PERM-117 | rv | `USER.FLAG_SET`, reason required; at least one active holder |
| `users.deactivate` | W | PERM-115 (Admin approves; requester ⛔ AMB-15) | rv | `USER.DEACTIVATED`, `SESSION.ENDED_BY_ADMIN`; last-Admin guard; opens queue items (WF-012) |
| `users.reactivate` | W | PERM-110 | rv | `USER.REACTIVATED` |
| `perms.matrix.get` | R | PERM-112 / Admin | — | none |
| `perms.matrix.set` | W | PERM-118 ⛔ (editor undecided, G-06; proposed Admin) | sup | `PERM.CHANGED`, reason required; last-Admin lockout guard |
| `delegation.request` | W | PERM-101 | — | `DELEGATION.REQUESTED` |
| `delegation.list` / `get` | R | own, parties, Admin | — | none |
| `delegation.approve` / `reject` | W | PERM-102 (chain per WF-007; never self) | rv | `DELEGATION.APPROVED` / `.REJECTED` |
| `delegation.cancel` | W | requester | rv | `DELEGATION.CANCELLED` |
| `delegation.end` | W | PERM-103 | rv | `DELEGATION.ENDED`; access removed at once; reason required |

### 8.3 Configuration (settings, lookups, holidays)

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `settings.list` | R | M Sr A view (S ⛔ AMB-07) | — | Definitions + value in force + history |
| `settings.get` | R | same | — | Value in force on a date |
| `settings.set` | W | PERM-112; per setting "Who" (CFG-082: S or M) | sup | `SETTING.CHANGED` (old/new/effective_from); reason for A2; validation per CONFIGURATION R7 (whole bundle); `CONFIG_MISSING` consumers unaffected until set |
| `settings.bundle.get` | R | internal (services) | — | Returns the bundle version in force for a date |
| `lookups.list` / `get` | R | all roles (non-sensitive lists) | — | none |
| `lookups.create` / `update` / `deactivate` / `reactivate` | W | PERM-112 | rv | `LOOKUP.*`; system items refuse rename/disable (FX-027) |
| `holidays.list` | R | all | — | none |
| `holidays.create` / `update` / `deactivate` | W | PERM-112 | rv | `HOLIDAY.*` |

### 8.4 Master data

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `brands.*`, `regions.*`, `positions.*`, `stations.*` (list, get, create, update, deactivate, reactivate) | R/W | view all; write PERM-061 (M Sr A) | rv | `MASTER.<ENTITY>.*`; brand code immutable |
| `locations.list` / `get` | R | all (scope for SH/AM) | — | none |
| `locations.create` / `update` | W | PERM-061 | rv | `LOCATION.*` |
| `locations.deactivate` | W | PERM-115/061 (WF-011) | rv | `LOCATION.DEACTIVATED`; opens queue items |
| `programs.*` | R/W | write PERM-061 (M per Handover §3; AMB-07) | rv | `PROGRAM.*` |
| `stationPlans.get` / `set` | R/W | PERM-112 | sup | `PLAN.CHANGED` (CFG-033, effective-dated) |
| `components.*`, `stationComponents.*` | R/W | PERM-112 | rv / sup | `COMPONENT.*` (CFG-034/035) |
| `durations.get` / `set` | R/W | PERM-112 | sup | `DURATION.CHANGED` (CFG-030) |

### 8.5 Person, employee

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `persons.get` | R | all TDD (scope) | — | none |
| `persons.matchCandidates` | R | O S M Sr A | — | Duplicate/possible-match check (D006, D044): returns proposals only |
| `persons.merge` | W | S M Sr A ⛔ (single writer PersonService; rule per packet) | rv | `PERSON.MERGED`; person ID never changes |
| `employees.list` / `get` | R | all TDD; SH/AM scope (v2) | — | none |
| `employees.create` | W | A (HR import) / single add ⛔ AMB-04 | — | `EMPLOYEE.CREATED` |
| `employees.update` | W | ⛔ AMB-04; A(reason) | rv | `EMPLOYEE.UPDATED` (field history) |
| `employees.requestDeactivation` | W | PERM-115 ⛔ | — | `EMPLOYEE.DEACTIVATION_REQUESTED` |
| `employees.decideDeactivation` | W | Admin | rv | `EMPLOYEE.DEACTIVATED` / `.REJECTED`; opens queue items |
| `employees.reactivate` | W | Admin | rv | `EMPLOYEE.REACTIVATED` |
| `employees.recordRegularization` | W | per packet (D057) | rv | `TRAINEE.REGULARIZATION_RECORDED` |

### 8.6 Visits, plans, calendar, Store Health

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `calendar.load` | R | PERM-015 | — | One composite read: plans, visits, sessions for a range; scope-filtered |
| `plans.create` | W | PERM-012 | — | `VISIT.PLANNED`; warns on same-day plan for the store; linked from CAPAR/TL/expiry when given |
| `plans.move` | W | PERM-013 (officer own/assigned; Admin ⛔) | rv | `VISIT.MOVED`; D040; "Move to date" uses the same method |
| `plans.reassign` | W | PERM-014 | rv | `VISIT.REASSIGNED` |
| `plans.cancel` | W | S M Sr; O own | rv | `VISIT.CANCELLED` (PROP-002) |
| `visits.list` / `get` | R | PERM-015 | — | none |
| `visits.log` | W | PERM-010 | — | `VISIT.COMPLETED`; one purpose (D017); duplicate warning (D028); `client_ref` for drafts |
| `visits.edit` | W | PERM-011 (officer within CFG-004 window) | rv | `VISIT.EDITED` |
| `visits.attachReport` | F | PERM-010/011 | rv | `VISIT.REPORT_ATTACHED` (PDF only, D035) |
| `visits.generateReport` | J | PERM-121 ⛔ (Option A/B open, ISS-P1-18) | rv | `VISIT.REPORT_GENERATED` |
| `visits.createVerificationVisit` | internal | called by CaparService only | — | `CAPAR.VERIFICATION_VISIT_CREATED` / `_LINKED` (D062, no double count) |
| `health.list` | R | PERM-015 (scope) | — | Summary-backed; `meta.as_of` |
| `health.get` | R | same | — | Score parts, tier, action, attention reason; "as of" settings version |
| `health.refresh` | J | S M Sr A | — | `HEALTH.REFRESH_REQUESTED`; normally enqueued by saves |
| `reports.dailyActivities` | R | PERM-121 ⛔ | — | Messenger-ready text for a date |
| `reports.storeVisitReport` | J | PERM-121 ⛔ | — | per ISS-P1-18 |

### 8.7 CAPAR

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `capar.list` / `get` | R | O S M Sr A; SH/AM ⛔ | — | none |
| `capar.open` | W | PERM-020 | — | `CAPAR.OPENED`; duplicate (store + audit type + audit date) → `BLOCKED_BY_RULE`; QA report file required (FX-013) |
| `capar.draftFromReport` | J | PERM-025 | rv | `CAPAR.AI_DRAFT_REQUESTED`; **gate ISS-P0-18** (AI v1 or v2); output flagged `ai_drafted` until accepted |
| `capar.confirmFindings` | W | PERM-025 | rv | `CAPAR.AI_DRAFT_CONFIRMED`; report's own numbering preserved |
| `capar.findings.save` | W | PERM-025 | rv | `CAPAR.FINDING_EDITED`; one block per numbered finding, sub-findings a/b/c inside |
| `capar.photos.attach` | F | PERM-025 | rv | `CAPAR.PHOTO_ATTACHED`; limits CFG-062 (**gate** ISS-P1-15) |
| `capar.schedule` | W | PERM-021 ⛔ (AMB-05) | rv | `CAPAR.SCHEDULED`; stage due date stamped with `sla_version_id` |
| `capar.markVerified` | W | PERM-022 | rv | `CAPAR.VERIFIED` + visit create/link; counts for the marking officer (**gate** ISS-P1-19) |
| `capar.sendToQa` | J | PERM-023 | rv | `CAPAR.REPORT_SENT_TO_QA`; PDF + email; send date; address used stamped (**gate** CFG-061) |
| `capar.recordEndorsement` | W | PERM-023 | rv | `CAPAR.QA_ENDORSED`; sets `qa_endorsed_on`; trigger undefined (**gate** ISS-P1-01) |
| `capar.close` | W | PERM-024 | rv | `CAPAR.CLOSED`; refused without QA endorsement date; Closed is locked |
| `capar.reassign` | W | PERM-116 | rv | `CAPAR.REASSIGNED` |
| `capar.report.pdf` | J | O S M Sr A | — | Generates the CAPAR PDF with photos under each finding |

### 8.8 Trainees, batches, imports, EXECom

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `batches.list` / `get` | R | PERM-040 (TDD only; SH/AM never) | — | none |
| `batches.create` | W | PERM-042 ⛔ (AMB-06) | — | `BATCH.CREATED`; batch code text, DTS valid (D046) |
| `batches.update` | W | PERM-042 ⛔ | rv | `BATCH.UPDATED` |
| `trainees.list` / `get` | R | PERM-040 | — | none |
| `trainees.enroll` | W | PERM-041 | — | `TRAINEE.ENROLLED`; milestone dates from the timeline bundle; duplicate check D006 (`persons.matchCandidates`) |
| `trainees.adjustDates` | W | PERM-043 (logged) | rv | `TRAINEE.DATES_ADJUSTED` |
| `trainees.recordGrade` | W | PERM-041 | rv | `TRAINEE.GRADE_RECORDED` (assessment row) |
| `trainees.confirmStationResult` | W | PERM-041 | rv | `TRAINEE.GRADE_CONFIRMED`, `.STATION_PASSED` / `.STATION_FAILED`; stamps `settings_version_id`, `passing_mark_used` |
| `trainees.scheduleRetake` | W | PERM-041 | rv | `TRAINEE.RETAKE_SCHEDULED` (next Friday; unlimited within the period, D056) |
| `trainees.setStatus` | W | PERM-046 ⛔ (pass below mark / correct final status) | rv | `TRAINEE.STATUS_CHANGED`; remark required; `LOCKED` in a closed month |
| `trainees.recordHrEndorsement` | W | per packet | rv | `TRAINEE.HR_ENDORSEMENT_RECORDED` (result values **gate** CFG-038) |
| `import.start` | W | PERM-044 | — | `IMPORT.STARTED`; chooses template (trainee, HR, TL, certifications, CAPAR history, SVMI history, sessions) |
| `import.upload` | F | PERM-044 | — | `IMPORT.UPLOADED` |
| `import.validate` | J | PERM-044 | rv | `IMPORT.VALIDATED`; row statuses valid/skipped/error |
| `import.rows.list` | R | submitter, FLAG-001 | — | Review screen rows |
| `import.rows.fix` / `skip` | W | submitter before submit | rv | `IMPORT.ROW_FIXED` / `.ROW_SKIPPED` |
| `import.submit` | W | PERM-044 | rv | `IMPORT.SUBMITTED` (trainee imports go to verification) |
| `import.verify` / `commit` / `reject` | W/J | PERM-045 (FLAG-001 only) | rv | `IMPORT.VERIFIED` / `.COMMITTED` / `.REJECTED`; backup taken before commit (AD-14) |
| `execom.report` | R | PERM-040 | — | Computed from status on the report date, never typed; summary-backed |

### 8.9 Team Leaders

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `tl.list` / `get` / `history` | R | O S M Sr A (SH/AM never) | — | History view over status/record history (D048) |
| `tl.enroll` | W | PERM-030 | — | `TL.ENROLLED`; one open enrollment per person; deadline = entry + probation (CFG-040) |
| `tl.recordEntryGrade` | W | PERM-030 | rv | `TL.ENTRY_GRADE_RECORDED` |
| `tl.recordCertCheck` | W | PERM-031 | rv | `TL.CERT_CHECK_RECORDED` (checklist, exam, ≥ 1 feedback score); final computed, **formula gate** D053/CFG-044 |
| `tl.certify` | W | PERM-031 (no approval, D067) | rv | `TL.CERTIFIED`; stamps pass mark and weights used |
| `tl.extend` | W | PERM-031 | rv | `TL.EXTENDED`; numbered extension row; limit **gate** CFG-047 |
| `tl.close` | W | PERM-031 | rv | `TL.FAILED`; reason |
| `tl.quit` | W | PERM-032 | rv | `TL.QUIT`; closes as Quit (not Failed); cancels open TLTC plan; reason from CFG-018 (**gate** values) |
| `tl.returnToProbation` | W | PERM-033 | rv | `TL.RETURNED_TO_PROBATION`; note required |
| `tl.promote` | W | PERM-034 ⛔ (Admin "higher", AMB-02); S M Sr | rv | `TL.PROMOTED`; only a Certified TL |
| `tl.uniform.log` | W | PERM-035 | — | `TL.UNIFORM_LOGGED`; same entry cannot be logged twice |

### 8.10 Proficiency, cross-training, expiry

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `certs.matrix` | R | PERM-051 (scope) | — | Summary-backed; one row per employee, one column per station; `meta.as_of` |
| `certs.get` / `history` | R | PERM-051 | — | none |
| `certs.recordValidation` | W | PERM-050 | — | `CERT.VALIDATION_RECORDED`; requires grades and photo proof for every required component (D059, D064); new record supersedes the old |
| `certs.recordCrossTraining` | W | PERM-050 | — | `CERT.CROSS_TRAINING_RECORDED`; early (< CFG-053) needs `remark` and sets the early flag (D060); pass rule **gate** CFG-054 |
| `certs.correct` | W | A(reason) only | rv | `CERT.CORRECTED` |
| `expiry.list` / `get` | R | O(asg) S M Sr A | — | One task per store (§5.4); summary-backed |
| `expiry.assign` | W | PERM-052 | rv | `EXPIRY_TASK.ASSIGNED` |
| `expiry.schedule` | W | PERM-053 | rv | `EXPIRY_TASK.SCHEDULED` (creates a plan linked to the task) |
| `expiry.complete` | W | assignee, S M Sr | rv | `EXPIRY_TASK.COMPLETED` |
| `queue.list` | R | PERM-116 | — | Reassignment queue (WF-013) |
| `queue.reassign` / `close` | W | PERM-116 | rv | `QUEUE.REASSIGNED` / `.CLOSED`; close requires a reason |

### 8.11 Training sessions, library, LMS

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `training.sessions.list` / `get` | R | O S M Sr A | — | none |
| `training.sessions.create` / `update` | W | PERM-060 | rv | `SESSION.CREATED` / `.UPDATED`; type "Team Leader" supported (D032) |
| `training.sessions.move` | W | PERM-060 (drag in Calendar) | rv | `SESSION.MOVED` |
| `training.attendance.mark` | W | PERM-060 | rv | `ATTENDANCE.MARKED` (by person ID); post-test score uses CFG-037 |
| `library.categories.*` | R/W | write PERM-112 | rv | `LIBRARY.CATEGORY.*` |
| `library.resources.list` / `get` | R | PERM-073; restricted PERM-071 | — | Restricted files hidden from others |
| `library.resources.create` / `update` | W/F | PERM-070 | rv | `LIBRARY.UPLOADED` / `.UPDATED`; allowed types CFG-016 |
| `lms.search` | R | PERM-073 | — | Filters brand and topic; FAQ suggestions |
| `lms.ask` | W | ⛔ AMB-13 | — | `LMS.QUESTION_ASKED` |
| `lms.answer` / `faq.publish` | W | PERM-072 | rv | `LMS.ANSWERED` / `FAQ.PUBLISHED` |

### 8.12 KPI/KRA, attendance, survey

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `kpi.myScorecard` | R | PERM-080 (own, read only) | — | none |
| `kpi.scorecards.list` / `get` | R | PERM-081 | — | Summary-backed; closed months from the snapshot |
| `kpi.department` | R | PERM-081 | — | Σ actual ÷ Σ target per KRA (D034) |
| `kpi.targets.get` | R | PERM-081 | — | none |
| `kpi.targets.set` | W | PERM-082 (S, M; Sr/A ⛔ AMB-08) | sup | `KPI.TARGET_SET` |
| `kpi.kra.get` / `set` | R/W | PERM-112 | sup | `KRA.CHANGED` (weights CFG-080, bands CFG-081) |
| `attendance.mark` | W | PERM-083 ⛔ (S; M/Sr undecided) | rv | `ATTENDANCE_LOG.MARKED` |
| `survey.import` | W/J | PERM-084 ⛔ | — | `SURVEY.IMPORTED`; source and maximum **gate** CFG-084 |

### 8.13 Month close

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `close.status` | R | O S M Sr A | — | Month state, deadline, checks |
| `close.request` | W | PERM-090 ⛔ (S; M Sr A undecided, AMB-10) | rv | `MONTH.CLOSE_REQUESTED`; enqueues the staged snapshot job (PROP-003) |
| `close.snapshot.get` | R | O S M Sr A | — | Frozen rows: EXECom, KPI scorecards, coverage, Store Health, CAPAR status; stamps shown |
| `close.reopen` | W | PERM-091 (M, A; Sr ⛔) | rv | `MONTH.REOPENED`, reason required; backup taken first |
| `close.noteLateChange` | W | via the owning service | — | `MONTH.LATE_CHANGE_NOTED`; shows in the next open month |

### 8.14 Reports, notifications, approvals

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `reports.list` | R | PERM-120 | — | Registry of reports the caller may run |
| `reports.run` | R/J | PERM-120 per report (EXECom: PERM-040) | — | `REPORT.RUN` for confidential reports; inline or job |
| `reports.export` | J | PERM-120 | — | PDF / spreadsheet download / print HTML (AD-15 open) |
| `notifications.list` | R | own | — | Cursor paging |
| `notifications.markRead` | W | own | — | none |
| `digest.preferences.get` / `set` | R/W | own ⛔ (opt-out undecided, CFG-091) | rv | `DIGEST.PREFERENCE_CHANGED` |
| `approvals.list` / `get` | R | PERM-100 | — | Approvals queue, "awaiting approval" |
| `approvals.decide` | W | per item type (see the owning module) | rv | the item's own event |

### 8.15 Audit, recycle bin, files, admin

| Method | K | Perm | Conc | Audit / note |
| --- | --- | --- | --- | --- |
| `audit.list` | R | PERM-113 (Admin; Senior view incl. Admin actions) | — | Cursor paging; current + archive; `AUDIT.VIEWED` |
| `history.get` | R | the record's PERM | — | Status/field history of a record the caller can read |
| `recycle.list` / `get` | R | PERM-114 | — | none |
| `admin.edit` | W | PERM-114 | rv | `ADMIN.EDITED` (old/new), reason required, row_version +1 |
| `admin.delete` | W | PERM-114 | rv | `ADMIN.DELETED` (to Recycle bin), reason required; only if unreferenced |
| `admin.restore` | W | PERM-114 | — | `ADMIN.RESTORED`, reason required |
| `admin.purge` | W | PERM-114 ⛔ (policy CD-25) | — | `ADMIN.PURGED`, reason required |
| `files.upload` / `open` | F | PERM-130 per category and record scope | — | `FILE.UPLOADED`; `FILE.OPENED` for restricted categories |
| `files.info` | R | PERM-130 | — | Metadata only |

---

## 9. Rules for adding or changing a method

1. Added only through a task packet that names the method, PERM id, scope, schema, concurrency, audit event, error codes and tests.
2. Permission not in PERMISSIONS → **BLOCKED**; no invented PERM id.
3. A method that writes a result that depends on a configurable rule returns the stamp (bundle version) in its DTO.
4. A method affecting another module's entity calls that module's service, not its tables.
5. Names are never reused with a different meaning. A removed method stays reserved.
6. Breaking changes → API version 2 and a compatibility period; v1 changes are additive.
7. Every method gets contract tests (§10).

---

## 10. Contract tests (map into the TEST-STRATEGY families PLAT-, AUTH-, PERM-)

| ID | Test |
| --- | --- |
| API-001 | Unknown method → `NOT_FOUND`; method without PERM id cannot be registered |
| API-002 | Missing/invalid token → `AUTH_REQUIRED`; idle token → `SESSION_EXPIRED` |
| API-003 | `must_change_password` blocks every method except the three allowed |
| API-004 | Role without the PERM id → `FORBIDDEN`; out-of-scope record → `NOT_FOUND`; out-of-scope filter → `NOT_IN_SCOPE` |
| API-005 | Payload `user_id`/role fields are ignored or rejected; identity only from the token |
| API-006 | Unknown params field → `VALIDATION` with `fields` |
| API-007 | Stale `row_version` → `CONFLICT` with `current`; version +1 on success; Admin edit also +1 |
| API-008 | Repeated create with the same `client_ref` saves once |
| API-009 | List: page ≤ 50 enforced; unknown filter rejected; scope applied before total; stable order |
| API-010 | No response contains a stack trace, spreadsheet/Drive ID, sheet name or credential field |
| API-011 | Closed month write → `LOCKED` with `rule_id`; closed snapshot unchanged |
| API-012 | `CONFIG_MISSING` when a REQUIRES-DECISION setting is unset; no default applied |
| API-013 | Every write produces its audit event with the request id; a write without audit is a failure |
| API-014 | `reason`-required methods reject empty `reason` |
| API-015 | Write inside `api.batch` rejected |
| API-016 | Old client build → `CLIENT_OUTDATED` |
| API-017 | A file response never contains a Drive URL; `files.open` re-checks permission each call |
| API-018 | Deactivated user's token is refused at once |
| API-019 | Delegation end removes extra access on the next call |
| API-020 | Dates are `yyyy-mm-dd`, timestamps UTC `Z`; numeric-looking IDs (HR number, batch `9E-26`) round-trip as text |

---

## 11. Open items affecting the contract

| Item | Effect | Source |
| --- | --- | --- |
| ⛔ methods | Built as deny until the decision is made | PERMISSIONS AMB-01..16, G-06 |
| AI methods (`capar.draftFromReport`, Option A report) | Not built until IT approval and the AI-in-v1 decision | ISS-P0-18 |
| `visits.generateReport`, `reports.storeVisitReport` | Option A vs B | ISS-P1-18 |
| `reports.export` spreadsheet format | .xlsx download proposed (no sharing) | AO-04 |
| `capar.recordEndorsement` trigger, QA status values | Undefined | ISS-P1-01, CFG-019 |
| `lms.ask`, `survey.import`, `attendance.mark` roles | Undecided | AMB-13, 09 |
| `import.*` template columns | Still "approve" | ISS-P1-12 |
| `api.batch` size N, upload size limit | Set by spikes | S-03, S-04 |
