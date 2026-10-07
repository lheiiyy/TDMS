# TDMS Logical Data Model v1.0

Status: **FINAL logical model, subject to the blockers in §10.** Replaces v0.1. No SQL, no spreadsheet created.
Authority: Handover (§7.5, §7.6, §7.9, §7.10, §8, D001–D068) > Plan Audit > prototype. Requirements: [REQUIREMENTS](REQUIREMENTS.md). Decisions: [DECISIONS](DECISIONS.md). Open items: [DECISION-GATE](DECISION-GATE.md), [ISSUE-REGISTER](ISSUE-REGISTER.md).
Marks: unmarked = stated in an approved source or a direct consequence of it · **†** = proposed by this model, needs the packet or owner to confirm · **TBD** = value not yet decided (not invented here).

## 1. Principles (apply to every entity)

| # | Principle | Source |
| --- | --- | --- |
| P1 | IDs are server-generated, prefixed, never reused, never typed by users | D049, §7.10 |
| P2 | Links use IDs only; names are display values | D049, D044 |
| P3 | History-bearing records are never overwritten; change = new status/history/version row | D007, D008, D048, §7.5 |
| P4 | Every record type has **one** writing service (its authoritative entry) | Audit §B, D025 |
| P5 | Configuration is versioned rows with `effective_from`; a result stores the version it used | D008 |
| P6 | Referenced records are deactivated, never deleted; Admin delete = Recycle bin, restorable | §7.9, D021 |
| P7 | Only the repository reads/writes storage; one tab = one table; no formulas or merged cells | §2, Plan §5 |
| P8 | Logical types only; v1 stores them as text/number cells; ID, HR number, mobile, batch code, code-like columns are **text** | §6.3, §6.5, §8 |
| P9 | Timestamps ISO 8601 UTC; business dates `yyyy-mm-dd` in the organisation time zone (zone pending gate G-03) | Plan §5 |
| P10 | A cell ≤ 50,000 characters; no JSON blobs for history, snapshots or drafts | §8 (technical) |
| P11 | Computed values (Store Health, scorecards, department KPI) are derived, not source; frozen only through month snapshots | §2, §5.6 |

### 1.1 Record profiles (replace repeating the audit fields in every entity)

| Profile | Columns added to the entity's own fields | Concurrency |
| --- | --- | --- |
| **MUT** mutable | `id`, `created_at`, `created_by`, `updated_at`, `updated_by`, `is_active`, `row_version`, `legacy_ref`† (imported rows) | Optimistic: update carries `row_version`; mismatch → CONFLICT; version +1 on every write; writes under script lock |
| **APP** append-only | `id`, `created_at`, `created_by` | None needed (rows never edited); sequence/id allocation under lock |
| **VER** versioned config | APP columns + `effective_from`, `supersedes_id` | Insert only; "current" = latest version with `effective_from` ≤ date |
| **SYS** system | key + value only | Lock around increment |

`created_by` / `updated_by` hold `user_id` (never a name). The audit log additionally keeps the acting HR employee number (§5 AUD).

### 1.2 Deactivation vs deletion codes (used per entity)
**D** = deactivate when referenced (`is_active=false`, kept in lookups, hidden from new entry) · **B** = Admin delete to Recycle bin allowed only when unreferenced; restorable · **X** = never deleted or deactivated (immutable/append-only).

### 1.3 History codes
**S** = `status_history` row per transition · **F** = `record_history` field-level old/new · **A** = `audit_log` only · **V** = versioned rows · **—** none.

## 2. ID registry

| Entity | Prefix / format | Entity | Prefix / format |
| --- | --- | --- | --- |
| Person | `PER-000001` | Employee | `EMP-000001` |
| Trainee TEMP alias | `TEMP-26-0001` | User | `USR-0001` |
| Location | `LOC-0001` | Brand / Region | `BRD-` / `REG-` |
| Position / Station / Program | `POS-` / `STN-` / `PRG-` | Lookup | `LKP-` |
| Batch / Trainee enrollment | `BAT-2026-0001` / `TRN-2026-0001` | TL enrollment | `TLE-2026-0001` |
| Assessment (grade) | `ASM-2026-000001` | Trainee station result | `TST-2026-000001` |
| Certification / Validation | `CRT-2026-000001` / `VAL-2026-000001` | Visit | `VIS-2026-000001` |
| CAPAR case | `CAP-2026-0001` | Training session | `SES-2026-0001` |
| Uniform / Memo / File | `UNF-` / `MEM-` / `FIL-000001` | Delegation / Reset / Audit | `DLG-0000` / `RST-000000` / `AUD-000000` |
| History row | `HIS-` + sequence | Component | `CMP-` |
| All others | prefix **†** per entity below | | |

Year digits derive from the record date, never hard-coded (§8). Counters live in `id_counters` (SYS), allocated under lock.

## 3. History and audit architecture

Adopted as the model's design (**pending owner approval, gate item G-05**). It consolidates the three overlapping mechanisms in §7.5 / §7.6 / §7.10 / D023 / D048:

| Store | Holds | Mutable | Use |
| --- | --- | --- | --- |
| `audit_log` (AUD) | every authenticated action: sign-in, create, edit, approve, delete, restore, role change, email, AI call | no | security review, Admin-action oversight |
| `status_history` (HIS) | one row per status transition: entity, record id, from, to, `effective_date`, remark, user, time | no | "as of date" reads, month snapshots, EXECom |
| `record_history` (HIS) | field-level old/new for **designated entities** (marked F below) | no | D048, D008, edit traceability |

Open point folded into the approval: whether §7.10 "one row per changed field, for every table" means all tables or all history-bearing tables. The model assumes history-bearing tables (marked F).

## 4. Core people, identity, access

### ENT-020 persons — `PER-` — MUT
- **Purpose:** one record per human, for life; identity anchor for employee, trainee, TL, user.
- **Fields:** first_name, middle_name, last_name, suffix, mobile (text), birth_date (optional), legacy_ref†.
- **PK / FK:** PK person_id. No FK.
- **Relationships:** 1—0..1 employee · 1—0..n trainee_enrollments · 1—0..n tl_enrollments · 1—0..1 user · 1—n person_aliases.
- **Status:** none; `is_active`.
- **History:** F. Duplicate check on name + mobile (+ birth date) (D006).
- **Source/owner:** PersonService only (called by Trainee and Employee flows). Created at HR import, TDD add-employee, or trainee entry.
- **Deactivation / delete:** D; B only if no references. A person is never merged silently: merge = reviewed action with audit.
- **Version:** optimistic `row_version`.

### ENT-021 person_aliases — `PAL-`† — APP
- **Purpose:** keep TEMP ID and HR number as aliases of one person (D044, §7.10).
- **Fields:** person_id, alias_type (TEMP / HR_NO), value (text), valid_from, valid_to.
- **PK / FK:** PK id; FK person_id. **Status:** none. **History:** A. **Owner:** PersonService. **Deact/Delete:** X (end-dated, never removed). **Version:** none.

### ENT-022 employees — `EMP-` — MUT
- **Purpose:** the person's employment record; the unit the TDD maintains after the HR import (D025).
- **Fields:** person_id, hr_employee_no (text, digits only, no fixed length), location_id (current), position_id, employment_type/company_type, agency_name, status, date_hired, regularization_date, date_separated†, legacy_ref†.
- **PK / FK:** PK employee_id; FK person_id (unique), location_id, position_id.
- **Relationships:** n—1 person · 1—n employee_assignments · 1—n station_certifications · 1—n tl_enrollments (via person).
- **Status:** configurable list; **Active** and **Deactivated** are system statuses (Audit §E, D042).
- **History:** S + F (transfers and status "as of date", D007).
- **Source/owner:** **EmployeeService is the only writer**; callers: HR one-time import (D025), TDD add/edit, trainee Passed (D038). Trainee code never inserts employees directly.
- **Deactivation:** status → Deactivated; open plans, tasks, enrollments, cases go to the reassignment queue (D042). History and certifications kept.
- **Delete:** D only; B only before any reference. **Version:** optimistic.

### ENT-023 employee_assignments — `ASG-`† — APP
- **Purpose:** dated location/position history of an employee.
- **Fields:** employee_id, location_id, position_id, effective_from, effective_to, reason.
- **PK / FK:** PK id; FK employee_id, location_id, position_id. **Status:** none. **History:** S (this is the history). **Owner:** EmployeeService. **Deact/Delete:** X. **Version:** none.

### ENT-024 users — `USR-` — MUT
- **Purpose:** a TDD sign-in account (v1: TDD team roles only, D002).
- **Fields:** person_id, hr_employee_no (sign-in handle, text), short_name (unique active), email (unique active), role_code, password_hash (salted, repeated hashing, D024), must_change_password, failed_attempts, cooldown_until, last_login_at, execom_officer (flag, D037).
- **PK / FK:** PK user_id; FK person_id, role_code → roles.
- **Relationships:** 1—n user_brands, delegations (from/to), sessions, resets.
- **Status:** active / deactivated.
- **History:** F (role changes, flag changes) + A.
- **Source/owner:** UserService; role/flag changes by Admin only. A user cannot change own role or deactivate self.
- **Deactivation:** blocks sign-in, ends sessions and delegations; open assigned work → reassignment queue (D042); past `created_by` links keep resolving to the inactive user.
- **Delete:** D only (referenced everywhere). **Version:** optimistic.

### ENT-025 roles — seed
- **Purpose:** the 7 fixed roles (§3). **Fields:** role_code, name, is_tdd_role. Codes†: officer, supervisor, manager, senior, admin, storehead, area.
- **PK:** role_code. **Status:** none. **History:** — (changes only by release). **Owner:** seed script. **Deact/Delete:** X. **Version:** none. Role-to-capability mapping is data (ENT-026), not code.

### ENT-026 role_permissions — `RPM-`† — VER
- **Purpose:** the single server-side permission matrix (D023).
- **Fields:** role_code, permission_code (PERM-nnn), scope_kind (all / brand / assigned stores / own), decision (allow/deny), effective_from, supersedes_id.
- **PK / FK:** PK id; FK role_code. **History:** V + audit. **Owner:** PermissionService; **who may edit: undecided (gate G-06)**. **Deact/Delete:** X. **Version:** insert-only.

### ENT-027 user_brands — `UBR-` — MUT
User ↔ brand assignment (officer/supervisor defaults and notifications, D005). Fields: user_id, brand_id. FK both. History F. Owner UserService. Deactivate D; Delete B. Optimistic.

### ENT-028 user_locations — `ULC-`† — MUT
Store Head/Area Manager scope (user ↔ location). Built in Phase 0; accounts live in v2 (§3). Fields: user_id, location_id. FK both. History F. Owner UserService. Deactivate D; Delete B. Optimistic.

### ENT-029 delegations — `DLG-` — MUT (status-bearing)
- **Purpose:** temporary extra role access (D015).
- **Fields:** from_user_id, to_user_id, role_code, start_date, end_date, reason, status, decided_by, decided_at.
- **PK / FK:** PK id; FK from_user_id, to_user_id, role_code, decided_by.
- **Status:** pending → approved / rejected / cancelled; derived scheduled / active / ended (Roles spec).
- **History:** S. **Owner:** DelegationService (approval by Manager+ per matrix). Delegate gets own role plus delegator's; audit rows use the acting user, never the delegator.
- **Deactivation:** deactivating either user ends it. **Delete:** X. **Version:** optimistic.

### ENT-030 sessions — SYS/APP; ENT-031 password_resets — `RST-` — APP
Sessions: token_hash, user_id, last_activity, ended_at (storage design in the Auth packet). Resets: user_id, token_hash, expires_at, used_at. History A. Owner AuthService. Delete X (expired rows purged by trigger, audited). Concurrency: none.

## 5. Platform and configuration

### ENT-001 settings — `SET-`† — VER
- **Purpose:** every business setting as versioned rows (CONFIGURATION.md lists keys).
- **Fields:** setting_key, value, value_type, group, effective_from, set_by (user_id), reason, supersedes_id.
- **PK / FK:** PK id; FK set_by. **Status:** current/superseded (derived). **History:** V (this is the history). Each saved result stores `settings_version_id` used (D008).
- **Owner:** SettingsService; Admin unless the key's "who" says otherwise. **Deact/Delete:** X. **Version:** insert-only; a change inserts a new version.

### ENT-003 lookups — `LKP-` — MUT
Lists: audit/failure type (one shared list, D010), visit purpose, employee status, training type, session type, library category, TL quit reason, store frequency, QA status (values TBD). Fields: category, value, label, sort_order, is_system. History F. Owner LookupService. Deactivate D (system items cannot be disabled). Delete B only if never referenced. Optimistic.

### ENT-004 holidays — `HOL-`† — MUT
date, name, scope. Used for working-day counts (D036). Owner SettingsService. History F. Deactivate D; Delete B. Optimistic.

### ENT-002 id_counters — SYS
prefix, year, last_value. Owner IdService under lock. No history, never deleted.

### ENT-005 files — `FIL-` — MUT
drive_file_id (private), owner_record_type/id, kind, mime, size, sha256†, uploaded_by. Opened only through TDMS after a role check (D027). History A. Owner FileService. Deactivate D; Delete B (moved to recycle with file kept until purge).

### ENT-006 notifications — `NTF-`† — MUT
Purpose: in-app tasks and alerts (§7.2). Fields: recipient_user_id, kind, record_type/id, created_at, read_at. FK recipient. History A. Owner NotificationService. Deactivate D (dismissed). Delete X. Optimistic.

### ENT-007 email_log — `EML-`† and ENT-008 ai_call_log — `AIL-`† — APP
to/user, template, record ref, sent_at, result (CAPAR PDF send date lives here and on the case, D030); AI: user, record, provider, model, time, result (§7.11, D065 conditional). History A. Owner NotificationService / AiService. Delete X.

## 6. Organisation and master data

### ENT-010 brands — `BRD-` — MUT
code (permanent), name, colour. History F. Owner MasterDataService. D; B if unreferenced. Optimistic.

### ENT-011 regions — `REG-` — MUT
name. Filter only, not an assignment (D005). F. D; B if unreferenced.

### ENT-012 locations — `LOC-` — MUT   (this is also **Store**)
- **Purpose:** every physical/organisational place. **A Store is a location whose `location_type` = Store**; there is no separate store table (D045). Only Store type counts in visits, coverage and Store Health.
- **Fields:** location_type (Store, Commissary, Office, Call Center, Warehouse), name, brand_id, region_id, status, date_opened, date_closed, visit_frequency (lookup), ownership_type, address†.
- **PK / FK:** PK location_id; FK brand_id, region_id.
- **Status:** active / closed (+ system active flag). **History:** S + F.
- **Source/owner:** MasterDataService. **No fixed store owner** (D026).
- **Deactivation:** D; open plans, tasks, CAPAR cases go to the reassignment queue (D042). **Delete:** B only if unreferenced. **Version:** optimistic.

### ENT-013 positions — `POS-` — MUT
name, level (staff / manager), requires_ho_techval, brand scope. F. D; B if unreferenced.

### ENT-014 stations — `STN-` — MUT
name, certification_required, validity_months (configurable per station), brand scope. F. D; B if unreferenced.

### ENT-015 station_plans / station_plan_blocks — `SPL-`† / `SPB-`† — VER
Position → ordered blocks → stations; block length in days; exams on Friday (D050, D055). effective_from. Owner MasterDataService. Delete X.

### ENT-016 assessment_components — `CMP-` — MUT
name (HO exam, HO tech val, in-store exam, ISTV, more by Admin), group (HO / SOD). F. D; B if unreferenced. (D064)

### ENT-017 station_components — `SCM-`† — VER
station × component: required, weight, group, passing mark (defaults 89 staff / 90 manager, D054). effective_from. Delete X.

### ENT-018 training_durations — `TDU-`† — VER
track (Corporate / Franchise-Agency) × brand (blank = default) → length and milestone offsets; effective_from; applies to trainees enrolled after it (D063). Delete X.

### ENT-019 training_programs — `PRG-` — MUT
name, training_type, duration, has_post_test. F. D; B if unreferenced.

## 7. Training and trainees

### ENT-040 batches — `BAT-` — MUT
batch_code (text; DTS valid, D046), type, orientation_date, training_start, brand_id, track, officer_user_id. FK brand, user. Status: planned / ongoing / closed†. History F. Owner TraineeService. D; B if empty. Optimistic.

### ENT-041 trainee_enrollments — `TRN-` ("Trainee") — MUT
- **Purpose:** a person's training run in a batch (the trainee lifecycle).
- **Fields:** person_id, batch_id, temp_alias (TEMP), training_location_id, assigned_location_id, position_id, manage_by (drives track, D043), training_start, milestone dates (tech val, training end, in-store window, HR endorsement window), hr_endorsed_on, hr_result (values TBD), status, employee_id (set at Passed).
- **PK / FK:** PK trainee_id; FK person_id, batch_id, locations, position_id, employee_id.
- **Relationships:** 1—n trainee_station_results; n—1 batch; 0..1 employee.
- **Status:** Ongoing, Passed, Extended, Failed, Quit, Terminate; any correction path and extension limit pending (ISS-P1-02).
- **History:** S + F ("as of date" for EXECom; D007 month lock).
- **Source/owner:** TraineeService only. At Passed it calls EmployeeService; the person ID is unchanged (D038, D057).
- **Deactivation:** not deactivated; closed by status (Quit/Terminate/Failed/Passed). **Delete:** X (B only for an erroneous entry before any result, via Admin with reason). **Version:** optimistic.

### ENT-042 trainee_station_results — `TST-` — MUT
enrollment_id, station_id, status (passed/failed/in progress†), final_grade (saved when confirmed), passing_mark_used, settings_version_id, completed_on, retake_no. FK enrollment, station. History S + F. Owner TraineeService (grade from AssessmentService rows). Delete X. Optimistic. Saved results never recomputed (D008).

### ENT-043 assessments — `ASM-` — APP (corrections append)  (**TL Assessments** = rows with subject_type TL_ENROLLMENT)
- **Purpose:** every grade entry for trainee station results, TL enrollments and cross-training; the single grade store.
- **Fields:** subject_type, subject_id, component_id, score, assessed_on, assessed_by (user_id), retake_no, remark, supersedes_id (correction).
- **PK / FK:** PK id; FK component_id, assessed_by; polymorphic subject (validated by service).
- **Status:** none; superseded rows keep history. **History:** F by construction (corrections link via supersedes_id).
- **Source/owner:** AssessmentService. **Deact/Delete:** X. **Version:** none (append-only).

### ENT-044 training_sessions — `SES-` — MUT
program_id, training_type, date, venue/location_id†, brand_id, target_pax, actual_pax, status, post_test_flag. FK program, brand, location. Status: planned / done / cancelled† . History S + F. Created in Training only; shown and rescheduled in Calendar (D032). Deactivate D; Delete B if no attendance. Optimistic.

### ENT-045 session_facilitators — `SFA-`† — APP
session_id, user_id. FK both. History A. Owner TrainingService. Delete X.

### ENT-046 session_attendance (**Attendance**) — `SAT-`† — MUT
session_id, **person_id** (trainees and employees both), attended, post_test_score. FK both. History A (+ F when corrected). Owner TrainingService. Not the same as team attendance (ENT-103). Deactivate D; Delete X. Optimistic.

### ENT-047 import_batches `IMP-`† and import_rows `IMR-`† (**Import Batch / Import Review**) — MUT / APP
- **Purpose:** controlled import with a review step (D022, D023).
- **Batch fields:** kind (trainee, HR employee, history, other), file_id, uploaded_by, status (uploaded → validated → previewed → submitted → verified / rejected → recorded†), verified_by (EXECom officer for trainee imports, D037), counts.
- **Row fields:** import_id, row_no, raw values (text columns), validation result, decision (accept/fix/skip), created_record_type/id, legacy_ref.
- **FK:** file_id, uploaded_by, verified_by. **History:** S on batch; rows immutable after commit. **Owner:** ImportService (writes target records only through the owning service). **Deact/Delete:** X. **Version:** optimistic on batch.

### ENT-048 memo_templates / issued_memos — `MTP-`† / `MEM-` — **proposed (D051 pending)**
Not part of the approved v1 model; kept as a placeholder, not to be built before approval.

## 8. Team Leader and proficiency

### ENT-060 tl_enrollments — `TLE-` (**Team Leader Enrollment**) — MUT
- **Purpose:** a TL development run for a person (never keyed by name).
- **Fields:** person_id, employee_id, mother_location_id, station_id, entry_date, deadline (= entry + probation setting), status, batch_code, entry grades link (via assessments), quit_reason_lookup_id (D068), uniform summary derived.
- **PK / FK:** PK tl_enrollment_id; FK person, employee, location, station, lookup.
- **Relationships:** 1—n assessments, tl_extensions, tl_certifying_officers, uniform_transactions; 0..1 store_visit links.
- **Status:** entry grades, probation, certification, certified, extended, failed, quit, promoted (names from §5.7; **Quit separate from Failed**, D068).
- **History:** S + F (**TL History**: every change, D048).
- **Owner:** TlService; officer certifies, extends, closes without an approval step (D067); promotion Supervisor+ (D031).
- **Deactivation:** employee deactivated → enrollment goes to the queue to be closed with reason (D042). **Delete:** X. **Version:** optimistic.

### ENT-061 tl_extensions — `TLX-`† — APP
tl_enrollment_id, extension_no, old_deadline, new_deadline, reason. History: part of TL History. Owner TlService. Delete X.
### ENT-062 tl_certifying_officers — `TLO-`† — APP
tl_enrollment_id, user_id, role_in_cert†. Owner TlService. Delete X.
### ENT-063 uniform_transactions — `UNF-` — APP
tl_enrollment_id, type (issue/return/receive), item, size, qty, dr_no, date, user_id; uniqueness guard on dr_no+item†. Owner TlService. Delete X.
### ENT-064 TL history — **view** over status_history + record_history for ENT-060/061/062/043, not a table.

### ENT-070 station_certifications — `CRT-` (**Certification**) — MUT
- **Purpose:** an employee's proficiency certification for one station.
- **Fields:** person_id, employee_id, station_id, type (home / cross-training), certified_on, valid_until, status, recorded_by (**required** on new rows), early_flag, early_remark, supersedes_id, source (trainee Passed / validation / import).
- **PK / FK:** PK certification_id; FK person, employee, station, recorded_by, supersedes_id.
- **Status:** stored Active / Superseded†; Expiring and Expired derived from valid_until and the warning window (setting).
- **History:** S + F; renewals create a new row linked by supersedes_id.
- **Owner:** ProficiencyService. Passed-trainee stations become first certifications through it (D057).
- **Deactivation:** kept when the employee is deactivated (history). **Delete:** X. **Version:** optimistic.

### ENT-071 validations — `VAL-` — APP
certification event: person_id, station_id, validation_date, officer user_id, proof files (FIL via ENT-005), grades via assessments. History F. Owner ProficiencyService. Delete X.

### ENT-072 expiry_tasks / expiry_task_items (**Expiry Task**) — `ETK-`† / `ETI-`† — MUT
- **Purpose:** supervisor-queue task per location grouping certifications nearing expiry (§5.4, §10).
- **Fields:** task: location_id, assignee_user_id, status, scheduled_plan_id, flagged_at; item: task_id, certification_id.
- **FK:** location, user, plan, certification. **Status:** names per §5.4 (**TBD**: e.g. open / assigned / scheduled / completed). **History:** S.
- **Owner:** ExpiryService (generated from certifications by trigger; assigned by supervisor, D026).
- **Deactivation:** assignee/location deactivated → reassignment queue. **Delete:** X. **Version:** optimistic.

## 9. Field operations and CAPAR

### ENT-080 visit_plans — `PLN-`† — MUT   (**modelling choice pending: PROP-001**)
location_id, planned_date, purpose (lookup), assignee users (via visit_planned_officers†), status (planned, progress, done; Cancelled †), links (capar_case_id, tl_enrollment_id, expiry_task_id), created_from. FK listed. History S. Owner VisitService. Deactivate: via status; Delete X. Optimistic.

### ENT-081 store_visits — `VIS-` (**Store Visit**) — MUT
- **Purpose:** the record of a visit that happened; every record counts (D028).
- **Fields:** location_id, visit_date, **purpose (exactly one, lookup)** (D017), mode (on site / remote†), remarks, report_file_id (PDF, D035), plan_id (nullable), capar_case_id, tl_enrollment_id, auto_created flag (CAPAR verification, D062).
- **PK / FK:** PK visit_id; FK location, purpose, plan, capar, tl, file.
- **Status:** none beyond active/removed. **History:** F; month-locked after close (D007).
- **Owner:** VisitService (Log visit, plan completion, CAPAR Verified side effect). Officers edit own within the edit window.
- **Deactivation:** location deactivated does not alter past visits. **Delete:** B by Admin with reason; restorable. **Version:** optimistic.

### ENT-082 visit_officers — `VOF-`† — APP
visit_id, user_id (one row per officer; no pipe-separated names). Owner VisitService. Delete X.
### ENT-083 visit_failure_types — `VFT-`† — APP
visit_id, lookup_id (CAPAR verification needs ≥1). Owner VisitService. Delete X.

### ENT-090 capar_cases — `CAP-` (**CAPAR Case**) — MUT
- **Purpose:** one non-conformance case from failure through verification, QA send and closure.
- **Fields:** location_id, audit_type (lookup, shared list), audit_failed_on, stage, scheduled_on, verified_on, sent_to_qa_on (send date, D030), **qa_endorsed_on (QA endorsement date, required before Closed, §5.3)**, qa_report_file_id, follow_up_of_case_id, qa_status (values **TBD**, not built until decided).
- **PK / FK:** PK capar_id; FK location, lookup, file, follow_up_of. **Unique:** (location, audit_type, audit_failed_on) — duplicates blocked (D030).
- **Status:** Failed → Scheduled → Verified → Endorsed → Closed (§5.3); one stage at a time; Closed locked.
- **History:** S + F (stage dates and who moved it).
- **Owner:** CaparService. Failures for Store Health are **computed** from cases by audit_failed_on (D029); no stored failure counter.
- **Deactivation:** location or assignee deactivated → reassignment queue. **Delete:** X (B only an erroneous duplicate before Scheduled, Admin with reason). **Version:** optimistic.

### ENT-091 capar_officers — `COF-`† — APP
capar_id, user_id. Owner CaparService. Delete X.

### ENT-092 capar_findings — `CFB-`† (**CAPAR Finding**) — MUT
capar_id, finding_no (as in the source report), finding_text, root_cause, status, ai_drafted flag (D065 conditional). One block per numbered finding; lettered sub-findings stay inside the block. FK capar_id. History F. Owner CaparService. Deactivate D; Delete X after Scheduled; B before. Optimistic.

### ENT-094 capar_corrective_actions — `CCA-`† (**CAPAR Corrective Action**) — MUT
finding_id, action_text, person_responsible_user_id (or named person), target_date, status, completed_on. Cardinality: one per finding in v1†; separate table so 1..n needs no migration (**confirm in the CAPAR packet**, "structured corrective actions" D023). History F. Owner CaparService. Deactivate D. Delete X. Optimistic.

### ENT-093 capar_finding_photos — `CFP-`† — APP
finding_id, file_id. Limits TBD (D066). Owner CaparService. Delete X.

## 10. KPI/KRA, close and snapshot

### ENT-100 kra_definitions — `KRA-`† — VER (**KPI/KRA**)
5 KRAs, weight (25/25/20/20/10), formula_key, source, rating bands (90/80/70 via settings), effective_from. Owner KpiService. Delete X.
### ENT-101 kpi_targets — `KTG-`† — VER
user_id × month × (visits, sessions, certifications). One monthly target per officer (D009); set by Supervisor/Manager. Delete X.
### ENT-102 coaching_survey_results — `CSR-`† — APP
user_id, month, average_score, max_score; source form **TBD**. Owner ImportService.
### ENT-103 team_attendance_log — `TAT-`† — MUT
user_id, date, present/late/absent, marked_by. Not session attendance. F. Owner KpiService. Delete X.
### ENT-107 derived summaries (Store Health, scorecards, department KPI)
Cache tables rebuilt by trigger from source records; never edited; safe to discard; "updated at" shown.

### ENT-105 month_closes — `MCL-`† (**Month Close**) — MUT
month, status (open / closed; Closing† transient for long jobs), closed_by, closed_at, reopened_by/at/reason (reopen by Training Manager or Admin with written reason, §5.6; Senior Training Manager open, AMB-10), version. History S. Owner CloseService. Delete X. Optimistic.
### ENT-106 month_snapshots / month_snapshot_rows — `MSN-`† (**Month Snapshot**) — APP
Header: month_close_id, report_kind, version. Rows: subject_type/id, metric_key, value (number/text), period. Snapshot is **rows, not a JSON blob** (P10). Immutable; later corrections create a new version. Owner CloseService. Delete X.

## 11. Library, LMS, administration

### ENT-110 resource_categories — `RCT-`† and ENT-111 resources — `RES-`† (**Library Resource**) — MUT
Category: name, parent, allowed types, view/upload roles. Resource: title, kind, memo_no, effective_date, restricted flag, file_id, version, category_id. History F. Owner LibraryService. Archive via is_active; Delete B (unreferenced, file retained until purge). Optimistic.
### ENT-112 faqs — `FAQ-`† — MUT; ENT-113 lms_questions — `LMQ-`† (**LMS Question**) — MUT
LMS question: question, asker_user_id, brand_id, assignee_user_id, answer, status (open / answered / published†), published_faq_id. History S. Owner LibraryService. Non-AI help (D014). D; B if unanswered and unreferenced.

### ENT-114 approval_requests — `APR-`† (**Approval**) — MUT
kind (e.g. deactivation request), subject_type/id, requested_by, status (pending/approved/rejected), decided_by, decided_at, remark. **CAPAR closure, TL promotion and similar approvals are state transitions** recorded in status_history, not rows here (INFERRED). History S. Owner ApprovalService. Delete X. Optimistic.
### ENT-115 reassignment_queue — `RAQ-`† — MUT (or a view)
open items from a deactivation: source_type/id, previous_owner, reason (D042), status, resolved_by, resolution (reassigned / closed with reason), remark. History S. Owner AdminService. Delete X. Whether table or view: ISS-P1-16.
### ENT-116 recycle_bin — `RCB-` (**Recycle Bin**) — APP
table_name, record_id, snapshot (row as columns/JSON ≤ 50,000 chars; larger → file), reason, deleted_by/at, restored_by/at. Admin only (D021). Delete X (purge policy by Admin, audited).
### ENT-117 audit_log — `AUD-` (**Audit Log**) — APP
action, entity, record_id, old/new (small JSON, ≤ 50,000 chars), user_id, hr_employee_no, time, reason (required for sensitive actions). Immutable; yearly archive past ~50,000 rows. Owner AuditService. Delete X.
### ENT-118 status_history / record_history — `HIS-` — APP
see §3. Owner HistoryService. Delete X.

## 12. Relationship overview

```
brand ─< location >─ region                   (Store = location_type Store)
person ─┬─ employee ─< station_certification >─ station
        ├─ trainee_enrollment ─< trainee_station_result ─< assessment >─ component
        │        └─ batch
        ├─ tl_enrollment ─< assessment, tl_extension, uniform_transaction
        └─ user ─< user_brand, user_location ; user ─< delegation
location ─< visit_plan ─> store_visit ─< visit_officer, visit_failure_type
location ─< capar_case ─< capar_finding ─< corrective_action, photo(file)
capar_case ─> store_visit (verification) ; store_visit ─> tl_enrollment (link)
station_certification ─> expiry_task_item ─> expiry_task (per location)
month_close ─< month_snapshot ─< month_snapshot_row
(all tables) ──> audit_log ; history-bearing tables ──> status_history / record_history
```

## 13. DATA OWNERSHIP MATRIX

"Edit" = may change after creation, through the owning service only. Owner-deactivated behaviour follows D042 unless stated. Edit rights by role are in [PERMISSIONS](PERMISSIONS.md).

| Record / state | Created where | Owner (single writer) | Read by | May edit | If owner / subject is deactivated |
| --- | --- | --- | --- | --- | --- |
| Person | HR import; TDD add; trainee entry | PersonService | all | TDD (Admin/Supervisor+) with history | Kept; never deleted; alias history kept |
| Employee | Employees screen / HR one-time import / trainee Passed | EmployeeService | all modules | TDD roles per matrix | Status Deactivated; open plans, tasks, enrollments, cases → reassignment queue |
| User | Admin | UserService | Admin, audit | Admin only | Sign-in blocked, sessions and delegations ended; assigned open work → queue; old rows still resolve the name |
| Role permissions | Config | PermissionService | all (server checks) | per gate G-06 | n/a |
| Delegation | Admin / requester | DelegationService | Admin, parties | Manager+ approve; parties cancel | Ended automatically |
| Brand / region / position / station / program | Master data | MasterDataService | all | Manager / Admin (§3) | Deactivated; hidden from new entry; history kept |
| Location / Store | Master data | MasterDataService | all | Manager / Admin | Open plans, tasks, cases → queue; past visits unchanged |
| Settings, lookups, holidays | Config | SettingsService / LookupService | all | Admin (targets: Supervisor/Manager) | Lookup values deactivated; setting versions never edited |
| Trainee enrollment & status | Trainee screen / import | TraineeService | Training Dept only (D037), EXECom | TDD officers; month-locked | Employee/trainee left: closed by status with remark |
| Trainee station result / grades | Trainee screen | TraineeService + AssessmentService | EXECom, reports | officers; corrections append | Kept |
| Import batch / rows | Trainee, HR, history imports | ImportService | Admin, EXECom officer | verifier only | Kept as evidence |
| TL enrollment, extensions, certifying officers | Employee profile → TL | TlService | Boards, reports | officer (certify/extend/close), Supervisor+ (promote) | Closed with reason via queue |
| Certification, validation | Proficiency / trainee Passed | ProficiencyService | Employees, expiry, KPI | officers; new row to renew | Kept as history |
| Expiry task | generated by trigger | ExpiryService | supervisors, assignee | Supervisor assigns | Assignee/location deactivated → queue |
| Visit plan | any store screen / CAPAR / expiry / TL | VisitService | Calendar, Boards | assignee/officer own; Supervisor+ any | Assignee deactivated → queue |
| Store visit | Log visit / plan done / CAPAR Verified | VisitService | Store Health, KPI, reports | officer own (edit window); Supervisor+ | Past visits kept; officer name still resolves |
| CAPAR case, findings, actions | CAPAR screen | CaparService | Store Health, KPI, reports, QA email | officers/supervisors per stage | Assignee/location deactivated → queue |
| Training session | Training | TrainingService | Calendar, KPI | creators/Supervisor+; drag in Calendar | Facilitator deactivated: session kept, queue if open |
| Attendance (session) | Training | TrainingService | KPI, reports | session owner | Kept |
| KPI targets | KPI screen | KpiService | scorecards | Supervisor/Manager | Kept as versions |
| Coaching survey, team attendance log | import / daily mark | ImportService / KpiService | scorecards | marker/Supervisor | Kept |
| KRA definitions | Config | KpiService | scorecards | Admin (effective-dated) | Kept as versions |
| Month close, snapshot | Month-end job | CloseService | reports | M, A reopen with reason (§5.6) | n/a |
| Library resource, FAQ, LMS question | Library / LMS | LibraryService | by role | uploader/Manager | Archived; asker/assignee deactivated → reassign |
| Approval requests, reassignment queue | system / requester | ApprovalService / AdminService | Supervisor+ | decider | Open items stay until resolved |
| Notifications, email/AI logs | system | NotificationService | recipient/Admin | none | Recipient deactivated: stop sending |
| Audit log, status/record history, recycle bin | system | AuditService / HistoryService / AdminService | Admin, Senior (oversight) | nobody | Kept forever |

## 14. Old 30 tables → this model
brands/regions/positions/stations/lookups → ENT-010/011/013/014/003 · stores → locations (ENT-012) · employees → persons + employees + assignments · tdd_team → users · orientation batches → batches + trainee_enrollments · programs/sessions/facilitators/attendance → ENT-019/044/045/046 (attendance by person) · TL tables → ENT-060/043/061/062/063 · certifications → ENT-070/071 · visits → ENT-080–083 · CAPAR → ENT-090–094 · library → ENT-110–113 · KPI → ENT-100–103 (scores computed) · audit → ENT-117/118. New: persons, aliases, permissions, delegations, sessions, components, station plans, durations, expiry tasks, close/snapshots, recycle bin, imports, notifications, logs, holidays, settings versions, approvals, reassignment queue.

## 15. Modelling decisions and DATA MODEL BLOCKERS

| ID | Question | Scope | Blocks |
| --- | --- | --- | --- |
| M1 | Approve the history architecture in §3 (three stores; field history on designated tables) — gate G-05 | all history-bearing tables | **foundation tables** |
| M2 | Visit plan and visit log as two linked entities (PROP-001) | ENT-080/081 | PH-9 tables only |
| M3 | Trainee extension semantics, limit, correction path (ISS-P1-02) | ENT-041 (+ extension rows if needed) | PH-11 tables only |
| M4 | CAPAR corrective-action cardinality (1 per finding vs 1..n) | ENT-092/094 | PH-10 tables only |
| M5 | Expiry task status names and grouping rule (§5.4) | ENT-072 | PH-13 tables only |
| M6 | Visit purpose for an expiry visit (ISS-P1-08) | ENT-081 link only | no schema change |
| M7 | Reassignment queue: table or view (ISS-P1-16) | ENT-115 | PH-6 only |
| M8 | Who edits `role_permissions` (G-06) | ENT-026 write rules, not structure | no schema change |

Resolved here (not blockers): snapshot storage = rows (P10); Store = location subtype (D045); TL history = view; audit fields via profiles.

**DATA MODEL BLOCKERS: YES** — one blocker for the foundation tables: **M1 / gate G-05** (approve the history architecture). Five further items (M2–M5, M7) block only their own module's tables and do not stop the foundation. No blocker comes from time zone, role-permission editor or TL formula (settings and write rules, not structure).

## 15. Rule-stamp amendments (from CONFIGURATION v1.0 Part 2; proposal PROP-006, pending CD-38)

Field additions needed so results keep the rule that produced them. Logical only; no change to ownership.
- **DM-A0** `settings_bundles` / bundle version: a result's `settings_version_id` points to one bundle version (members listed as rows, not a blob, P10).
- **DM-A1** trainee_enrollments: `timeline_version_id`. **DM-A2** `plan_version_id`.
- **DM-A3** post-test result: `passing_score_used`.
- **DM-A4** tl_enrollments and tl_extensions: `tl_bundle_version_id`, `extension_days_used`.
- **DM-A5** TL certification result: `pass_mark_used`, weights version.
- **DM-A6** station_certifications: `validity_months_used` (`valid_until` already stored).
- **DM-A7** expiry_tasks: `window_days_used`, `created_on`.
- **DM-A8** capar_cases: `sla_version_id`, stored `due_on` per stage.
- **DM-A9** CAPAR QA send: `sent_to_email`.
- **DM-A10** month_snapshot_rows: `bundle_version_id`, `engine_version`, `targets_version_id`.
- **DM-A11** month_closes: `deadline_day_used`.
- **DM-A12** generated memo/report: template version id.
