# TDMS Requirements (approved)

Only requirements supported by the Build Handover (decisions `Dnnn`, sections `§`) or the Master Instruction. Rule-level detail: [BUSINESS-RULES](BUSINESS-RULES.md). Items still undecided are **not** here: see [DECISION-GATE](DECISION-GATE.md). Decision text: [DECISIONS](DECISIONS.md) → Handover §4.

## Scope (Handover §9)
v1 · on hold (visit "Next action", D019) · v2 (Store Head/Area Manager accounts, any AI feature, full-stack migration) · not planned (visit photos, "Other activity" log, single profile hub) · out of scope (payroll/HRIS, online exams, QA audit scoring, HR integration, full offline mode).

## Platform and architecture
| ID | Requirement | Source |
| --- | --- | --- |
| REQ-001 | UI → `api.js` → modular services → business rules → repository → storage; only the repository touches storage | §2, Instruction §11 |
| REQ-002 | Google Sheets database and private Google Drive, owned by a company account | D012, §2 |
| REQ-003 | Separate dev/test spreadsheet and Drive; dev never writes live data | D047, §2 |
| REQ-004 | Databases built from scratch, one tab per table, designed for fast loading | D047 |
| REQ-005 | 50-row paging; dashboards read pre-computed summaries with an "updated at" time; heavy rebuilds run queued after a save | §2, §8 |
| REQ-006 | Files only in private Drive, opened after a role check, never shared by link | D027 |
| REQ-007 | Nightly backup | §9 |
| REQ-008 | Migration-ready: future PostgreSQL schema in `lheiiyy/TDMS` | D041 |
| REQ-009 | Every function works on phone, tablet and desktop | D020 |
| REQ-010 | Offline limited to device drafts synced on reconnect | §2, §9 |

## Identity, access, security
| ID | Requirement | Source |
| --- | --- | --- |
| REQ-020 | Sign in with Employee ID (HR number) and password; salted, repeated hashing | D024 |
| REQ-021 | Seven roles in the role model; one role per user; extra access only by approved delegation | §3, D002, D015 |
| REQ-022 | Store Head and Area Manager accounts go live in v2 | D002, §9 |
| REQ-023 | Training Assistant Supervisor uses the Supervisor role | D004 |
| REQ-024 | Officers assigned by brand only; no fixed store owner; supervisors assign tasks | D005, D026 |
| REQ-025 | One server-side permission system | D023 |
| REQ-026 | Delegation in v1 | D015 |
| REQ-027 | Admin-set EXECom officer flag on TDD users | D037 |
| REQ-028 | Officers edit own entries within the edit window | §3 |
| REQ-029 | Admin keeps the approval rights in the Roles spec | §4 note |
| REQ-030 | Audit log of sensitive actions | §7.6 |

## Data integrity
| ID | Requirement | Source |
| --- | --- | --- |
| REQ-040 | Server-generated IDs on every record; names are display only | D049, §7.10 |
| REQ-041 | Months lock at close (by the 5th, after the 24-hour edit window); back-dated changes do not alter submitted months | D007, D036 |
| REQ-042 | Rule changes (weights, pass marks) apply to new results only | D008 |
| REQ-043 | Status history; TL enrollment history | D023, D048 |
| REQ-044 | Admin-only edit and delete; logged and restorable (Recycle bin) | D021 |
| REQ-045 | Deactivating an employee, store or TDD user sends their open items to the supervisor queue | D042 |
| REQ-046 | Working-day counts use an Admin-kept holiday list | D036 |
| REQ-047 | Calendar-year reporting | D039 |

## Master data, Person, Employee
| ID | Requirement | Source |
| --- | --- | --- |
| REQ-050 | Brands, regions, locations (typed), positions, stations; only Store-type locations count in visits, coverage, Store Health | D045 |
| REQ-051 | Single Person record; TEMP ID from entry; records link by ID | D023, D044 |
| REQ-052 | HR masterlist is the base; one-time import, then TDD maintains employee fields | D003, D025 |
| REQ-053 | Trainee identity check on mobile, birth date, duplicate name+mobile | D006 |
| REQ-054 | Employee record created at Passed; person ID never changes | D038, D057 |
| REQ-055 | Import review screen | D023 |

## Store visits, Calendar, Store Health
| ID | Requirement | Source |
| --- | --- | --- |
| REQ-060 | One purpose per visit | D017 |
| REQ-061 | Every visit counts in KPIs and Store Health | D028 |
| REQ-062 | Plan a visit from any screen with a store; Calendar drag on mouse and touch; officers move only their own plans | D016, D040, D061 |
| REQ-063 | Visit file = PDF attached (uploaded or generated); no photos | D035 |
| REQ-064 | Store Health = SVMI Store Health v2.0.0 as in §5.8 | D029 |
| REQ-065 | Boards = stage tracker and team workload | D040 |
| REQ-066 | Offline drafts of visits | §2 |
| REQ-067 | Daily Activities and Store Visit Report generation | §9 |

## CAPAR
| ID | Requirement | Source |
| --- | --- | --- |
| REQ-070 | Officer or supervisor opens a case; QA report file required; duplicate (store + audit type + audit date) blocked | D030 |
| REQ-071 | TDMS emails the CAPAR PDF to the configured QA address and records the send date | D030 |
| REQ-072 | Stage targets in working days; structured corrective actions | D023, D036 |
| REQ-073 | CAPAR verification is a visit | D062 |
| REQ-074 | Failures for Store Health come from CAPAR cases by audit failed date | D029 |
| REQ-075 | One shared audit/failure type list | D010 |
| REQ-076 | CAPAR photos supported | D066 |
| REQ-077 | AI checklist: testing only, conditional on IT approval | D065 |

## Trainees and EXECom
| ID | Requirement | Source |
| --- | --- | --- |
| REQ-080 | Two tracks: Corporate 90-day, Franchise/Agency 15-day; length is a setting | D043, D063 |
| REQ-081 | Orientation one week; exams on Friday; DTS batch valid | D046, D050 |
| REQ-082 | Station grade = 10% HO exam + 20% HO tech val + 70% SOD; missing weight shared | D052 |
| REQ-083 | Pass mark per station (defaults 89 staff, 90 manager) | D054 |
| REQ-084 | Station plans per position; stations passed individually; unlimited retakes in period | D055, D056 |
| REQ-085 | Assessment components are a configurable list | D064 |
| REQ-086 | Import via fixed template | D022 |
| REQ-087 | Trainee monitoring and EXECom visible to Training Dept only | D037 |

## Team Leaders and Proficiency
| ID | Requirement | Source |
| --- | --- | --- |
| REQ-090 | Every TL enrollment change kept as history | D048 |
| REQ-091 | Officer certifies, extends or closes TL enrollments; no approval step | D067 |
| REQ-092 | TL quit handled separately from failure | D068 |
| REQ-093 | TL promotion by Supervisor or higher | D031 |
| REQ-094 | Passed trainee stations become first certifications | D057 |
| REQ-095 | Cross-training eligibility guidance, record, early allowed | D058–D060 |
| REQ-096 | Station certifications with expiry tasks through the supervisor queue | §9, §10 |

## Training, Library, KPI, reporting
| ID | Requirement | Source |
| --- | --- | --- |
| REQ-100 | Training sessions created in Training, shown in Calendar | D032 |
| REQ-101 | Library and non-AI LMS help | D014, §9 |
| REQ-102 | One monthly visit target per officer | D009 |
| REQ-103 | Monthly KRA scorecard 25/25/20/20/10 | D033 |
| REQ-104 | Department KPI = total actual ÷ total target × 100% per KRA | D034 |
| REQ-105 | Officers see their own scorecard, read only | D011, D040 |
| REQ-106 | Month-end close | D023, D036 |
| REQ-107 | Reports in PDF, Google Sheets and print | D013 |
| REQ-108 | Email digest | D023 |

## Not yet requirements
TL formula, CAPAR stage-target days, expiry windows, targets, QA status, AI scope in v1, Visit Report option, others: [DECISION-GATE](DECISION-GATE.md).
