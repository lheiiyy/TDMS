> Superseded by docs/ROADMAP.md (2026-10-08)

# Training and Development Management System (TDMS)

Project Description and Development Plan · Figaro Culinary Group · Training and Development Division, HRAD

Oct 3, 2026 · @Leorey

## 1. Project description

The Training and Development Management System (TDMS) will be one web application that holds every Training Department record in one place: stores, employees, trainees, training programs, Team Leader monitoring, store visits and CAPAR. It will run on Google Sheets and Apps Script at no added cost, and it will be built so the same screens and data can move to a full-stack web app once budget is approved.

TDMS will also be the team's single home for every tool and file it uses: training modules and handouts, exams and answer keys, ISTV and validation forms, checklists, templates, and links to the team's other apps. Users can upload, download and open these files from the same app, and the categories, file types and who can see what are set in Settings, not in code.

### Background

The Training Department sits under the Training and Development Division of HRAD and supports five brands of Figaro Culinary Group: Angel's Pizza, Angel's Pizza Express (APEX), Tien Ma's, Koobideh Kebab and Figaro Coffee. Its work covers trainee orientation, training programs, the Team Leader program and monitoring, store visits, and CAPAR (Corrective and Preventive Action) for stores that fail a QA store or product audit or a mystery shopper visit (dine-in or delivery).

Today this work is tracked in more than ten separate sheets and two pilot web apps. Each file keeps its own copy of store names, staff names and trainer names, so the same store or person is written several ways and reports cannot be combined without manual cleanup.

### Problem

- No single employee or store record: the same person appears in TL Monitoring, PMS, cross-training and CAPAR sheets with no shared ID.
- Monthly tabs and copied tabs (e.g. CAPAR RESULTS per month, Copy of MASTER\_LOG) split one dataset into many.
- Dates, grades and names are typed freely, so summaries need manual fixing before every report.
- The PMS web app slows down and times out as data grows, because screens read whole sheets.

### Objectives

1. One master record for every brand, store, employee and TDD team member, referenced by ID in every module.
2. One input screen per activity, with dropdowns and validation, so data is clean at entry.
3. Live dashboards for supervisors and managers without manual consolidation.
4. A data structure and code layout that can be moved to a SQL database and modern web framework without redesign.

### Scope (version 1)

| In scope | Out of scope for v1 |
| --- | --- |
| Master data: brands, stores, positions, stations, employees, TDD team | Payroll, HRIS and recruitment records |
| Trainee orientation and training sessions with attendance and scores | Online exams taken inside the system |
| Team Leader program: entry, probation, validation, certification, uniforms | Store audit scoring (owned by QA) |
| Staff station proficiency and cross-training | Mobile offline mode |
| Store visits and CAPAR tracking | Integration with company HR systems |
| Dashboards, reports, audit log, user roles |  |
| Resource library: training files, exams, ISTV forms, templates and tool links, with upload, download and configurable categories and access | Editing files inside TDMS (files are edited in their own app, then re-uploaded as a new version) |
| KPI monitoring (M9) and a restricted area for supervisors and admin | Formal performance appraisal and pay decisions (owned by HR) |

### Users

The system is used by the Training Department team: Training Officers, Training Supervisors, the Training Manager and the Senior Training Manager. Section 3 sets what each role can see and do.

## 2. Current tools and lessons learned

The existing sheets hold real, usable data (about 250 stores and 2,190 employee records in TOIS PMS alone), but none of them share keys, so TDMS starts from a clean schema and imports this data once, after cleanup.

| Current file / module | What it tracks | Main issue found | Carry into TDMS |
| --- | --- | --- | --- |
| [TOIS PMS DATABASE](https://docs.google.com/spreadsheets/d/1kfsvMAGBYik0nPUkdYJ1Pp_XTOo4FhTZnQ5awjsLTg4/edit) | Brands, stores, positions, stations, employees, station certifications, store submissions, audit log | Store Code equals Store Name; Store ID and Brand ID columns empty; CONFIG\_STATIONS uses brand names instead of codes; certification dates in two date formats and duplicate columns; slow loading as rows grow | CONFIG\_STORES and EMPLOYEE\_MASTER as seed data; the AUDIT\_LOG design |
| [Team Leader Monitoring](https://docs.google.com/spreadsheets/d/137AyWSnYOvtizgjNHGVuZqvFBpHCjxcvzrp37ujBNvU/edit) | TL entry, probation, validations, certification, promotion, quit, uniforms | Same people copied into PROBATIONARY, CERTIFIED, FAILED/QUIT and CEBU TL tabs; key is name + store + date; uniforms stored as text such as "2 SMALL \| 1 XLARGE (DR#...)" | The TL lifecycle stages and grade fields; UNIFORM\_LOG as a proper issue log |
| Store Visit 2026 / SVMI (live web app) | Store visits, risk score, dashboards | Visitors stored as pipe-separated names; brand names with different apostrophes | The approved risk scoring model and the four-tab portal layout |
| [CAPAR Rectification Monitoring](https://docs.google.com/spreadsheets/d/1otNBddAYE4d6hF-ahdMwS8jxoSoOQwNRjmcJgIbwbDw/edit) | Failed audits, schedule, verification visit, QA status, report link | One tab per month; dates typed as "SEPT 3" or "Aug 22" with no year; audit type spelled several ways; QA endorsement date mostly blank | The CAPAR stages: failed, scheduled, verified, endorsed, closed |
| [Training Program and Delivery Monitoring 2026](https://docs.google.com/spreadsheets/d/1mp4-6KHcX5iDB5Oto1Smjfyq-xW4KAZCC8CA09hhpB4/edit) | Training sessions, pax, post-test average | Facilitators typed as comma-separated names | Session ID format and the training type list |
| [Cross Trained Staffs Monitoring](https://docs.google.com/spreadsheets/d/1UxWuZG1kqazqotlMeCyuRNCNYLFNYoQXg8rzEJ_CAQw/edit) | Cross-station validations with grades | Several stations and grades in one cell ("SVC-92/CAS-90"); store names vary ("AP DAU" vs "DAU") | Becomes one row per station validation in the proficiency module |

### Lessons to apply

1. Use IDs, never names, to link records. Names are display values only.
2. One table per record type. Status is a column, not a separate tab; month is a filter, not a tab.
3. One value per cell. A list of stations, visitors or grades becomes rows in a child table.
4. Dates stored one way (yyyy-mm-dd), entered through a date picker.
5. Reports are built by code from raw tables, never by editing summary tabs by hand.
6. Build working screens first and document as you go. The PMS experience showed that heavy documentation without running software stalls progress.

## 3. Roles and access

Access follows the department hierarchy: Officers enter and update their own work, Supervisors review and approve, Managers see everything and set targets. A separate System Admin role manages users and settings and is not tied to job title.

| Role | Main use | Create / edit | Approve / close | View scope |
| --- | --- | --- | --- | --- |
| Training Officer | Logs visits, sessions, TL validations, CAPAR verifications | Own entries; employee updates for assigned stores | None | Assigned brands or region, plus own records |
| Training Supervisor | Schedules work, reviews entries | All entries in assigned area | TL certification, CAPAR closure, returned submissions | Assigned brands or region |
| Training Manager | Monitors performance, sets targets | Master data, programs, targets | Final approval on promotions and exceptions | All brands |
| Senior Training Manager | Executive dashboards and reports | Read only by default | Sign-off on reports if required | All brands |
| System Admin | Users, roles, lookups, imports, backups | Settings and lookup tables | Data corrections with audit trail | All, including audit log |

Every create, edit, approval and deletion is written to the audit log with the user, time, old value and new value. Records are deactivated, never hard-deleted.

### Restricted area (Supervisors and Admin)

TDMS has one section that only Training Supervisors, the Training Manager, the Senior Training Manager and the System Admin can open. Officers do not see it in the menu, and the server checks the user's role on every call, so hiding a button is never the only protection.

- **KPI monitoring (M9):** set targets, enter and edit officer scores, review scorecards.
- **Approvals queue:** TL certifications, CAPAR closures and returned entries waiting for review.
- **Restricted files:** exams, answer keys and internal memorandums marked restricted in M8.
- **Admin only:** users and roles, Settings, lookup tables, data imports and the full audit log.

## 4. Modules and workflows

TDMS has one shared core and nine working modules. Every module reads stores, employees and TDD team members from the core, so a store renamed once is renamed everywhere.

| # | Module | Replaces | Key records | Main output |
| --- | --- | --- | --- | --- |
| M0 | Core master data | CONFIG tabs in PMS, SETTINGS tabs | Brands, regions, stores, positions, stations, employees, TDD team | One clean directory |
| M1 | Trainee orientation | Manual lists | Orientation batches, attendees, deployment store | Orientation completion per batch |
| M2 | Training programs and sessions | Training Program and Delivery Monitoring | Program catalog, sessions, facilitators, attendance, post-test scores | Sessions conducted, pax, average scores |
| M3 | Team Leader program and monitoring | TL Monitoring sheet | TL enrollment, validations, exams, certification, extension, promotion, uniform issues | TL pipeline by stage, deadlines due |
| M4 | Staff proficiency and cross-training | PMS, Cross Trained Staffs sheet | Station certifications, validity dates, cross-station validations | Certified staff per store and station |
| M5 | Store visits | SVMI | Visits, purposes, visitors, findings, store risk score | Visit coverage and store health |
| M6 | CAPAR | CAPAR Rectification Monitoring | Failed audit, schedule, verification visit, QA endorsement, report file | Open and overdue CAPARs |
| M7 | Dashboards and reports | Summary tabs, manual reports | Read-only views over M0 to M6 | Weekly and monthly reports, officer KPIs |
| M8 | Resource library | Scattered Drive folders, shared links, files sent by chat | Files, categories, versions, access rules, external tool links | One place to find, upload and download team files |
| M9 | KPI monitoring | KPI Monitoring Hub (sample project on GitHub), manual KRA scorecards | KPI definitions, targets per period, officer and team scores | Officer and team KRA scorecards |

### Team Leader lifecycle (M3)

1. Entry: employee enrolled into a batch with mother store and mother station; certification deadline set.
2. Probationary: ISTV and technical validation grades and TL entry exams recorded.
3. Certification check: certification grade and exam grade recorded by the certifying officer.
4. Result: Certified, Extended (new deadline), Failed or Quit. Extended returns to step 3.
5. Certified TLs may later be marked Promoted. Uniform issues and returns are logged against the enrollment at any stage.

### CAPAR flow (M6)

1. QA reports a failed store audit, product audit or mystery shopper result (dine-in or delivery). A CAPAR case is opened with the audit date and type.
2. Supervisor schedules a verification visit and assigns one or more officers.
3. Officer conducts the visit (on-site or Zoom), uploads the CAPAR report and records corrective actions.
4. Report is emailed and endorsed to QA; QA status and endorsement date are recorded.
5. Case is closed. A follow-up audit failure opens a new case linked to the first.

### Store visit flow (M5)

A visit is logged once and can be tagged with several purposes (routine, CAPAR verification, TL validation, training). When a visit serves a CAPAR or TL record, it links to that record instead of being entered twice.

### Resource library (M8)

M8 holds every file and tool the team uses: training modules, handouts, exams and answer keys, ISTV and validation forms, CAPAR and visit templates, and links to other apps (Canva decks, Google Forms, existing sheets).

M8 is also the team's reference shelf. Training SOPs and manuals, FAQs and memorandums are kept here and can be searched by brand and topic. Memorandums carry a memo number and effective date; for SOPs and manuals the latest version is shown first, with older versions still available. FAQs are short question-and-answer entries the team can read without opening a file. Anything marked restricted (for example internal memos or answer keys) appears only in the restricted area in Section 3.

- **Add:** an officer or supervisor uploads a file (or pastes a link), picks a category, brand and version, and the file is saved to the department's Google Drive folder; TDMS keeps the record.
- **Find and download:** search or filter by category, brand, program or file type, then open or download. Older versions stay available.
- **Configurable:** the System Admin manages categories, allowed file types, brand tags and which roles can view, download or upload in each category from Settings, with no code changes. Exams and answer keys can be limited to supervisors and above.
- **Linked records:** a file can be attached to a training program (M2), TL assessment (M3) or CAPAR case (M6), so the right form shows up where it is used.
- Every upload, new version and removal goes to the audit log; files are archived, not deleted.

### KPI monitoring (M9)

M9 tracks the key result areas (KRAs) and KPIs of each officer and of the team. It lives in the restricted area: Supervisors and above can view and edit it. Whether officers can see their own scorecard (read-only) is still to be confirmed. The existing KPI Monitoring Hub project is the sample model; its KRA list and scoring rules will be reviewed and carried into M9 when it is built.

- **Set up:** a Supervisor or Manager defines each KPI (name, KRA, unit, weight, target) per role and period.
- **Auto-filled values:** where a KPI comes from TDMS records, such as visits done, sessions conducted, CAPARs closed on time or TLs certified, the value is computed from M2 to M6 so nobody retypes it.
- **Manual scores:** other KPIs are scored by the Supervisor with remarks; every edit goes to the audit log.
- **Scorecard:** weighted score per officer per month and quarter, shown on the M7 dashboards.

The KPI Monitoring Hub ([GitHub](https://github.com/lheiiyy/KPI-MONITORING-HUB)) already defines the five KRAs HRAD uses to score facilitators. M9 starts from these weights and formulas; four of the five can be computed from TDMS records.

| KRA | Weight | Formula | TDMS source |
| --- | --- | --- | --- |
| Store visit compliance | 25% | Actual store visits / target store visits x 100% | M5 store visits (auto) |
| Staff proficiency / cross-training | 25% | Staff certified / staff scheduled for certification x 100% | M4 station certifications (auto) |
| Training program delivery | 20% | Programs delivered / programs required x 100% | M2 training sessions (auto) |
| Coaching and feedback | 20% | Average survey score / maximum possible score x 100% | Store visit evaluation survey (import) |
| Attendance, punctuality, behavior | 10% | (Days present - lates - absences) / total working days x 100% | Facilitator attendance (manual or import) |

The Hub's facilitator attendance and session Kanban pages already write to Google Sheets through Apps Script with the same layered design as Section 5, so their rules and tests can be reused in M2 and M9.

## 5. Architecture: Google Sheets now, migration-ready by design

The system is split into four layers so that only the bottom layer changes during migration: the screens, the API calls and the business rules stay the same, and the Sheets data layer is swapped for a SQL database.

| Layer | Now (no budget) | After migration | What must stay the same |
| --- | --- | --- | --- |
| Screens (UI) | Apps Script web app (HtmlService), one page app | React, Vue or Svelte on a web host | Screen design, components, field names |
| API client | `api.js` wrapper around `google.script.run` | Same `api.js` calling `fetch()` to a REST API | Function names and JSON request/response shapes |
| Services (business rules) | `.gs` service files per module | Node.js or similar service files | Validation, status rules, scoring formulas |
| Data access | One repository module that reads and writes Sheets | Repository using SQL (e.g. PostgreSQL) | Table and column names, IDs, data types |

### UI design reference

The screens follow the [SVMI Command Center v2 design in Claude Design](https://claude.ai/design/p/2ed405f3-0ef3-42e2-9b79-93e0f03653d0?file=SVMI+Command+Center+v2.dc.html&via=share). It is the visual starting point for every TDMS module: layout, navigation, colors and components are taken from it and extended for the other modules. The design is still in progress, like the rest of the project, which remains in the planning phase. Each module spec lists the screens it adds to the design, and screen changes are made in the design first, then built.

### Design brief (merged from the Oct 3 UI/UX modernization plan)

The [SVMI UI/UX modernization plan](https://claude.ai/share/99d7f117-2fcf-47eb-ae80-6266dc28fe82) is now part of this plan. Its design direction applies to all of TDMS, not only store visits; the Claude Design file above is where it is drawn.

Design principles carried over:

- Dashboard first for supervisors and managers: summary cards with trend, then drill down to the records behind each number.
- Mobile first for officers in the field: large touch targets (at least 44 px), 16 px body text, one-column forms.
- Every action gives feedback (a toast that says what was saved), every list has a designed empty state, and loading shows a skeleton, never a blank screen.
- Readable and accessible: WCAG 2.1 AA contrast, visible keyboard focus, labels on every field.
- Reports can be exported to CSV and PDF.

Navigation, mapped from the brief's six sections to TDMS modules:

| Brief section | TDMS modules | Who sees it |
| --- | --- | --- |
| Dashboard | M7 home dashboard: summary cards, activity feed, quick actions, upcoming sessions | All roles (content by role) |
| Store Visits | M5 store directory, new visit, visit history, visits this month; M6 CAPAR cases | All roles |
| Proficiency and Certifications | M3 Team Leader program, M4 station proficiency and cross-training | All roles |
| (added) Training | M1 orientation, M2 programs, sessions and attendance | All roles |
| (added) Library | M8 SOPs, manuals, memos, FAQs, forms | All roles; restricted files for Supervisors and Admin |
| Reports and Analytics | M7 report templates and exports; M9 KPI scorecards | Supervisors and up for M9 |
| Admin and Settings | Users and roles, stores, team roster, lookups, audit log | System Admin |
| User Profile | Own account and preferences | All roles |

Key screen flows from the brief:

1. New store visit as a guided form: store (type to search, shows last visit), visit details (officers, date, purposes), observations with photos, corrective actions (owner, due date, priority), then review and submit. Drafts save as the officer goes.
2. Store directory as a list with status badges (risk tier, last visit, next due), filterable by brand, region and status.
3. Report templates: store readiness (stores by visits, QA result and TL certification), compliance trend over 90 days, facilitator performance (KRA by officer), and brand summary.

Where the brief and this plan differ, this plan wins for v1:

- The brief proposes a standalone React or Vue front end on paid hosting. With no budget yet, v1 screens are built in Apps Script with the same design, and React or Vue comes at migration (Section 8).
- Offline entry and voice notes are left out of v1 (see scope); drafts are kept on the server instead.
- The brief's facilitator competency matrix is a different thing from staff station proficiency (M4). Officer performance belongs in M9 KPI monitoring.
- Colours and type come from the Claude Design file, not from the brief's sample palette.
- The brief's cost and time-saving figures were examples, not measured targets, and are not used here.

### Design rules for the Sheets database

1. Separate files: one database spreadsheet (data only) and one Apps Script project (code only). No formulas, merged cells, colors or summary blocks in database tabs.
2. One tab = one table. Row 1 holds column names in snake\_case (e.g. `store_id`, `date_visited`). No blank rows, no monthly tabs.
3. Every table has a primary key column `id` with a prefixed ID (e.g. `EMP-000123`, `STR-0042`, `CAP-2026-0015`), generated by code, never typed.
4. Links between tables use IDs only (`store_id`, `employee_id`). Names are looked up for display.
5. Every table has audit columns: `created_at`, `created_by`, `updated_at`, `updated_by`, `is_active`, `row_version`.
6. Dates stored as text `yyyy-mm-dd`, timestamps as ISO 8601 in UTC. Percentages stored as numbers (92, not "92%").
7. Fixed choices (status, audit type, training type) live in a LOOKUPS table and appear as dropdowns.
8. Lists inside a record (several visitors, several stations) go to a child table, one row per item.
9. Only the repository module touches SpreadsheetApp. Services never read sheets directly.
10. Writes use LockService and one batch write per save. Reads use filters and paging; lookup tables are cached with CacheService.
11. Large logs (visits, audit log) are archived to a yearly archive file when they pass about 50,000 rows.

### Performance limits to plan around

Google Sheets allows up to 10 million cells per file, and Apps Script calls time out after 6 minutes. Screens should load one page of records (for example 50 rows) at a time, and dashboards should read from a small pre-computed summary table that is refreshed by a time trigger, not by reading every raw row on each page load.

### Source control (GitHub)

All TDMS code lives in a GitHub repository, so every change has history and a backup, and the project can be handed over if needed.

1. The GitHub repository is the master copy of the code, not the Apps Script editor. Code is pushed from the repository to Apps Script with clasp, Google's command-line tool for Apps Script.
2. Two branches: `main` is the live web app and `dev` is the test deployment. Changes go into `main` through pull requests.
3. In a later phase, GitHub Actions pushes `main` to Apps Script and creates a new deployment automatically.
4. Passwords, keys and private sheet IDs are never committed; they are kept in Script Properties.
5. Module specs and user guides sit in the same repository, and the repository becomes the codebase for the full-stack migration in Section 8.

Repository: [lheiiyy/TDMS](https://github.com/lheiiyy/TDMS), a private repository used only for TDMS. It holds the plan, the phase and module checklist, module specs, team conventions for Claude Code (`CLAUDE.md`) and the planning skills, so any Claude Code session on the repository follows the same rules. The SVMI PostgreSQL schema stays in [lheiiyy/TddProjectai](https://github.com/lheiiyy/TddProjectai) under `database/` and is used as the reference for the TDMS schema.

## 6. Data model

The first version needs 30 tables. Each one maps directly to a SQL table later; the column lists below are the starting point and will be finalised per module before it is built. Audit columns from Section 5 are on every table and are not repeated here.

### Core (M0)

| Table | ID prefix | Key columns | Links to |
| --- | --- | --- | --- |
| brands | BRD | code (AP, APX, FG, TM, KK), name, color, display\_order |  |
| regions | REG | name (NCR, N. Luzon, S. Luzon, Visayas, Mindanao) |  |
| stores | STR | store\_code, store\_name, ownership\_type, status, date\_opened, date\_closed, email, phone | brands, regions |
| positions | POS | name, level (Staff, Supervisory, Management) | brands |
| stations | STN | name, certification\_required, validity\_months | brands |
| employees | EMP | company\_employee\_no, temp\_id, last\_name, first\_name, middle\_name, suffix, date\_hired, employment\_status, company\_type, agency\_name | stores, positions |
| tdd\_team | TDD | full\_name, nickname, email, role, assigned\_brands, assigned\_region | employees (optional) |
| lookups | LKP | category, value, label, sort\_order |  |

### Working modules

| Table | Module | Key columns | Links to |
| --- | --- | --- | --- |
| orientation\_batches | M1 | batch\_no, start\_date, end\_date, venue | brands, tdd\_team |
| orientation\_attendees | M1 | status, score, deployment\_date | orientation\_batches, employees, stores |
| training\_programs | M2 | name, training\_type, duration\_hrs, has\_post\_test | brands |
| training\_sessions | M2 | session\_date, venue, target\_pax, actual\_pax, status | training\_programs, stores |
| session\_facilitators | M2 |  | training\_sessions, tdd\_team |
| session\_attendance | M2 | attended, post\_test\_score | training\_sessions, employees |
| tl\_enrollments | M3 | batch\_no, entry\_date, certification\_deadline, result, result\_date | employees, stores (mother, support), stations |
| tl\_assessments | M3 | assessment\_type (ISTV, TECHVAL, ENTRY\_EXAM, CERT\_GRADE, CERT\_EXAM), station, score, assessed\_on | tl\_enrollments, tdd\_team |
| uniform\_transactions | M3 | size, quantity, txn\_type (issue, return, receive), dr\_no | tl\_enrollments, tdd\_team |
| station\_certifications | M4 | certification\_type (regular, cross-training), tech\_val\_score, exam\_score, certified\_on, valid\_until, status | employees, stations, tdd\_team |
| store\_visits | M5 | visit\_date, mode (on-site, Zoom), remarks | stores |
| visit\_purposes / visit\_officers | M5 | purpose | store\_visits, lookups / tdd\_team |
| capar\_cases | M6 | audit\_type, audit\_failed\_on, scheduled\_on, verified\_on, qa\_status, qa\_endorsed\_on, report\_file\_url, status | stores, store\_visits, capar\_cases (follow-up of) |
| capar\_officers | M6 |  | capar\_cases, tdd\_team |
| resource\_categories | M8 | name, parent\_category\_id, allowed\_file\_types, view\_roles, upload\_roles, sort\_order | resource\_categories (parent) |
| resources | M8 | title, description, resource\_type (file, link), doc\_kind (SOP, manual, memo, form, exam, template), memo\_no, effective\_date, is\_restricted, drive\_file\_id, url, file\_type, version, status | resource\_categories, brands, training\_programs, tdd\_team |
| faqs | M8 | question, answer, display\_order, status | resource\_categories, brands |
| kpi\_definitions | M9 | name, kra\_area, unit, weight, direction (higher or lower is better), source (manual, auto), applies\_to\_role | lookups |
| kpi\_targets | M9 | period (yyyy-mm), target\_value | kpi\_definitions, tdd\_team |
| kpi\_scores | M9 | period, actual\_value, score, remarks, status (draft, reviewed) | kpi\_definitions, tdd\_team |
| audit\_log | All | action, table\_name, record\_id, field, old\_value, new\_value, user\_email, timestamp |  |

Store visit risk scoring keeps the approved SVMI model (failed QA or MS = +5 each, no qualifying visit this quarter = +3, recency points 0/1/2/4; LOW 0-4, MEDIUM 5-9, HIGH 10+) and reads from store\_visits and capar\_cases.

## 7. Roadmap

The build runs in eight phases over about 23 working weeks, one module at a time, with the live store visit module moved first. Week counts are planning estimates for one developer working part-time and will be revised after Phase 0.

![TDMS roadmap](roadmap.png)

Each phase is done only when its old sheet is set to read-only and the team enters new records in TDMS alone. Every phase delivers a working screen, imported legacy data, a one-page module spec and a short user guide.

Progress on every phase, module and feature (85 items) is tracked in the shared [TDMS Build Checklist](https://claude.ai/artifact/1MBxV4t8Np1C6E5YMnejoV), with a copy in `CHECKLIST.md` in the repository.

## 8. Migration plan to a full-stack web app

Because the tables, IDs and API calls are already in database form, migration is a data transfer and a backend swap, not a rebuild. It can start as soon as a budget and hosting are approved.

1. Create the SQL database from the table list in Section 6 (same table and column names, IDs as primary keys, links as foreign keys).
2. Export each database tab to CSV and import it; check row counts and run the same validation rules used in the app.
3. Rewrite the repository module for SQL. Services and screens stay as they are.
4. Stand up a REST API with the same function names the UI already calls; switch `api.js` from `google.script.run` to `fetch()`.
5. Move login from Google account checks to company sign-in (for example Google Workspace sign-in), keeping the same roles table.
6. Run both systems side by side for two to four weeks, then set the Sheets database to read-only as the archive.

Indicative target stack, to be confirmed with IT when budget is available: PostgreSQL database (Supabase or similar), Node.js API, React or Svelte front end, and file storage for CAPAR reports and photos.

Part of this work already exists: the `database` folder in TddProjectai holds a PostgreSQL schema for SVMI (13 migration files covering users and roles, stores, visitors and purposes, store visits, audit logs and file references), with dry-run reconciliation scripts for stores and visitors. It is tested locally but not deployed. TDMS should extend that schema rather than start a second one, so the TDMS table names in Section 6 must be checked against it before Phase 0 is built.

## 9. Risks, open decisions and next steps

### Risks

| Risk | Effect | Mitigation |
| --- | --- | --- |
| Dirty legacy data (store and name spellings) | Wrong counts after import | Clean stores first, then match employees by employee number, then by name + store with manual review |
| Sheets slows down as logs grow | Timeouts like the PMS pilot | Paging, cached lookups, summary tables, yearly archive |
| Team keeps using old sheets | Two sources of truth | Freeze each old sheet as read-only once its module goes live |
| Single developer | Work stops if owner is unavailable | Code in GitHub, short module specs, setup steps documented |
| No employee ID for some staff | Duplicate employee records | Temporary IDs with a weekly merge review |

### Decisions needed

- [ ] Confirm the role list: does Training Assistant Supervisor need its own role, or is it treated as Training Supervisor?
- [ ] Confirm how officers are assigned (by brand, by region, or both).
- [ ] Confirm whether store managers will submit data directly (as in PMS store submissions) or only TDD enters data in v1.
- [ ] Confirm the source of truth for the employee list (HR masterlist or TDD records).
- [ ] Confirm the system name: TDMS, or another name for management.

### Next steps

1. Approve this plan and the build order.
2. Build Phase 0: the core tables and the store cleanup.
3. Agree on the M5 store visit specification, since SVMI is already in use and is the first module to move.
