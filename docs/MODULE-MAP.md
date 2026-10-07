# Module Map v0.2 (phase labels follow ROADMAP v1.0)
MOD ids are defined in PROTOTYPE-INVENTORY §1 (MOD-001..016). Dependencies (a module needs those to its left built first):

| MOD | Depends on | Writes (ENT, DATA-MODEL §4–§11) | Phase |
| --- | --- | --- | --- |
| 001 Master data | core | brands, regions, locations, positions, stations | PH-7 |
| 003 Auth/users/delegation | 001 | users, sessions, delegations, role_permissions | PH-4, PH-5 |
| 015 Admin/audit/recycle | 003 | audit, recycle, settings | PH-2, PH-3, PH-6 |
| 002 Person/Employee | 001, 003 | person, employee | PH-8 |
| 004 Visits/Calendar | 002 | visit_plan, visit | PH-9 |
| 005 Store Health | 004 | health results | PH-9 |
| 006 CAPAR | 004, 005 | capar_case, findings, actions | PH-10 |
| 007 Trainees/EXECom | 002 | trainee, assessments | PH-11 |
| 008 Team Leaders | 002 | tl_enrollment, assessments | PH-12 |
| 009 Proficiency | 002, 004 | station_cert, expiry tasks | PH-13 |
| 010 Training sessions | 002 | sessions, attendance | PH-14 |
| 011 Library/LMS | 003 | resources | PH-14 |
| 012 KPI/KRA | 004–010 | targets, scorecards, snapshots | PH-15 |
| 013 Reports | all | none (reads) | PH-16 |
| 014 Approvals/notifications | 003 | notifications, email_log | PH-16 (hooks from PH-6) |
| 016 Boards | 004, 006, 008 | none (views) | PH-10 to PH-12 |
Single writer per entity: see DATA-MODEL §13 (ownership matrix).
