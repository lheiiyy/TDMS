> Superseded by docs/ROADMAP.md (2026-10-08)

# TDMS Build Checklist

**Status:** planning phase.

Every phase, module and feature in the TDMS plan. The live, team-shared version is the [online checklist](https://claude.ai/artifact/1MBxV4t8Np1C6E5YMnejoV); tick items there and keep this file in step when a phase closes.

Master plan: https://claude.ai/code/artifact/f89076cb-9986-4a8a-abe2-f0eb70d83dab · Copy: [docs/PLAN.md](PLAN.md) · UI design: [SVMI Command Center v2 in Claude Design](https://claude.ai/design/p/2ed405f3-0ef3-42e2-9b79-93e0f03653d0?file=SVMI+Command+Center+v2.dc.html&via=share) · Design brief source: [UI/UX modernization plan](https://claude.ai/share/99d7f117-2fcf-47eb-ae80-6266dc28fe82)

85 items across 9 stages. Module codes:

| Code | Module |
| --- | --- |
| PLAN | Planning and decisions |
| M0 | Core master data |
| SYS | System, roles and security |
| M1 | Trainee orientation |
| M2 | Training programs and sessions |
| M3 | Team Leader program |
| M4 | Proficiency and cross-training |
| M5 | Store visits |
| M6 | CAPAR |
| M7 | Dashboards and reports |
| M8 | Resource library |
| M9 | KPI monitoring |
| MIG | Full-stack migration |

## Phase 0: Foundation (Weeks 1-3)

- [ ] `PLAN` Approve the master plan and the build order
- [ ] `PLAN` Decide if Training Assistant Supervisor gets its own role
- [ ] `PLAN` Decide how officers are assigned: by brand, by region, or both
- [ ] `PLAN` Decide if store managers submit data directly in v1
- [ ] `PLAN` Decide the source of truth for the employee list (HR masterlist or TDD records)
- [ ] `PLAN` Confirm the system name for management
- [ ] `PLAN` Finish the UI design in Claude Design (SVMI Command Center v2) and agree the screen style for all modules
- [ ] `PLAN` Agree the navigation map: Dashboard, Store Visits, Training, Proficiency and Certifications, Library, Reports, Admin
- [ ] `SYS` Create the database spreadsheet (data only) and the Apps Script project
- [ ] `SYS` Connect the Apps Script project to the TDMS repo with clasp (test copy)
- [ ] `SYS` Build the layers: repository, services, api.js, screen shell
- [ ] `SYS` ID generator, audit columns and audit_log on every write
- [ ] `SYS` Users and roles: Officer, Supervisor, Manager, Senior Manager, System Admin
- [ ] `SYS` Server-side role check and the restricted area guard
- [ ] `M0` Tables: brands, regions, stores, positions, stations, employees, tdd_team, lookups
- [ ] `M0` Check table names against the SVMI schema in TddProjectai database/migrations
- [ ] `M0` Clean and import about 250 stores with real store codes, brand and region
- [ ] `M0` Import employees from TOIS PMS and the HR list; review temporary IDs
- [ ] `M0` Load the TDD team roster with roles and assignments
- [ ] `M0` Settings screen for lookups (statuses, audit types, training types)

**Gate:** Masterlist signed off

## Phase 1: Store visits (from SVMI) (Weeks 4-6)

- [ ] `M5` Write and approve the M5 store visit spec
- [ ] `M5` Mobile visit entry as a guided form: store, details, observations with photos, corrective actions, review; drafts saved
- [ ] `M5` Several purposes and several officers per visit (child tables)
- [ ] `M5` Store risk score using the approved SVMI model and LOW, MEDIUM, HIGH tiers
- [ ] `M5` Store insights and visits-this-month views (SVMI portal layout kept)
- [ ] `M5` Store directory with risk tier, last visit and next due badges, filtered by brand, region and status
- [ ] `M5` Import the SVMI MASTER_LOG into store_visits
- [ ] `M5` User guide for store visits

**Gate:** SVMI sheet set to read-only

## Phase 2: CAPAR (Weeks 7-8)

- [ ] `M6` Write and approve the M6 CAPAR spec
- [ ] `M6` Open a case from a failed store audit, product audit, MS dine-in or MS delivery
- [ ] `M6` Schedule the verification visit and assign officers
- [ ] `M6` Link the verification to a store visit and upload the CAPAR report
- [ ] `M6` Record QA status and endorsement date
- [ ] `M6` Supervisor closes the case; a follow-up audit opens a linked case
- [ ] `M6` Open and overdue CAPAR list
- [ ] `M6` Import the monthly CAPAR RESULTS tabs (with real years on dates)

**Gate:** CAPAR monitoring sheet frozen

## Phase 3: Team Leader program (Weeks 9-11)

- [ ] `M3` Write and approve the M3 Team Leader spec
- [ ] `M3` Enrollment: batch, mother store, mother station, certification deadline
- [ ] `M3` Assessments: ISTV, technical validation, entry exams, certification grade and exam
- [ ] `M3` Results: Certified, Extended, Failed, Quit; later Promoted
- [ ] `M3` Supervisor approval of certifications
- [ ] `M3` Uniform issue, return and delivery log with stock on hand
- [ ] `M3` TL pipeline by stage and deadlines due
- [ ] `M3` Import MASTER_LOG and remove duplicates from the status tabs

**Gate:** TL monitoring sheet frozen

## Phase 4: Orientation and training sessions (Weeks 12-14)

- [ ] `M2` Write and approve the M1 and M2 spec
- [ ] `M2` Training program catalog by brand and training type
- [ ] `M2` Sessions with Planned, Conducted, Postponed, Cancelled (reuse KPI Hub rules)
- [ ] `M2` Facilitators per session from the TDD team list
- [ ] `M2` Attendance and post-test scores
- [ ] `M1` Orientation batches, attendees and deployment store
- [ ] `M2` Import SESSION_LOG

**Gate:** Training delivery sheet frozen

## Phase 5: Proficiency and cross-training (Weeks 15-17)

- [ ] `M4` Write and approve the M4 proficiency spec
- [ ] `M4` Station certifications with valid-until date and status
- [ ] `M4` Cross-training validations, one row per station
- [ ] `M4` List of certifications expiring soon
- [ ] `M4` Certified staff per store and station
- [ ] `M4` Import PMS certifications and the cross-trained staff sheet

**Gate:** PMS frozen

## Phase 6: Resource library (Weeks 18-19)

- [ ] `M8` Write and approve the M8 resource library spec
- [ ] `M8` Categories, file types and access rules set in Settings
- [ ] `M8` Upload a file or add a link, saved to the department Drive folder, with versions
- [ ] `M8` Training SOPs and manuals, latest version first
- [ ] `M8` Memorandums with memo number and effective date
- [ ] `M8` FAQs as short questions and answers
- [ ] `M8` Restricted files (exams, answer keys, internal memos) for Supervisors and Admin only
- [ ] `M8` Attach files to a training program, TL assessment or CAPAR case
- [ ] `M8` Move existing training kits, forms and guides from Drive

**Gate:** Team folders linked

## Phase 7: KPI monitoring and dashboards (Weeks 20-23)

- [ ] `M9` Write and approve the M9 and M7 spec
- [ ] `M9` KPI definitions, weights and targets per period (five KRAs from KPI Hub)
- [ ] `M9` Auto-computed values: store visits, certifications, sessions
- [ ] `M9` Supervisor-scored values with remarks: coaching and feedback, attendance
- [ ] `M9` Officer and team scorecards by month and quarter
- [ ] `M9` Decide if officers can view their own scorecard
- [ ] `SYS` Approvals queue in the restricted area
- [ ] `M7` Supervisor and manager dashboards from summary tables
- [ ] `M7` Monthly reports for management
- [ ] `M7` Home dashboard: summary cards with trend, activity feed, quick actions
- [ ] `M7` Report templates: store readiness, compliance trend, facilitator performance, brand summary
- [ ] `M7` Export reports to CSV and PDF

**Gate:** Management review

## Migration: Full-stack web app (When budget is approved)

- [ ] `MIG` Budget and hosting approved; stack confirmed with IT
- [ ] `MIG` PostgreSQL schema that extends the SVMI migrations
- [ ] `MIG` Export every table to CSV, import and validate row counts
- [ ] `MIG` Rewrite the repository layer for SQL
- [ ] `MIG` REST API with the same function names; switch api.js to fetch()
- [ ] `MIG` Company sign-in with the same roles
- [ ] `MIG` Run both systems side by side for 2 to 4 weeks, then archive Sheets

**Gate:** Sheets database archived
