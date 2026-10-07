# TDMS Business Rules Register

Every rule has a stable `RULE-nnn`, the authority (Handover section / DEC), and the test that proves it. **Only approved rules are listed as RULE.** Open or conflicting items are in `ISSUE-REGISTER.md`; they get a RULE ID only when approved.

Tag: **A** = approved (Handover); **P** = prototype-only (NOT a requirement, listed for contrast); defaults marked *(setting)* are Admin-configurable (see `CONFIGURATION.md`).

## 1. Identity, sign-in, access

| RULE | Statement | Source | Test |
| --- | --- | --- | --- |
| RULE-001 | Each user holds exactly one role; extra access only from an approved delegation | §3, D015 | TEST-PERM-003 |
| RULE-002 | Sign-in is HR Employee ID (digits only, no fixed length) + password; salted, repeated hashing | D024, §7.8 | AUTH-001..003 |
| RULE-003 | Temporary password must be changed before any other screen opens | §7.8 | AUTH-001 |
| RULE-004 | 5 wrong passwords pause sign-in for that ID for 15 minutes *(setting)* | §7.8 | AUTH-002 |
| RULE-005 | Idle sign-out after 30 minutes *(setting)*; reset link valid 30 minutes | §7.8 | AUTH-003 |
| RULE-006 | Every protected call checks session, role, scope, ownership and edit window on the server | §7.4 | TEST-PERM-001 |
| RULE-007 | Officers edit/remove only own entries within 24 hours *(setting)*; Supervisor+ and Admin can still edit | §3, §7.4 | TEST-PERM-002 |
| RULE-008 | Delegation: delegate keeps own role plus delegator's; banner shown; ending removes access at once | D015 | TEST-PERM-003 |
| RULE-009 | Store Head / Area Manager never see trainee monitoring or EXECom | §3, D037 | TEST-PERM-004 |
| RULE-010 | EXECom officer is an Admin-set flag on TDD users; those users verify trainee imports | D037 | TRAIN-008 |
| RULE-011 | Officers are assigned by brand only (defaults/notifications), not restricted by it; no fixed store owner; supervisors assign tasks | D005, 026 | TEST-PERM-005 |

## 2. Data integrity and administration

| RULE | Statement | Source | Test |
| --- | --- | --- | --- |
| RULE-020 | Every record has a server-generated ID, never typed, reused or changed; names are display only | D049, §7.10 | PLAT-002 |
| RULE-021 | One persistent Person ID per human; TEMP ID is an alias | D044, §7.10 | TRAIN-001 |
| RULE-022 | A store or employee other records point to cannot be deleted, only deactivated | §7.9 | ADMIN-003 |
| RULE-023 | Saving a record changed by someone else shows "changed by X, reload" (`row_version`) | §7.9 | PLAT-003 |
| RULE-024 | Audit-log rows cannot be edited or deleted; Senior Training Manager can view all Admin actions | §7.9 | AUDIT-002 |
| RULE-025 | Admin can edit any field with a reason; Admin delete moves record to Recycle bin with reason; Admin can restore | D021, §7.6 | ADMIN-001 |
| RULE-026 | Deactivating an employee, store or TDD user sends their open plans, tasks, enrollments and cases to the supervisor queue | D042 | ADMIN-002 |
| RULE-027 | Rule/weight/pass-mark changes apply to new results only; results are saved when given | D008 | TRAIN-003, TRAIN-007 |
| RULE-028 | Files live in a private Drive folder; opened only through TDMS after a role check; no file shared by link | D027 | FILE-001 |
| RULE-029 | Offline drafts carry an ID (syncing twice saves once), are visible only to their author, removed once synced | §7.9 | PLAT-004 |
| RULE-030 | Reporting year is the calendar year; Q1 = Jan–Mar | D039 | KPI-004 |
| RULE-031 | Dev deployment uses its own spreadsheet and Drive folder; never writes to live data | §2, D047 | PLAT-005 |

## 3. Store visits, calendar, Store Health

| RULE | Statement | Source | Test |
| --- | --- | --- | --- |
| RULE-040 | One purpose per visit: Store Visit, TLTC, Curing/Support, CAPAR Verification | D017 | VISIT-002 |
| RULE-041 | Every visit record counts in KPIs and risk score, including two visits to one store on one day; a duplicate warning shows first | D028, §7.9 | VISIT-001 |
| RULE-042 | A visit can be planned from any screen showing a store via one shared form; every plan shows in Calendar; warns if the store already has a plan that day | D061 | CAL-002 |
| RULE-043 | Officers move only their own plans; supervisor-assigned plans move by a supervisor; "Move to date" for keyboard users | D040, §5.1 | CAL-001 |
| RULE-044 | Visit status Planned, In progress, Done shows on the calendar item | §5.1 | CAL-003 |
| RULE-045 | CAPAR Verification visit links to its case and needs ≥1 failure type from the shared list; TLTC visit links to its TL enrollment | §5.2 | VISIT-003 |
| RULE-046 | Marking a CAPAR case Verified creates (or links to an existing) one CAPAR Verification visit by the officer who marked it; never counted twice | D062 | CAPAR-003 |
| RULE-047 | Visit report is a PDF (uploaded/dragged, or generated from raw notes); no visit photos | D035 | VISIT-004 |
| RULE-048 | Only locations of type Store count in visits, coverage and Store Health | D045 | RISK-003 |
| RULE-049 | Store Health = purpose score + failure penalty + compliance, floor 0, reporting year to date; defaults in `CONFIGURATION.md` | D029, §5.8 | RISK-001, RISK-002 |
| RULE-050 | Failure penalty: +5 per CAPAR case in its audit month; each clean month lowers running penalty by 1 to 0 | §5.8 | RISK-002 |
| RULE-051 | Weights, cadences, thresholds have effective dates; a score as of a date uses settings in force then | §5.8, D008 | RISK-004 |
| RULE-052 | Tiers LOW <5, MEDIUM 5–9, HIGH ≥10; scores restart each January | §5.8 | RISK-001 |

## 4. CAPAR

| RULE | Statement | Source | Test |
| --- | --- | --- | --- |
| RULE-060 | Officer or Supervisor opens a case with store, audit type (shared list), audit failed date and QA report file (PDF/Word/image) | D030 | CAPAR-002 |
| RULE-061 | Duplicate on store + audit type + audit date is blocked | D030 | CAPAR-002 |
| RULE-062 | Finding blocks follow the report's own numbering; lettered sub-findings stay in one block with one corrective action; block = finding no., finding, root cause, corrective action, person responsible, target date, status | §5.3 | CAPAR-004 |
| RULE-063 | AI drafts blocks; nothing saved until the officer confirms; AI text flagged until edited/accepted; manual entry if AI off/fails | D065 | CAPAR-004 |
| RULE-064 | Photos uploaded per finding block appear under that finding in the CAPAR report PDF | D066 | CAPAR-005 |
| RULE-065 | Stage targets in working days using the Admin holiday list: Failed→Scheduled 7; others set by Admin; past target = overdue (dashboard, digest) | D023, 036, §5.3 | CAPAR-001 |
| RULE-066 | TDMS generates the CAPAR PDF and emails it to the Admin-set QA address, recording the send date | D030 | CAPAR-002 |
| RULE-067 | A case cannot close without a QA endorsement date; Supervisor closes | §5.3, §3 | CAPAR-001 |
| RULE-068 | A repeat failure opens a new case linked to the earlier one | §5.3 | CAPAR-006 |
| RULE-069 | Each case feeds Store Health from its audit failed date | §5.3, D029 | RISK-002 |

## 5. Trainees

| RULE | Statement | Source | Test |
| --- | --- | --- | --- |
| RULE-080 | Mobile required; birth date when available; same name + different mobile = new person; same name + mobile = "possible match" prompt | D006 | TRAIN-001 |
| RULE-081 | Track by MANAGE BY: Corporate 90-day; Franchise/Agency 15-day; milestones computed from Training Start; officers can adjust one trainee's dates (logged) | D043, §6.1 | TRAIN-002 |
| RULE-082 | HO tech val: first Thursday on/after Training Start + 42 (Corp) or + 14 (Fran/Agency); HO exam the Friday after; Corp Training End = Start + 66; Fran/Agency Training End = exam day | §6.1 | TRAIN-002 |
| RULE-083 | Training length and milestone counts are Admin settings per track with optional brand override; apply to trainees enrolled after the change | D063 | TRAIN-006 |
| RULE-084 | Final grade per station = 0.10 × HO exam avg + 0.20 × HO tech val avg + 0.70 × SOD; SOD = (in-store exam + ISTV) ÷ 2; a missing part's weight is shared pro rata | D052 | TRAIN-003, TRAIN-004 |
| RULE-085 | Components, weights, group, requirement and passing mark are Admin settings per position and station; defaults 89 staff / 90 manager | D054, 064 | TRAIN-007 |
| RULE-086 | Each station graded and passed on its own; failed station retaken alone next Friday; no limit within training period; period fixed; Passed only when every station passes; Extended shown while any station is retaken | D055, 056 | TRAIN-005 |
| RULE-087 | Marking Passed creates the employee record at once; HR endorsement date/result recorded afterwards; person ID never changes | D038 | TRAIN-009 |
| RULE-088 | Passed stations become the employee's first (home) certifications | D057 | CERT-002 |
| RULE-089 | EXECom counts are computed from each trainee's status on the report date, never typed | §6.4 | TRAIN-010 |
| RULE-090 | Batch code is text (e.g. 9C-26, DTS); Sheets-mangled values repaired and confirmed | D046, §6.3 | TRAIN-002 |
| RULE-091 | Imports: upload → validate → preview → fix/skip → confirm; nothing saves until every row valid or skipped | D022, §7.7 | TRAIN-002 |

## 6. Team Leaders

| RULE | Statement | Source | Test |
| --- | --- | --- | --- |
| RULE-100 | Enrollment is for an existing employee, linked by person ID; one open enrollment per person; deadline = entry + probation period | §5.7 | TL-001 |
| RULE-101 | All required entry grades (default 5) recorded before certification check | §5.7 | TL-001 |
| RULE-102 | Certification needs checklist, exam and ≥1 feedback score; final = 0.30·checklist + 0.40·exam + 0.30·feedback; feedback = 0.60·kitchen + 0.40·manager (weights Admin-set, saved at certification). **Current formula not yet confirmed by Leo (D053)** | §5.7 | TL-002 |
| RULE-103 | Officer or Supervisor+ certifies, extends or closes; no approval step | D067 | TL-004 |
| RULE-104 | Extend: deadline moves by extension length, numbered extension row, returns to certification check | §5.7 | TL-003 |
| RULE-105 | Quit at any open stage: date + reason (Admin list); closes as Quit not Failed; cancels open TLTC plan; re-enrollment allowed | D068 | TL-005 |
| RULE-106 | Only a Certified TL can be Promoted, by Supervisor or higher | D031 | TL-003 |
| RULE-107 | Every change is a dated history row with old/new, user, time; extensions numbered; averages computed never typed; several certifying officers stored one per row | D048 | TL-006 |
| RULE-108 | Uniform: one row per transaction (issue/return/receive) with item, size, quantity, DR no., date, user; same entry cannot be logged twice | §5.7 | TL-007 |
| RULE-109 | TL with no officer/visit/certification by its visit date goes to the supervisor queue and daily digest | §5.7 | TL-008 |

## 7. Proficiency, cross-training, expiry

| RULE | Statement | Source | Test |
| --- | --- | --- | --- |
| RULE-120 | Cross-training eligibility = months after regularization (default 6, Admin) — guidance only, never a block | D058, 060 | CERT-002 |
| RULE-121 | Early record: warning, short remark required, Early flag and remark kept in history and shown on the matrix cell | D060 | CERT-002 |
| RULE-122 | Any Training Officer can record proficiency; record needs exam and tech val grades and photo proof of both for every required component; otherwise cannot save | D059, 064 | CERT-003 |
| RULE-123 | A new record for the same station closes the previous certification; all kept in history | §5.10 | CERT-004 |
| RULE-124 | Valid-until = station validity months; expiring certifications group into one task per store in the supervisors' queue, earliest expiry first | §5.4 | CERT-001 |
| RULE-125 | Task unassigned, or not scheduled within Admin days, is flagged on dashboard and digest; dashboard counts unassigned/overdue tasks | §5.4 | CERT-001 |
| RULE-126 | Matrix: one row per employee, one column per station, filter brand/store; cell = home, cross-trained, expiring, expired, none | §5.10 | CERT-005 |

## 8. KPI/KRA, month close, reports

| RULE | Statement | Source | Test |
| --- | --- | --- | --- |
| RULE-140 | Monthly KRA per member: visits 25%, sessions 25%, proficiency 20%, coaching 20%, attendance 10%; total = Σ score × weight; bands 90/80/70 (Admin) | D033 | KPI-002 |
| RULE-141 | Department KPI per KRA = Σ actual ÷ Σ target × 100% | D034 | KPI-002 |
| RULE-142 | Supervisors/Managers set each officer's monthly targets (visits, sessions, certifications) | §5.9 | KPI-003 |
| RULE-143 | Officers see own scorecard read-only under "My scorecard" | D011, 040 | KPI-005 |
| RULE-144 | Month closes by the 5th of next month after the 24-hour edit window; snapshot of EXECom, KPI scorecards, coverage, Store Health, CAPAR status; closed snapshot never changes | D036, §5.6 | CLOSE-001 |
| RULE-145 | A change dated in a closed month is recorded with a note and shows in the next open month | D007, §5.6 | CLOSE-001 |
| RULE-146 | Training Manager or Admin can reopen a month with a written reason, logged | §5.6 | CLOSE-002 |
| RULE-147 | Working days exclude Admin-listed holidays | D036 | CAPAR-001 |
| RULE-148 | Daily Activities lists each team member's logged work for a date in the Messenger format; covers only logged work | §7.1, §4 | REPORT-001 |
| RULE-149 | One email digest every morning per user: overdue, due this week, awaiting approval; supervisors also unassigned expiry tasks and overdue CAPAR stages | §7.2 | REPORT-002 |
| RULE-150 | Report outputs: PDF, Google Sheets, print | D013 | REPORT-003 |

## 9. Prototype behaviours that are NOT rules

Plain-text passwords; `TODAY` constant; stored failure counter; 14-day trainee period; four-equal-part grade; TL certification needing approval; promotion by Manager/Senior only; backward CAPAR moves; Library metadata-only upload; demo role switcher; Passed trainees imported as "Crew"; all lists rendering all rows. See `GAP-MATRIX.md`.
