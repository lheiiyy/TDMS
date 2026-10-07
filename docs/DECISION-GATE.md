# TDMS Baseline Decision Gate v0.1 (2026-10-07)

Checked against: Handover (D1–D68, §3, §9, §10, §11), Plan Audit, and the baseline set A–J. No decision reopened. Audit recommendations are not treated as requirements unless the Handover adopts them. No code.

**Naming:** the Handover calls its first §10 item "Foundation" and elsewhere "Phase 0". In this gate **Phase 0 = Foundation** (the Handover's §10 item 1). ROADMAP v1.0 splits it into PH-0 to PH-8 (mapping in ROADMAP §8).

**Corrections to my own ISSUE-REGISTER (this gate supersedes it):**
- ISS-P0-05 was overstated. Handover §3 says Store Head and Area Manager "roles are built into the role model in Phase 0; accounts go live in v2" (D2, §9). That is decided. Only the §11 checkbox is stale.
- ISS-P0-09, 10, 11, 12, 13, 14, 15 are already fixed by D27, D37, D15, §7.4, §7.10, §8. They are engineering design inside task packets, not open decisions.
- ISS-P0-08 is mostly fixed: D24 says Employee ID is the HR employee number, digits only, no fixed length; D49 server IDs. This also settles Audit R13.
- Store Health: Handover §5.8 states the formula in full and D29 says "unchanged". The missing source file affects parity testing, not the build.
- New finding ISS-P0-18: the Handover contradicts itself on AI (see C).

---

## A. LOCKED

| Area | Locked content | Source |
| --- | --- | --- |
| Product scope | v1 / on hold / v2 / not planned / out-of-scope lists | §9 |
| Architecture | UI → `api.js` → services → rules → repository → Sheets; private Drive; company-owned script; separate dev spreadsheet and Drive; paging; pre-computed summaries; queued heavy rebuilds; repo `lheiiyy/TDMS`; later PostgreSQL schema in the same repo | §2, D12, D27, D41, D47 |
| Identity | Person, TEMP ID, single Person record; server-generated IDs everywhere; names display only; Employee ID = HR number, login = Employee ID + salted/repeated-hash password | D3, D24, D44, D49, D23 |
| Employee data | One-time HR import, then TDD maintains every field; employee created at trainee Passed; person ID never changes | D25, D38, D57 |
| Roles | 7 roles in the role model from Phase 0; accounts for Store Head/Area Manager in v2; one role per user; Training Assistant Supervisor = Supervisor; EXECom officer = Admin-set flag; delegation in v1; no fixed store owner; officers by brand only | §3, D2, D4, D5, D15, D26, D37 |
| Authorization | One server-side permission system; Admin keeps the Roles-spec approval rights (Admin-loses-approval **not** approved); promotion = Supervisor or higher | D23, D31, §4 note |
| Data integrity | Months lock at close (5th, after the 24-hour edit window); rule changes affect new results only; status history; TL history; Admin-only edit/delete, logged, restorable; deactivation sends open items to supervisor queue | D7, D8, D21, D36, D42, D48 |
| Visits | One purpose per visit; every visit counts; plan from any store screen; visit file = PDF, no photos; locations typed, only Store counts | D17, D28, D35, D45, D61 |
| CAPAR | Intake, duplicate block (store + audit type + audit date), QA report file, PDF emailed to QA with send date recorded, structured corrective actions, working-day stage targets, verification is a visit, one shared audit/failure type list | D10, D29, D30, D62 |
| Store Health | v2.0.0 as stated in §5.8 (purpose scores, +5 failure with −1 clean-month decay, compliance, tiers LOW <5 / MEDIUM 5–9 / HIGH ≥10) | D29 |
| Trainees | Two tracks (Corporate 90 d, Franchise/Agency 15 d); orientation one week; Friday exams; weighted grade 10/20/70 with redistribution; pass mark per station (89 staff / 90 manager defaults); station plans; unlimited retakes within the period; DTS batch valid | D43, D46, D50, D52, D54–D56 |
| TL | History kept; officer certifies/extends/closes with no approval step; Quit separate | D48, D67, D68 |
| KPI | Five-KRA monthly scorecard 25/25/20/20/10; department KPI; calendar reporting year; officer's own scorecard read only | D9, D11, D33, D34, D39, D40 |
| Reporting/ops | PDF + Sheets + print; email digest; every device; Calendar drag on mouse and touch; no AI in LMS | D13, D14, D16, D20, D23 |
| Configuration rules | Configurable vs fixed vs system vs requires-decision classes; versioned settings with effective dates; audit on every change | Instruction §9, D8, CONFIGURATION.md |

---

## B. OPEN (genuine business/product decisions, grouped by when they bite)

### B1. Blocks Phase 0 start (full detail)

**G-01 · ISS-P0-04 · Company Google account**
- Description: D12 is approved but no account is named. The Roles spec names a personal Gmail.
- Source: D12, §2, §11 (listed "needed before Phase 0").
- Why: it owns the database, script, Drive and sender address; ownership cannot be moved cheaply later.
- Affects: all modules; Auth (reset email), CAPAR (QA email), backup.
- Decision: name the account and confirm it is Workspace or standard and that it will own script, sheets and Drive.
- Recommended: a dedicated shared company account (not a person's), with two named co-owners.
- If chosen differently: a personal account breaks D12; a person-bound account becomes a continuity risk.

**G-02 · ISS-P1-14 · Nightly backup count**
- Description: how many nightly backups to keep.
- Source: §11 (paired with G-01 as pre-Phase 0), §9 (nightly backup is v1).
- Why: Handover gates it before Phase 0; it is functionally needed only at the backup slice.
- Affects: Admin/ops, Drive quota.
- Decision: a retention number.
- Recommended: leave the value to Leo; any number is acceptable provided it fits the Drive quota. I do not propose one.
- If different: too few limits restore depth; too many consumes quota.

**G-03 · ISS-P0-17 · Time zone**
- Description: no document fixes the zone for "today", working days, month close, Friday exams.
- Source: gap found in this baseline (not in the Handover).
- Why: the Apps Script project time zone is set at creation, and every date rule depends on it.
- Affects: all date logic, CAPAR SLA, month close, digest.
- Decision: one organisational time zone.
- Recommended: Asia/Manila (inferred from the 09XXXXXXXXX mobile format; unverified). Please confirm.
- If different: dates shift around midnight; month-close and Friday results can fall in the wrong month.

**G-04 · ISS-P0-01 · Repository layout and environment sign-off**
- Description: D41/D47 fix the repo and separate dev data. The folder layout, deploy flow and how test/live are separated are my proposal (HANDOFF-MODEL §7).
- Source: §2 (approved principles); layout proposed by baseline.
- Why: the first task packet needs it.
- Affects: all.
- Decision: approve or amend the layout.
- Recommended: approve as proposed.
- If different: only rework of packet TDMS-0-001.

### B2. Blocks the first data-layer slice (1A), not repo bootstrap

**G-05 · ISS-P0-02 + DATA-MODEL approval (Audit F2)**
- Description: approve DATA-MODEL v0.1 as the Phase 0 table list, including PROP-004 (one audit mechanism with three views: audit log, field history, status history). Handover §7.5, §7.6, §7.10, D23 and D48 each describe history separately.
- Source: Audit F2 "rewrite table list from Handover decisions"; the Handover does not itself adopt a table list.
- Why: Phase 0 tables would otherwise be rebuilt (Audit's own warning).
- Affects: every module.
- Decision: approve the entity list and the history design, or amend.
- Recommended: approve; the mechanism consolidates, it adds no business rule.
- If different: three overlapping history stores, double-write risk, larger cells.

### B3. Blocks authorization slice (1D)

**G-06 · ISS-P0-06 · Permission matrix completion**
- Description: (a) who edits the role-permission matrix; (b) cells marked `?` in PERMISSIONS.md have no approved source; (c) whether "Supervisor or higher" in D31 includes System Admin.
- Source: §7.4, D23, D31; Admin approval rights retained (§4 note).
- Why: it is the access model; unclear cells would become accidental permissions.
- Affects: all modules; Admin; Calendar, CAPAR, TL.
- Decision: (a) editor, (b) a Y/N for each `?`, (c) Admin's promote right.
- Recommended: (a) Admin edits with audit and a last-admin guard; (b) deny until decided (this is how I will implement); (c) follow the Roles spec for Admin, since Admin keeps its approval rights.
- If different: wrong default grants access that was never approved.

**G-07 · Import inputs for 1F (data availability, not a rule)**
- Description: HR masterlist sample/format and the TDD team list are not in the bundle. Employee ID format itself is settled (D24).
- Source: D3, D25, §10 item 1.
- Why: the one-time import and Employee ID matching cannot be specified without sample rows.
- Affects: Person/Employee, Auth.
- Decision: supply the files (masked if needed).
- Recommended: supply before 1F.
- If different: import mapping stays "inferred".

### B4. Open, blocking only the module named

| ID | Description and source | Why / affected | Decision required | Recommended | If different |
| --- | --- | --- | --- | --- | --- |
| ISS-P0-18 | **Handover conflict on AI:** §9 lists "any AI feature" under v2, but D65 approves a CAPAR AI checklist (Gemini for testing) and §11 lists Gemini IT approval and the Store Visit Report Option A (AI) vs B (template). | CAPAR, Visits | Is any AI in v1? Which Visit Report option? | Treat D65 as testing-only; build v1 without AI; Visit Report = Option B (template), consistent with §9. Do not build the Gemini slice until IT approves | Building AI early risks sending QA reports to Google without approval |
| ISS-P1-01 | CAPAR "Endorsed": D030/§5.3 record the **send date** when TDMS emails the PDF, and §5.3 also requires a separate **QA endorsement date** before Closed. What triggers the Endorsed state (sending, or QA's confirmation) and any QA status values are undefined. | CAPAR | Define the Endorsed trigger | Send date recorded at emailing; Endorsed = QA endorsement date entered; no QA status values in v1 | A QA-confirmation step or status list adds fields and an inbound step not approved |
| ISS-P1-10 | CAPAR targets for Scheduled→Verified, Verified→Endorsed, Endorsed→Closed, and QA email (§11). Only Failed→Scheduled = 7 is fixed. | CAPAR, notifications | Three numbers and an address | Leo supplies | Without them SLA monitoring cannot run |
| ISS-P1-15 | Photos per finding and max file size (D66 approved; limits open, §11). | CAPAR, Drive | Two numbers | Leo supplies | Quota and upload failures |
| ISS-P1-19 | Verification visit with 2+ officers counts for whom; does remote (Zoom) verification count (§11, Handover proposes: Verified officer only; remote no). | CAPAR, KPI, Store Health | Confirm | Accept the Handover's proposal | KPI and store score drift |
| ISS-P1-06 | Relation of the plan made at CAPAR "Scheduled" to the verification visit created at "Verified" (D61, D62, §7.5 do not define a link). PROP-001 proposes plan and visit as two linked records. | Visits, CAPAR, Calendar | Two records or one | Two linked records | One record loses plan-vs-actual and the no-double-count rule |
| Holiday list | §11 | CAPAR, Trainee, close | The dates | Admin enters when the config slice ships | Working-day counts wrong |
| ISS-P1-02 | Trainee: Failed-at-end rule (§11, Handover's own text proposes Failed unless a supervisor records another result with remark), extension semantics and limit, correction path, Terminate rules. | Trainee, EXECom | Confirm each | Accept the §11 text for Failed-at-end; others Leo decides | Wrong terminal status in EXECom report |
| ISS-P1-12 | Template columns MOBILE and BIRTH DATE (D6 approved the data; §11 template approval open). | Trainee import | Approve | Approve | Duplicate check weaker |
| ISS-P1-20 | Assessment components beyond the four, and which positions need each (§11); training length per brand (defaults 90/15 stand). | Trainee | Starting list | Leo supplies | Grades cannot be computed for those positions |
| ISS-P1-03 | Current TL certification formula and pass rule (D53, §11). 30/40/30 and 60/40 remain unconfirmed. | TL | The formula | Leo supplies | A guessed formula would certify wrongly |
| ISS-P1-04 | TL quit reasons list (§11). | TL | The list | Leo supplies | None blocking logic, only the dropdown |
| ISS-P1-11 | Expiry warning window; days before an unscheduled task is flagged (§11). | Proficiency | Two numbers | Leo supplies | Expiry tasks noisy or late |
| ISS-P1-05 | Cross-training pass rule (§11). | Proficiency | Formula | Handover's proposal: average of exam and tech val vs station mark | Wrong certifications |
| ISS-P1-08 | Purpose of a visit made for an expiry task: only four purposes exist (D17); not defined in the Handover. | Proficiency, Visits | Which purpose, or no visit | Confirm with Leo; no new purpose | Needs a new purpose and decision log entry |
| ISS-P1-09 | Monthly officer targets; KRA cap at 100%; coaching survey source and maximum (§11). | KPI | Values | Leo supplies | Scorecard percentages not defensible |
| ISS-P0-16 | **Resolved in part:** §5.6 (RULE-146) names Training Manager or Admin to reopen a month with a written reason. Still open: whether the Senior Training Manager may reopen, and who may close besides a Supervisor (AMB-10). | Month end | Confirm Sr reopen and who closes | Close: S M Sr; reopen: M A; Sr per Leo | Wrong person closes or reopens history |
| ISS-P1-13 | Digest time/opt-out (digest approved D23, details not). | Notifications | Time, opt-out | Leo decides | Minor |

---

## C. BLOCKING (consolidated)

**Before Phase 0 starts:** G-01, G-02, G-03, G-04.
**Before the first data-layer slice (1A):** G-05.
**Before authorization (1D):** G-06.
**Before the import slice (1F):** G-07.
**Before the named module:** every row in B4 (Visits/CAPAR: ISS-P0-18, P1-01, P1-06, P1-10, P1-15, P1-19, holiday list; Trainee: P1-02, P1-12, P1-20; TL: P1-03, P1-04; Proficiency: P1-05, P1-08, P1-11; KPI/close: P1-09, P0-16, P1-13).

## D. NON-BLOCKING (handle during implementation)

| Item | Why safe | Where handled |
| --- | --- | --- |
| Session storage (ISS-P0-03) | Technical; Claude Work decides in the Auth packet | TDMS-1C |
| Scope on every read, `row_version`, ID counters, text-column guard, cell-size limits (ISS-P0-12–15) | Fixed by §7.4, §7.10, §8 | Repository packets |
| Private Drive layout (ISS-P0-09) | D27 fixed the rule | Files packet |
| EXECom flag and delegation mechanics (ISS-P0-10, 11) | D37, D15 fixed; mechanics in WF-007 | 1D |
| Employee/Person single writer (ISS-P0-07) | D3, D25, D38 | 1F |
| Store Head/Area Manager acknowledgement (rest of ISS-P0-05) | No accounts until v2 | v2 |
| Store Health source file (ISS-P1-07) | Formula is in §5.8; the file is for parity tests | Provide before the REL-1 acceptance test (PH-9) |
| Training memo D51 | Proposed, not in v1 scope list | After PH-11 (slice 11-011) |
| Visit "Next action" (D19) | On hold | — |
| TL extension limit (ISS-P1-04 partial), plan-before-grade date rules (ISS-P1-17), orientation length configurable, location-type growth, AI cost cap | Setting defaults exist or deferred | Module packets |
| Month "Closing" transient state (PROP-003), Cancelled plan status (PROP-002) | Design choices; Cancelled is implied by D68 wording | PH-9 / PH-15 packets (Leo confirms in packet review) |
| Screen count 22 vs 23, ~60 vs 29 modals, screenshots, legacy sheets | Documentation gaps | Per-module field extraction |
| Training duration per brand | Defaults 90/15 stand; setting configurable (D63) | PH-11 |

---

**READY FOR PHASE 0: NO**

Exact blockers:
1. **G-01** Name the company Google account that owns the script, sheets and Drive (D12, §11).
2. **G-02** State the nightly backup retention count (§11 gate).
3. **G-03** Confirm the organisational time zone (gap found in this baseline).
4. **G-04** Approve or amend the repository layout / environment setup (HANDOFF-MODEL §7).

Before the first data-layer task (not before bootstrapping the repo): **G-05** approve DATA-MODEL and the history design.
Also tick §11 item 1 as resolved: D2/§3/§9 already settle Store Head and Area Manager (role in the model now, accounts in v2).

## Gate answers recorded (Leo, 2026-10-08)
| Gate | Answer | Effect |
| --- | --- | --- |
| G-04 | Option A: archive the old repo plan (`docs/PLAN.md`, `CHECKLIST.md` → `docs/archive/`); baseline docs are the plan; CLAUDE.md merged (Leo's working rules + layer rules). | TDMS-0-001 may be issued. |
| Schema rule (old CLAUDE.md #11) | DATA-MODEL is the schema authority; `lheiiyy/TddProjectai` SVMI PostgreSQL schema is reference only. | Old rule #11 dropped. |
| G-03 | Time zone **Asia/Manila**. | Slice 1-001 and the manifest time zone unblocked. |
| G-01 | **Interim:** personal Gmail `lheii.fcsitraining@gmail.com` owns the **dev and test** environments only. | 0-002, 0-003, spikes 0-005..0-009 may run. D012 (company account) is **not** reopened: **0-004 (live shell) and any live data stay blocked until the company account is named** (or Leo records an explicit D012 amendment). Spike results (mail/trigger quotas, S-06) are valid for a standard Gmail only and must be re-checked on the live account. |
| G-02 | Keep **14** nightly backups (CFG-093 = 14; also resolves ISS-P1-14 and CD-22 count; file-backup scope AO-05 stays open). | Slice 6-006 unblocked. |
| PROP-005 | **Approved:** Store Health rules take the CAPAR failure list as an input parameter (9-005); real CAPAR data wired in 10-008. | ROADMAP conflict R-06 closed. |
| PROP-006 / CD-38 | **Approved:** each result stores one bundle-version stamp (DM-A0, DM-A1..A12). | Slice 3-002 unblocked. |
| G-05 | **Pending.** Leo will read DATA-MODEL himself; not yet approved. | Slice 2-001 stays blocked. |
