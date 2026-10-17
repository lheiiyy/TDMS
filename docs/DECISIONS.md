# TDMS Decisions (approved only)

**Authority:** the Build Handover §4 holds the full text of every decision. This file is the stable index: `Dnnn` = Handover `Dn` (D024 = D24). It does not duplicate decision text. Decisions D1–D23 approved Oct 6 2026; D24–D42 Oct 7 2026 (after the Plan Audit); D43+ added Oct 7 2026 (Handover §4).
Not approved items (draft proposals, open questions) are **not** here: see [ISSUE-REGISTER](ISSUE-REGISTER.md) and [DECISION-GATE](DECISION-GATE.md).

## Approved decisions
| ID | Topic | Notes |
| --- | --- | --- |
| D001 | System name: TDMS | |
| D002 | v1 sign-in users: TDD team; Store Head and Area Manager accounts in v2 | Role model includes them from Phase 0 (§3) |
| D003 | Employee source of truth: HR masterlist; TDD adds trainees under TEMP ID | |
| D004 | Training Assistant Supervisor uses the Supervisor role | |
| D005 | Officer assignment by brand only; region is a filter | |
| D006 | Trainee identity check: mobile, birth date when available, duplicate on name+mobile(+birth date) | Template columns still to confirm (§11) |
| D007 | Back-dated changes do not alter submitted months; months lock at close | |
| D008 | Rule changes apply to new results only | |
| D009 | One monthly visit target per officer; annual computed | |
| D010 | One shared audit/failure type list | |
| D011 | Officers see their own KPI scorecard, read only | |
| D012 | Company Google account owns database and script | Superseded by D069 (2026-10-08) |
| D013 | Reports: PDF, Google Sheets, print | |
| D014 | No AI in LMS; non-AI help instead | |
| D015 | Delegation in v1 | |
| D016 | Calendar drag-and-drop in v1, mouse and touch | |
| D017 | One purpose per visit | |
| D018 | Visits shown in Calendar | Amended by D061 |
| D020 | All functions on phone, tablet, desktop | |
| D021 | Data edit and delete: Admin only, logged, restorable | |
| D022 | Trainee migration via fixed import template | |
| D023 | Month-end close; CAPAR stage SLAs; structured corrective actions; single Person; status history; email digest; one server-side permission system; import review screen | |
| D024 | Sign-in: Employee ID (HR number, digits, no fixed length) + password; salted repeated hashing | |
| D025 | One-time HR import; afterwards TDD maintains employee fields | |
| D026 | No fixed store owner; supervisor assigns tasks | |
| D027 | Files in private Drive, opened only through TDMS after role check | |
| D028 | Every visit counts in KPIs and risk score | |
| D029 | Store risk = SVMI Store Health v2.0.0 (Handover §5.8) | Source file not yet supplied |
| D030 | CAPAR intake, duplicate block, QA email with send date | |
| D031 | TL promotion: Supervisor or higher | |
| D032 | Training sessions created in Training, shown in Calendar | |
| D033 | KRA scorecard 25/25/20/20/10 | |
| D034 | Department KPI = total actual ÷ total target | |
| D035 | Visit files: PDF, no photos | |
| D036 | Month close by the 5th; working-day SLAs; Admin holiday list | |
| D037 | Trainee monitoring and EXECom: Training Dept only; Admin-set EXECom officer flag | |
| D038 | Employee record created at trainee Passed | |
| D039 | Reporting year = calendar year | |
| D040 | "My scorecard", calendar drag rules, Boards as stage tracker/workload | |
| D041 | Migration target: new PostgreSQL schema in `lheiiyy/TDMS` | |
| D042 | Deactivation: open items go to supervisor queue | |
| D043 | Two trainee tracks: Corporate 90-day, Franchise/Agency 15-day | |
| D044 | TEMP ID per trainee; links by ID, never name | |
| D045 | Location types; only Store counts in visits/coverage/Store Health | |
| D046 | DTS batch valid | |
| D047 | Databases built from scratch in proper Drive folders | |
| D048 | Every TL enrollment change kept as history | |
| D049 | Server-generated IDs on every record (§7.10) | |
| D050 | Orientation one week; exam on Friday | |
| D052 | Trainee final grade 10/20/70 with weight redistribution | |
| D053 | Legacy TL scoring outdated; current formula from Leo | Formula still to be supplied |
| D054 | Trainee pass mark per station, defaults 89 / 90 | |
| D055 | Station plans per position; stations graded and passed individually | |
| D056 | No retake limit within training period | |
| D057 | Passed stations become first certifications | |
| D058 | Cross-training eligibility guidance date (default 6 months) | |
| D059 | Cross-training record | See Handover §4 |
| D060 | Early cross-training allowed | See Handover §4 |
| D061 | Plan a visit from any screen with a store | Supersedes calendar-only planning (D018) |
| D062 | CAPAR verification is a visit | |
| D063 | Training duration as a setting | |
| D064 | Assessment component list | Starting list still to be supplied |
| D065 | CAPAR AI checklist (Gemini, testing) | Conditional on IT approval; scope conflict with §9: ISS-P0-18 |
| D066 | CAPAR photos | Limits still to be supplied |
| D067 | TL actions performed by the officer, no approval step | |
| D068 | TL quit handled separately | |
| D069 | One Google account owns the scripts, sheets and Drive for all environments: the personal Gmail `lheii.fcsitraining@gmail.com` (interim). Ownership must stay easy to transfer to another email | Supersedes D012 (company account). Decider: Leo, 2026-10-08. Transfer path: [account-transfer runbook](runbooks/account-transfer.md); every Google ownership claim there is to verify in spike S-09 (slice 0-011). Conditions: G-08 (backup editor: named, not shared yet, open until sharing and 2-step verification are done) and G-09 (connectors, not yet disabled) before the first real data. The backup editor address is held in setting CFG-107 (a record only), never in code (ARC-13) |
| D070 | Drive layout: one mother folder `TDMS` in the Drive root of the D069 account, holding `TDMS-dev`, `TDMS-test`, `TDMS-live` (each with its own database sheet `TDMS-<env>-DB`) and `_apps-script` (reserved for the Apps Script projects, moved there by hand). `DRIVE_ROOT_ID` is an environment subfolder, never the mother. The mother folder is never shared; only an environment subfolder is shared | Extends D069. Decider: Leo, 2026-10-08. Moving the folders kept every ID. See [dev-environment runbook](runbooks/dev-environment.md) and [account-transfer](runbooks/account-transfer.md) |
| D071 | Batch approval per slice: one approved plan covers one whole ROADMAP row, then the builder works through its tasks without asking again | Decider: Leo, 2026-10-16. Working rule: [CLAUDE.md](../CLAUDE.md) (Batch approval per slice) and [HANDOFF-MODEL §3A](HANDOFF-MODEL.md). Context, decision and consequences below. Supersedes the earlier habit of one OK per step; no earlier decision is replaced |
| D072 | Gate G-05: DATA-MODEL and the history design (PROP-004) approved, with seven decisions | Decider: Leo, 2026-10-17. Context, decision and consequences below. Resolves ISS-P0-02, DATA-MODEL M1 and M4, CD-03 (ISS-P2-01); replaces the INFERRED line in ENT-114. No earlier D-decision is reopened (D031 and D067 are kept) |

## D071 · Batch approval per slice (2026-10-16, Leo)

**Context.** Each task needed a plan and an OK, and small steps inside a task needed more OKs. That slowed the work without adding control: Leo already reviews every PR.

**Decision.** One approved plan covers one whole slice, which is one ROADMAP row (`<phase>-<nnn>`, one task packet, R-05) with every part named in its task text. After the OK the builder does the tasks in order, with the planned commits and PRs, and does not ask again. Slices are never grouped unless Leo asks. A task outside the ROADMAP is its own slice.

**What does not change.** Leo reviews every PR. The builder never merges and never pushes to `main`. The stop rule applies and any BLOCKED item stops the slice. A separate OK is still required for a schema change beyond the packet, a scoring or calculation rule, a permission or scope change, security impact, a cross-module change, anything touching LIVE, any decision listed in DECISION-GATE, and any push or deploy to an Apps Script project. LIVE deploy stays manual with a dated backup. No real data before slice 2-006 and gate G-09.

**Consequences.** The plan follows the template in HANDOFF-MODEL §3A (tasks, files, tests, acceptance, expected commits and PRs, decisions, risks). Where a slice is split into PRs, the builder stops after each PR until Leo merges it (no stacked PRs). A scope change stops the slice and needs a new plan and OK. The end report is at most 10 lines. The working rule lives in CLAUDE.md; this entry is the record.

## D072 · Gate G-05: DATA-MODEL and the history design approved (2026-10-17, Leo)

**Context.** Slice 2-001 and every data-layer slice waited for gate G-05. The model had one open point in its history design (§7.10 "one row per changed field, for every table") and a list of items marked † (proposed by the model).

**Decision.** Leo approved DATA-MODEL v1.0 and PROP-004, by section:
1. **History (§3).** `audit_log`, `status_history` and `record_history` are approved. §7.10 "one row per changed field" applies to history-bearing tables only (marked F), not to every table. M1 is resolved.
2. **People and access (§4).** All † items approved. `persons.birth_date` is optional and is used only in the duplicate check.
3. **Platform and master data (§5, §6).** All † items approved; `ai_call_log` stays a placeholder until the AI decision (ISS-P0-18). Location types are complete for now but extendable: `location_type` values come from a lookup Admin can extend (CFG-011, which moves from DECISION to CONFIGURABLE; CD-03 is answered). Store is a system value that cannot be disabled; only Store counts in visits, coverage and Store Health.
4. **Training (§7).** All † items approved. A grade correction is a new `assessments` row linked by `supersedes_id` with a required `correction_reason` (a new column; `remark` is not reused); the latest row of the chain counts; grades are never edited directly.
5. **Team Leader and proficiency (§8).** All † items approved. `uniform_transactions` has no uniqueness guard: the same DR number, item and size may repeat and rows stay append-only. A soft duplicate warning (not a block) is shown when DR + item + size already exist; the detail is confirmed in the TL packet.
6. **Field operations and CAPAR (§9).** All † items approved. M4 is resolved: one corrective action per numbered finding in v1 (lettered sub-findings stay in the same block); the separate table stays so 1..n needs no migration.
7. **KPI, close, library, admin (§10, §11).** All † items approved. M7, the coaching survey source and the "Closing" state stay open in their packets. **Approvals** (replaces the INFERRED line in ENT-114): every action that needs a decision by another role is an `approval_requests` row (pending / approved / rejected) shown in an approver inbox; on approval the status transition is also written to `status_history`. The kinds are delegation, employee deactivation and CAPAR closure. It does not apply to actions D067 lets an officer do without approval, nor to TL promotion (D031), which a Supervisor or higher performs directly with no request. Self-approval is not allowed. A kind with a specific approver rule keeps it (delegation: the next-higher role, DL-02; employee deactivation: Admin, E-03); the general rule (another Supervisor or higher) covers only kinds with no specific approver, which today is CAPAR closure. **One exception, CAPAR closure only:** a Supervisor, Manager, Senior Training Manager or Admin who moved the case to Endorsed may also close it; if an Officer endorsed it, a Supervisor or higher closes it; both steps are written to `status_history`. The delegation decision lives only in `approval_requests`; the delegations table keeps cancel and the derived dates.

**What "all † approved" means.** It approves the fields, tables and IDs marked †. An entry that carries its own pending flag stays open: M2 (PROP-001), M3 (ISS-P1-02), M5, M6, M8, the memo tables (D051), and every TBD value.

**Consequences.** DATA-MODEL, DECISION-GATE, ISSUE-REGISTER (ISS-P0-02, PROP-004, ISS-P2-01), ARCHITECTURE (AO-07), ROADMAP (2-001 and 2-005 no longer blocked by G-05; 7-002 no longer blocked by CD-03) and CONFIGURATION (CFG-011, CD-03, counts) are updated. A second change, made after this one is merged, applies decision 7 to WORKFLOWS (WF-004, WF-007, WF-008), PERMISSIONS, API-CONTRACT and the ROADMAP (a new slice for the ApprovalService core before 5-004; the screens stay in PH-16). §7.10 is read as history-bearing tables because DATA-MODEL §3 itself left the point open; the Handover text is not in this repository.

## Not in force (not approved; kept out of the record)
D019 visit "Next action" (on hold) · D051 training memo (proposed) · Audit W14 Admin loses approval rights · "Other activity" log · single employee profile hub.

## Rules for this file
New decisions continue from D073. Record the date, the decider and the superseded ID. A decision is reopened only by explicit request, a documented contradiction, a technical blocker, or a later decision; the reason is recorded first.

## Older sources superseded by approved decisions (traceability)
Several purposes per visit → D017 · Plan §6 risk formula → D029 · 5 roles → Handover §3 (7 roles) · Employee ID `EMP-000000` → D024, D049 · Roles-spec "certify = approve" → D067 · Roles-spec promotion Manager/Senior → D031 · Trainee page 14-day/4 equal parts/pass 85 → D043, D052, D054, D055 · repo `TddProjectai/TDMS_Project` and SVMI schema base → D041 · calendar-only planning (D018) → D061.
