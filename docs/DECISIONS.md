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
| D069 | One Google account owns the scripts, sheets and Drive for all environments: the personal Gmail `lheii.fcsitraining@gmail.com` (interim). Ownership must stay easy to transfer to another email | Supersedes D012 (company account). Decider: Leo, 2026-10-08. Transfer path: [account-transfer runbook](runbooks/account-transfer.md); every Google ownership claim there is to verify in spike S-09 (slice 0-011). Conditions: G-08 (backup editor) and G-09 (connectors) before the first real data |

## Not in force (not approved; kept out of the record)
D019 visit "Next action" (on hold) · D051 training memo (proposed) · Audit W14 Admin loses approval rights · "Other activity" log · single employee profile hub.

## Rules for this file
New decisions continue from D070. Record the date, the decider and the superseded ID. A decision is reopened only by explicit request, a documented contradiction, a technical blocker, or a later decision; the reason is recorded first.

## Older sources superseded by approved decisions (traceability)
Several purposes per visit → D017 · Plan §6 risk formula → D029 · 5 roles → Handover §3 (7 roles) · Employee ID `EMP-000000` → D024, D049 · Roles-spec "certify = approve" → D067 · Roles-spec promotion Manager/Senior → D031 · Trainee page 14-day/4 equal parts/pass 85 → D043, D052, D054, D055 · repo `TddProjectai/TDMS_Project` and SVMI schema base → D041 · calendar-only planning (D018) → D061.
