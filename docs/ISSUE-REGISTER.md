# TDMS Issue Register v0.1 (Deliverable H)

Priority: **P0** = blocks the foundation or risks security/historical integrity; a decision is needed before the dependent slice starts. **P1** = blocks a specific module slice. **P2** = can be decided during that module's build.
Status: all **OPEN** unless stated. "Needs" = who/what resolves it. Class tags as in the baseline: C/P/I/TBD.

## P0 — decide before foundation work

| ID | Issue | Why it matters | Evidence | Proposed resolution (not approved) | Blocks |
| --- | --- | --- | --- | --- | --- |
| ISS-P0-01 | Repo structure, branching and dev/test/live separation are not yet defined as files. Handover D47 requires separate dev spreadsheet and Drive; nothing names the repo layout, `clasp` use or deploy flow | Every later slice depends on it | D047, §2 | Define in ARCHITECTURE.md; Leo approves | Phase 0 |
| ISS-P0-02 | **Three overlapping history mechanisms** (audit log, status history, record history) with no single design | Historical integrity (RULE-144 family); cell-size and row-growth risk | DATA-MODEL §3, PROP-004 | Adopt the three-tier design in PROP-004 | Data layer, audit |
| ISS-P0-03 | Session storage choice (CacheService vs sheet) open | Security; 6-minute limit; cache eviction logs users out | DATA-MODEL ENT-030, Roles spec §8 | Hashed token in a `sessions` sheet + cache read-through | Auth |
| ISS-P0-04 | Email sender/hosting account not named; the Roles spec uses a personal Gmail while D012 requires a company account | Reset emails, QA PDFs, ownership of the script | D012, CFG-007 | Leo supplies the company account | Auth, CAPAR |
| ISS-P0-05 | Store Head / Area Manager: Handover §9 lists their **accounts as v2** (D2) while §3 and the master instruction list them among the 7 roles, and Handover §11 asks whether they are live in v1. Their "views and acknowledges" has no record, action or workflow; the Roles spec has 5 role columns | Permission matrix is provisional for two roles | PERMISSIONS CON-07 | Define the acknowledgement entity or drop it from v1 | Permissions, Store Visit |
| ISS-P0-06 | Who may edit the role-permission matrix; whether "higher" than Senior includes Admin (D031 "Supervisor or higher") | Privilege escalation | PERMISSIONS §Open, CFG-008 | Admin edits, every change audited, last-admin lockout guard; Admin treated as outside the supervisory order | Authorization |
| ISS-P0-07 | Employee/person ownership: which module writes the person and employee, and the TEMP alias merge rule | Duplicate identities, orphaned history | DATA-MODEL §13 (ownership matrix), D001..006 | Confirm PersonService as single writer | Phase 3 |
| ISS-P0-08 | Employee ID rules: format, who assigns, behaviour for no-ID trainees | Identity keys | Handover §8 | Confirm PER-/EMP- system IDs; company employee number is a separate attribute | Person/Employee |
| ISS-P0-09 | Private Drive: folder layout, link/permission model for photos, PDFs, library | Data exposure | D012, §7.7 | Per-record folders, no public links, access via server only | Files |
| ISS-P0-10 | EXECom officer flag: where it is stored and its effect on the matrix | Access to confidential reports | D037, CFG-009 | Flag column on `users`; matrix row PERM-130 | Authorization |
| ISS-P0-11 | Delegation: scope, duration, whether a delegate may delegate, audit | Authorization bypass | D015, WF-007 | Defined in WF-007; Leo confirms | Authorization |
| ISS-P0-12 | Server-side scope enforcement on every read (not only writes) | Hiding buttons is not authorization | Instruction §10 | Repository filter by scope in service layer | All |
| ISS-P0-13 | Optimistic concurrency (`row_version`) and the LockService rules for multi-user writes | Lost updates in Sheets | §2, §8 | As the Handover; implement in the repository | Data layer |
| ISS-P0-14 | ID counter table: concurrency, width, year rollover and overflow | Duplicate IDs | DATA-MODEL §2 | Counter sheet under script lock | Data layer |
| ISS-P0-15 | Text-column guard (IDs and batch codes stored as text) and the 50,000-character cell limit for snapshots | Silent data corruption | Handover §8 | Snapshots as rows, not blobs | Data layer, Month end |
| ISS-P0-16 | Month reopen: §5.6/RULE-146 already names Manager or Admin with a written reason. Open only: Senior reopen and who may close (AMB-10 in PERMISSIONS) | Historical integrity | RULE-144, 146, WF-006 | Close S M Sr; reopen M A; Sr per Leo | Month end |
| ISS-P0-17 | Time zone for "today", working days and month close is not stated anywhere | Wrong dates around midnight | CFG-104 | Leo names the zone | Core utilities |

## P1 — decide before the owning module slice

| ID | Issue | Evidence | Blocks |
| --- | --- | --- | --- |
| ISS-P1-01 | CAPAR: §5.3 records a send date and a separate required QA endorsement date; what triggers Endorsed is undefined; QA status values undefined | WF-004 step 4, PERM-023, CFG-019 | CAPAR |
| ISS-P1-02 | Trainee: extension semantics and limit, Failed at the end, correction path, Terminate rules | WF-001, CFG-036 | Training |
| ISS-P1-03 | TL certification formula 30/40/30 unconfirmed | D053 | TL |
| ISS-P1-04 | TL extension limit and quit reasons undefined | CFG-047, CFG-018 | TL |
| ISS-P1-05 | Cross-training pass rule | CFG-054 | Proficiency |
| ISS-P1-06 | Visit plan vs verification visit: relation between the plan made at "Scheduled" and the visit created at "Verified" | WF-003, WF-004 step 7, PROP-001 | Visits, CAPAR |
| ISS-P1-07 | Store Health v2.0.0 source file (`SVMKPI_RISK.gs`) not provided, so parity cannot be verified | RISK-001 | KPI |
| ISS-P1-08 | Visit purpose for certification-expiry visits: only four purposes exist | WF-005 | Proficiency, Visits |
| ISS-P1-09 | KRA score cap at 100%, coaching survey source and maximum | CFG-083, CFG-084 | KPI |
| ISS-P1-10 | CAPAR stage target days after "Scheduled" | CFG-060 | CAPAR |
| ISS-P1-11 | Expiry warning window and unassigned-task threshold | CFG-051, CFG-052 | Proficiency |
| ISS-P1-12 | Import template columns still listed as "approve" | D006 | Import |
| ISS-P1-13 | Month-close deadline day and daily digest time/opt-out | CFG-090, CFG-091 | Month end, Notifications |
| ISS-P1-14 | Backup retention count | CFG-093 | Hardening |
| ISS-P1-15 | Photos per finding and maximum file size | CFG-062 | CAPAR |
| ISS-P1-16 | Reassignment queue: entity or a view | ENT-115 | Admin |
| ISS-P1-18 | Store Visit Report generation: Option A (AI) or B (template); Handover §9 puts any AI feature in v2 | Handover §7.1, §11 | Visits |
| ISS-P1-19 | CAPAR verification visit with two or more officers: counts only for the officer who marks Verified (proposed) or each? Does a remote (Zoom) verification count (proposed: no)? | Handover §11 | CAPAR, KPI |
| ISS-P1-20 | Training duration per brand, and the starting assessment-component list by position | CFG-030, CFG-034 | Training |
| ISS-P1-17 | Plan-before-grade rules for HO tech val dates versus holidays | D036, D063 | Training |

## P2 — decide during the module build

| ID | Issue | Note |
| --- | --- | --- |
| ISS-P2-01 | Location type set may grow? (CFG-011) | Only "Store" has behaviour |
| ISS-P2-02 | Orientation length configurable? (CFG-032) | |
| ISS-P2-03 | Memo templates mechanism (D051 pending) | |
| ISS-P2-04 | Screen count 22 vs 23 | Inventory counts 23 |
| ISS-P2-05 | Prototype's ~60 modal variants vs 29 typed modals unreconciled | Inventory coverage gap |
| ISS-P2-06 | Legacy sheets and screenshots not reviewed | Inventory coverage gap |
| ISS-P2-07 | Prototype ranges for settings (e.g. tlPassMark 1–100) are not approved | CONFIGURATION §1 |
| ISS-P2-08 | AI helper provider fallback and cost cap | D065 |

## Appendix: design proposals (NOT approved; moved here from DECISIONS.md)
| ID | Proposal | Where used | Why |
| --- | --- | --- | --- |
| PROP-001 | Visit plan and visit log as two linked entities | DATA-MODEL ENT-080/081 | Models D061 and §7.5 consistently (ISS-P1-06) |
| PROP-002 | `Cancelled` plan status | WORKFLOWS WF-003 | D068 wording ("cancelled") |
| PROP-003 | Transient "Closing" state for month close | WORKFLOWS WF-006 | Snapshot job can exceed one script run |
| PROP-004 | One audit mechanism with three views (audit log, field history, status history) | DATA-MODEL §3 | §7.5, §7.6, §7.10, D023, D048 overlap (ISS-P0-02, gate G-05) |
| PROP-005 | **APPROVED 2026-10-08.** Store Health engine before CAPAR data (phase order) | ROADMAP §3 | §10 phase 2 reads phase 3 data |
| PROP-006 | **APPROVED 2026-10-08.** Bundle version stamp: results reference one bundle version of the settings used | CONFIGURATION Part 2, DATA-MODEL §15 | Meets the rule "store the applicable rule/version with the result" with one reference (CD-38) |
