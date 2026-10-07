# TDMS Workflow Specification v1.0

Status: **FINAL specification with the open items listed per workflow and in §10.** No code. Source of truth: Handover §5–§7 and D001–D068 (cited per row). Data: [DATA-MODEL](DATA-MODEL.md). Who may act: [PERMISSIONS](PERMISSIONS.md). Rules: [BUSINESS-RULES](BUSINESS-RULES.md).

**Tags** (never silently upgraded): `A` approved in the Handover (cites section/decision) · `RS` Roles Access Spec v0.2 where the Handover is silent · `P` prototype only — **not a requirement** · `I` inferred by this specification, needs approval before it is built · `TBD` undefined: the transition is **not built** until decided.

## 0. User list → workflow IDs
| Requested | ID | Requested | ID |
| --- | --- | --- | --- |
| 1 Trainee | WF-001 | 6 Month-End Close | WF-006 |
| 2 Team Leader | WF-002 | 7 Delegation | WF-007 |
| 3 Store Visit | WF-003 | 8 Employee Deactivation | WF-008 |
| 4 CAPAR | WF-004 | 9 Store Deactivation | WF-011 |
| 5 Certification Expiry | WF-005 | 10 TDD User Deactivation | WF-012 |
Supporting: WF-009 Import with review · WF-010 Admin delete/restore · WF-013 Reassignment queue · WF-014 Cross-training record. (IDs WF-001…010 are unchanged from v0.1 so other documents stay valid.)

## 1. Rules common to every workflow
1. Every state change writes a `status_history` row (entity, record, from, to, `effective_date`, remark, user, time) and an `audit_log` row (§7.5, §7.6; DATA-MODEL §3).
2. The actor is checked on the server against [PERMISSIONS](PERMISSIONS.md) **and** the transition table below; an invalid transition returns an error, never a silent no-op.
3. A change dated inside a closed month is recorded with a note and shows in the next open month; the closed snapshot never changes (D007, §5.6).
4. Officers edit or remove only their own entries inside the 24-hour window; Supervisor and above, and Admin (with reason), may still edit (§3, D021).
5. Heavy recalculation (Store Health, summaries) is queued after the save, never run inside it (§2).
6. Cross-module side effects run with the **acting user's** authority and record that user (PERMISSIONS SL-12).
7. Notifications: only those the Handover names are specified here. Where none is named the row says "none specified"; none are invented. The approved set is collected in §9.
8. Audit event names (`ENTITY.ACTION`) are identifiers chosen by this specification (†); their content is fixed by PERMISSIONS §7.

---

## WF-001 Trainee (MOD-007) — entities ENT-020, 040, 041, 042, 043, 022, 070

**States (A, §6.3):** Ongoing · Extended · Passed · Failed · Quit · Terminate. *Enrollment* is an event that creates Ongoing, not a stored status (I). **Terminal:** Passed, Failed, Quit, Terminate.
**Station result (sub-state, A §6.2, D055):** In progress → Passed | Failed → (retake) In progress. Each station is graded and passed on its own.

| # | Transition | Actor | Required fields and validation | Side effects | Notifications | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | (enroll) → Ongoing | per PERMISSIONS (O own, S, M, Sr) | name, **mobile 09XXXXXXXXX**, batch code (text; DTS valid), brand, assigned location (any type), position, MANAGE BY, training start; birth date optional. Duplicate check on name + mobile (+ birth date): same name + different mobile = new person; same name + mobile = "possible match" prompt (D006, D044) | Person created or linked; TEMP alias assigned; milestone dates filled from the track (D043, D063) unless the officer adjusts one trainee's dates (logged); station plan for the position attached (D055); **no employee yet** | none specified | A |
| 2 | Station: grade entered → computed → confirmed | assigned O, S+ | components required by the station (HO exam, HO tech val, in-store exam, ISTV; D064); grades 0–100; final = 0.10 HO exam avg + 0.20 HO tech val avg + 0.70 SOD, missing parts' weight shared (D052) | final grade **saved at confirmation** with the passing mark and settings version used (D008); compared with the station mark (default 89 staff / 90 manager, D054) | none specified | A |
| 3 | Station: Failed → retake | system | a failed station is retaken **alone on the next Friday**; training period fixed; two or more exams may fall on one day; **no retake limit inside the period** (D055, D056) | retake = new grade row on the same station result; later blocks and Training End do not move | none specified | A |
| 4 | Ongoing → Extended | system (derived) | at least one station is being retaken (§6.2) | status_history row | none specified | A |
| 5 | Extended → Ongoing | system (derived) | every retaken station passed, later blocks pending | status_history row | none specified | I (implied by §6.2) |
| 6 | Ongoing / Extended → **Passed** | system on last station pass; officer confirms result | **every station in the plan passed** (§6.2); assigned location and position present | **Employee created at once** through EmployeeService with assigned store and position (D038); each passed station becomes the employee's **first certification, home station**, with grades and date (D057); person ID never changes; HR endorsement date/result recorded later; regularization date recorded when HR gives it | none specified | A |
| 7 | Ongoing / Extended → **Failed** | system at Training End | a station still not passed at Training End **unless a supervisor records another result with a remark** (§6.2); marked "to confirm" in §11 | none | none specified | A (rule awaiting confirmation) |
| 8 | any open → Quit | TDD roles per PERMISSIONS | quit date; remark | open retakes cancelled† | none specified | status A; actor, validation **TBD** (prototype: remark ≥ 5 chars, P) |
| 9 | any open → Terminate | TBD | reason (sample data: attendance violations) | — | none specified | status A; actor and validation **TBD** |
| 10 | terminal → corrected | TBD | — | — | — | **TBD** (prototype: reason ≥ 10 chars, flags the employee when reversing a Passed, P) |

**Prohibited:** Passed while any station in the plan is not passed · any retake after Training End · moving Training End or later blocks for a retake (D055) · linking records by name (D044) · deleting an enrollment that created an employee · recomputing a saved grade when a setting changes (D008) · grading with a component the station does not require (missing-weight rule applies instead) · editing history rows · an import row saved before the review screen shows every row valid or skipped (D022).
**Audit events:** TRAINEE.ENROLLED, .DATES_ADJUSTED, .GRADE_CONFIRMED, .STATION_PASSED, .STATION_FAILED, .RETAKE_SCHEDULED, .STATUS_CHANGED, .EMPLOYEE_CREATED, .HR_ENDORSEMENT_RECORDED, .REGULARIZATION_RECORDED.
**Historical records:** `status_history` with effective date (EXECom counts for any date read the last event on or before it, computed, never typed, §6.4); `record_history` on dates and grades; every grade and retake kept; saved station results immutable; month snapshot of EXECom.
**Open:** ISS-P1-02 (Quit/Terminate rules, correction path, extension limit); Failed-at-end confirmation (§11); assessment-component starting list (§11).

---

## WF-002 Team Leader (MOD-008) — ENT-060, 061, 062, 063, 043, 022

**States (A, §5.7, D068):** Entry · Probationary · Certification check · Certified · Extended · Failed · **Quit** · Promoted. **Closed:** Certified (until Promoted), Failed, Quit, Promoted. Re-enrollment is allowed (a new enrollment; the person keeps one ID).

| # | Transition | Actor | Required fields and validation | Side effects | Notifications | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | (enroll) → Entry | S or O | existing **employee** (from the profile), mother location, station, entry date; **one open enrollment per person**; deadline = entry + probation period (default 3 months) | **TLTC visit plan** created in Calendar and linked (§5.7) | none specified | A |
| 2 | Entry → Probationary | O, S | start condition: enrollment date vs date the fifth entry grade is saved | — | none specified | A; trigger **TBD** (§11) |
| 3 | Probationary → Certification check | O, S | all required entry grades present (default five: Food Prep tech val, Pizza Maker tech val, Food Prep exam, Pizza Maker exam, ISTV; Admin list, D064) | — | none specified | A |
| 4 | Certification check → **Certified** | certifying O, or S+ (**no approval step**, D067) | checklist grade, exam, ≥ 1 feedback score (Kitchen, Manager); final = 0.30 checklist + 0.40 exam + 0.30 feedback, feedback = 0.60 kitchen + 0.40 manager; ≥ pass mark (default 85); averages computed, never typed | weights and mark **saved at certification** (D008); certification date; certifying officers one row each | none specified | A; **current formula unconfirmed (D053, §11)** |
| 5 | Certification check → **Extended** → Certification check | O or S+ (D067) | below pass mark at the deadline; extension length (default 30 days); numbered extension row: number, old deadline, new deadline, reason | deadline moves; TL returns to certification check | deadline warning 14 days before (dashboard + digest) | A; **max extensions TBD (§11)** |
| 6 | Certification check → **Failed** | O or S+ | closes the enrollment | open TLTC plan cancelled (I) | none specified | A (status) |
| 7 | any open → **Quit** | O or S+ (D068) | quit date, reason from the Admin list (values **TBD**) | closes as Quit, **not Failed**; **open TLTC plan cancelled**; re-enrollment allowed | none specified | A |
| 8 | Certified → **Promoted** | **Supervisor or higher** (D031); officer cannot | only a Certified TL | — | none specified | A |
| 9 | any → Probationary (return) | S+ | note | — | none specified | A (§5.7 step 4); allowed source states **TBD** |

**Prohibited:** skipping a stage (one stage at a time, §5.7) · certifying without all entry grades or without checklist, exam and one feedback score · promoting a non-Certified TL · promotion by an officer · any supervisor-approval step for certify/extend/close (D067) · recording Quit as Failed · two open enrollments for one person · typed averages · overwriting history (D048) · linking by name.
**Notifications (A, §5.7):** deadline within the warning window → dashboard + digest; passed deadline shown red; an enrollment with no officer, no visit or no certification by its visit date → supervisor queue + digest.
**Audit events:** TL.ENROLLED, .ENTRY_GRADE_RECORDED, .CERT_CHECK_RECORDED, .CERTIFIED, .EXTENDED, .FAILED, .QUIT, .RETURNED_TO_PROBATION, .PROMOTED, .UNIFORM_LOGGED.
**Historical records (D048):** every change — status, each grade, deadline, extension, officers, store, station, uniform, remarks — as a dated old/new row; extensions numbered; current record shows latest, history tab shows all.
**Open:** TL formula and pass rule (D053); extension limit; quit reasons list; probation start trigger.

---

## WF-003 Store visit and visit plan (MOD-004) — ENT-080, 081, 082, 083

**Plan states (A, §5.1):** Planned · In progress · Done. **Cancelled** is used by §5.7 ("open TLTC visit plan … is cancelled") but is not in the §5.1 list → **proposed PROP-002**. *Overdue* is derived (planned date < today), not a state (I).
A **visit record** is created when work is done; every visit record counts (D028).

| # | Transition | Actor | Required fields and validation | Side effects | Notifications | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | (plan) → Planned | O (own), S+ — from any screen showing a store, one shared form | location, date, **one purpose** (Store Visit, TLTC, Curing/Support, CAPAR Verification, D017), assignee(s); warning if the store already has a plan that day; from a CAPAR case or TL enrollment the plan is **linked automatically and gets the matching purpose** | shows in Calendar | none specified | A (D061) |
| 2 | Planned → In progress | assignee | — | status shown on the calendar item | none specified | A |
| 3 | In progress → Done | assignee | purpose; officers; **failure type(s) from the shared list if CAPAR Verification** (D010); link to the CAPAR case or TL enrollment; PDF report attached or generated from notes (D035) | **visit record created; counts** in KPI, coverage, Store Health; duplicate warning on store + date + purpose, still counts if confirmed (D028, §7.9) | none specified | A; whether the PDF is mandatory **TBD** |
| 4 | (direct log) → Done | O, S, M, Sr | same as 3 | same | none specified | A |
| 5 | Planned → Cancelled | system (TL Quit/Failed), S+, assignee | reason | removed from Calendar; history kept | none specified | I (PROP-002); user-driven removal P |
| 6 | Planned: change date / assignee | **officer moves only own plans; a supervisor moves plans a supervisor assigned** (D040); reassign: S+ | drag, or "Move to date" | history row | none specified | A |
| 7 | CAPAR marked Verified → visit | system (see WF-004 #4) | links the **existing** verification visit if one was logged, else creates one by the officer who marked Verified; never counted twice (D062, §5.2) | counts: visit KRA +1, coverage, Store Health −4 | none specified | A; **relation to the plan made at "Scheduled" undefined (ISS-P1-06)** |

**Notifications (P, not approved):** planned visit overdue (prototype `T.notifications`).
**Prohibited:** Done → Planned · a second counted verification visit for one case · officer editing after the 24-hour window · editing a closed-month visit in place · visit photos (D035; cross-training proof excepted, D059) · more than one purpose per visit (D017) · a TLTC visit not linked to its TL enrollment.
**Audit events:** VISIT.PLANNED, .MOVED, .REASSIGNED, .STARTED, .COMPLETED, .CANCELLED, .EDITED, .REPORT_ATTACHED, .REPORT_GENERATED.
**Historical records:** `status_history` on plans; `record_history` on visits; visit rows are month-locked after close; Store Health "as of" uses settings versions in force (§5.8).
**Open:** ISS-P1-06 plan vs verification visit; PDF mandatory?; visits to non-Store location types (D045 says only Store counts; whether others can be logged is not stated); Store Visit Report Option A vs B (§11).

---

## WF-004 CAPAR (MOD-006) — ENT-090, 091, 092, 093, 094, 081, 080, 005, 007, 008

**States (A, §5.3):** Failed → Scheduled → Verified → Endorsed → Closed. One stage at a time. **Closed is locked.**
Required data on the case: location, audit type (shared list), audit failed date, QA report file; send date; **QA endorsement date**.

| # | Transition | Actor | Required fields and validation | Side effects | Notifications | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | (open) → **Failed** | O or S (D030) | store, audit type, audit failed date, **QA/MS report file (PDF, Word, image)**; a second case with the same store + audit type + audit date is **blocked** | AI drafts finding blocks using the report's own numbering; **officer reviews, edits and confirms; nothing saved until confirmed**; AI-drafted text stays flagged until edited or accepted; if AI is off or fails, blocks entered by hand (D065, conditional: ISS-P0-18); failure feeds Store Health from the **audit failed date** (D029); stage clock starts | none specified | A |
| 2 | Failed → **Scheduled** | S+ (officer: **TBD**, CON-05) | verification date and officer(s); target **7 working days** (as designed) | visit plan created and linked, purpose CAPAR Verification (§5.1) | overdue vs target → dashboard + digest | A; actor TBD |
| 3 | Scheduled → **Verified** | assigned O, or S+ | finding blocks: finding no., finding, root cause, corrective action, person responsible, target date, status (one block per numbered finding, lettered sub-findings inside one corrective action); **≥ 1 failure type** for the verification visit; photos per block optional (D066) | **CAPAR Verification visit** created, or the existing one linked, by the officer who marked Verified; counts once: visit KRA +1, coverage, Store Health −4 (D062) | overdue vs target → dashboard + digest | A; whether every block must be complete **TBD** |
| 4a | in Verified: **send to QA** | assigned O, S+ | CAPAR PDF generated from the blocks with photos under each finding; QA address from settings | PDF emailed; **send date recorded** (D030); email_log row | none specified | A |
| 4b | Verified → **Endorsed** | assigned O, S+ | **QA endorsement date** | — | overdue vs target → dashboard + digest | A that the date is required before Closed (§5.3); **what triggers Endorsed (send vs QA confirmation) is TBD (ISS-P1-01)** |
| 5 | Endorsed → **Closed** | S, M, Sr, A ("Supervisor approves CAPAR closures", §3) | **QA endorsement date present** | case locked | appears in "waiting for my approval" digest (§7.2) | A |
| 6 | (repeat failure) → new case | O, S | links to the earlier case (`follow_up_of`) | — | none specified | A |

**Per-stage targets (A, §5.3, D036):** working days using the Admin holiday list; Failed→Scheduled = 7; Scheduled→Verified, Verified→Endorsed, Endorsed→Closed **open (§11)**. A case past its target is overdue on the dashboard and in the digest.
**Prohibited:** closing without a QA endorsement date · skipping or going back a stage (the prototype "return with note" is **P, not approved**) · a second case with the same store + audit type + audit date · counting a case or its verification visit twice · stored failure counters (failures computed from cases, D029) · saving AI output before the officer confirms · editing a Closed case (open a linked case instead, I) · photos outside the private Drive (D027).
**Audit events:** CAPAR.OPENED, .AI_DRAFT_REQUESTED, .AI_DRAFT_CONFIRMED, .FINDING_EDITED, .PHOTO_ATTACHED, .SCHEDULED, .VERIFIED, .VERIFICATION_VISIT_CREATED / _LINKED, .REPORT_SENT_TO_QA, .QA_ENDORSED, .CLOSED.
**Historical records:** `status_history` per stage with effective date; `record_history` on finding blocks; email_log (send date); ai_call_log (user, record, time, result).
**Open:** ISS-P1-01 QA endorsement meaning; stage targets and QA address; photo limits; multi-officer and remote verification counting (proposed: only the officer who marks Verified; remote does not count); AI scope in v1 (ISS-P0-18).

---

## WF-005 Certification expiry (MOD-009) — ENT-070, 071, 072, 081/080, 022

**Certification states (A, §5.10):** Active → Warning (expiring) → Expired; matrix cell shows home · cross-trained · expiring · expired · none. A renewal is a **new record that closes the previous one**.
**Expiry task states (names I; steps A, §5.4):** Open (unassigned) → Assigned → Scheduled → Completed. One task per store, grouping that store's expiring items.

| # | Transition | Actor | Required fields and validation | Side effects | Notifications | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Active → Warning | system (daily trigger) | `valid_until − warning window` (window **open**, §11) | cell shows "expiring" | — | A; value TBD |
| 2 | Warning → task item | system | grouped with the same store's other expiring items into **one task per store**; queue ordered by earliest expiry | task in supervisors' queue | counts of unassigned/overdue tasks on dashboard | A; grouping when a task already exists **TBD** |
| 3 | Open → Assigned | S+ (no store owner, D026) | assignee officer | — | assignee | A (notification channel not stated: I) |
| 4 | Assigned → Scheduled | assignee | a visit plan from the store | plan linked to the task | — | I; **purpose undefined — only four purposes exist (ISS-P1-08)** |
| 5 | Scheduled → Completed | system / assignee | a new certification for the station closes the old; items renewed or removed | — | — | I |
| 6 | Warning → Expired | system | `valid_until` passed without renewal | cell shows "expired" | — | A |
| flag | Unassigned, or assigned but not scheduled within the Admin-set days | system | — | flagged | **dashboard + supervisors' daily digest** | A; days **TBD** |

**Prohibited:** editing a certification (new record instead) · recording a certification without the grade and photo proof for every component the station requires (default exam and tech val) · assigning to a store owner (none exists) · leaving an expiring item without a task.
**Audit events:** CERT.WARNING_RAISED, .EXPIRED, EXPIRY_TASK.CREATED, .ASSIGNED, .SCHEDULED, .COMPLETED, .FLAGGED.
**Historical records:** certifications never overwritten; `supersedes_id` chain; status_history on tasks; month snapshot includes proficiency counts.
**Open:** warning window and flag days; task grouping when one exists; visit purpose for expiry visits; task state names.

---

## WF-014 Cross-training record (supporting; §5.10, D057–D060)

**States:** Recorded → Passed | Not passed (**TBD**: the Handover defines only the pass outcome).
| # | Transition | Actor | Required fields and validation | Side effects | Tag |
| --- | --- | --- | --- | --- | --- |
| 1 | (record) → Recorded | **any Training Officer** (D059) | employee, station; **exam grade and tech val grade with photo proof of both** (private Drive); every component the station requires (D064); **Early check:** if before the eligibility months after regularization (default 6, Admin) → warning + short remark required, **no approval** (D060) | photos linked as `FIL-` records | A |
| 2 | Recorded → Passed | system | final = proposed average of exam and tech val against the station mark (89/90) — **rule to confirm (§11)** | **cross-training certification added** to the matrix, `valid_until` from station validity; previous certification for the station closed | A; formula TBD |
**Prohibited:** saving without grades and photo proof for each required component · treating the eligibility months as a block (D060) · assigning stations from TDMS (SOD handles it, D059).
**Audit/history:** CERT.CROSS_TRAINING_RECORDED, early flag and remark kept in history and shown on the matrix cell.

---

## WF-006 Month-end close (MOD-012/013) — ENT-105, 106, 100–103, 090, 081

**States:** Open → (Closing†) → Closed → Reopened → (Closing†) → Closed. The Handover defines Open, Closed and **reopen**; **Closing** is a proposed transient state because a snapshot job can exceed one script run (PROP-003, I).

| # | Transition | Actor | Required fields and validation | Side effects | Notifications | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Open → Closing | **Supervisor** (§5.6); M, Sr, A **TBD (AMB-10)** | **after the 24-hour edit window of the month's last day** and **by the 5th** of the next month (D036) | job queued | none specified | A; Closing I; consequence of missing the 5th **TBD** |
| 2 | Closing → Closed | system | snapshot saved: **EXECom, KPI scorecards, visit coverage, Store Health, CAPAR status** (§5.6); rows, not one blob (DATA-MODEL P10) | snapshot immutable | none specified | A; storage design † |
| 3 | Closing → Open (job failure) | system | nothing partial persisted | — | — | I |
| 4 | Closed → Reopened | **Training Manager or Admin** (§5.6); Sr **TBD** | **written reason**, logged | month editable again | — | A |
| 5 | Reopened → Closing → Closed | as #1 | new snapshot **version**; earlier version kept | — | — | I |

**While Closed:** a change dated inside the month is recorded **with a note and appears in the next open month**; the closed snapshot never changes (D007, §5.6).
**Prohibited:** editing a closed month's records in place · changing a closed snapshot · closing before the edit window has passed · reopening without a written reason · closing out of sequence (months in order: **TBD**).
**Audit events:** MONTH.CLOSE_REQUESTED, .CLOSED, .SNAPSHOT_SAVED, .REOPENED (with reason), .LATE_CHANGE_NOTED.
**Historical records:** `month_closes` status history; snapshot versions; reports for a closed month read the snapshot.
**Open:** who besides Supervisor closes; Senior reopen; whether the 5th is a setting; month order.

---

## WF-007 Delegation (MOD-003) — ENT-029, 024, 026 (source: D015, Roles spec §6)

**States (RS):** Pending → Approved | Rejected | Cancelled; derived by dates: Scheduled → Active → Ended.

| # | Transition | Actor | Required fields and validation | Side effects | Notifications | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | (request) → Pending | S, M, Sr | delegate, role, start date ≥ today, end date, reason; delegate holds lower access; no overlapping pending/approved delegation | — | approver; shows in "awaiting approval" digest | RS, D015 |
| 2 | Pending → Approved | next-higher role: **M** for S, **Sr** for S and M, **A** for Sr; never the requester, **including through a delegated role** (†) | — | becomes Scheduled, then Active on the start date | requester | RS; † for delegated-role case |
| 3 | Pending → Rejected | approver | reason | — | requester | RS |
| 4 | Pending/Approved → Cancelled | requester | — | — | — | RS |
| 5 | Active → Ended (early) | requester, M (for S), A (any) | reason | access removed **at once** | delegate | RS; acceptance §12 |
| 6 | Active → Ended (date) | system | end date passed | access removed | — | RS |
| 7 | any → Ended | system | either user deactivated (D042) | access removed | — | I |

**While Active:** effective roles = own + delegator's; "Acting as …" banner from the start date; audit rows use the delegate's own ID with `acting_as_role` and `delegation_id` (†); not re-delegable and FLAG-001 not delegated (not approved, implemented as deny).
**Prohibited:** self-approval · overlap · delegating a role to a user whose access is not lower · re-delegation · cached grants after ending.
**Audit events:** DELEGATION.REQUESTED, .APPROVED, .REJECTED, .CANCELLED, .STARTED, .ENDED.
**Historical records:** status_history on the delegation; actions taken while active stay attributable.

---

## WF-008 Employee deactivation (MOD-002) — ENT-022, 114, 115, 060, 072

**States:** Active → Deactivation requested → Deactivated (Active and Deactivated are system statuses). Reactivation: **TBD**.

| # | Transition | Actor | Required fields and validation | Side effects | Notifications | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Active → Deactivation requested | requester role **TBD (AMB-15)**; a Supervisor **cannot deactivate directly** (E-03) | employee, reason | approval request | Admin ("awaiting approval") | A (E-03); requester TBD |
| 2 | Requested → Active (rejected) | Admin | reason | — | requester | I |
| 3 | Requested → **Deactivated** | **Admin** (E-03) | reason | employee hidden from new entry; history, certifications and past records kept; **open items go to the supervisor queue (WF-013)**: their open TL enrollment, expiry tasks that reference their certifications, other open enrollments (D042) | supervisors (queue) | A |
**Prohibited:** direct deactivation by a Supervisor · deleting a referenced employee (only deactivation; delete only if unreferenced, §7.9) · losing history · silently dropping open items.
**Audit events:** EMPLOYEE.DEACTIVATION_REQUESTED, .DEACTIVATED, .REJECTED.
**Historical records:** status_history; assignments and certifications preserved; "as of" reports still show the employee.
**Open:** requester role; reactivation; whether a linked TDD user account is deactivated with the employee (not stated).

## WF-011 Store (location) deactivation (MOD-001) — ENT-012, 115

**States:** Active → Deactivated (location status; Store type counts in visits/coverage/Store Health, D045).
| # | Transition | Actor | Required fields and validation | Side effects | Notifications | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Active → Deactivated | master-data editors (M, Sr, A per PERMISSIONS); **approval path not stated** | reason, effective date† | hidden from new plans and entries; **open visit plans, expiry tasks, CAPAR cases for the store go to the supervisor queue** (D042); past visits and cases unchanged | supervisors (queue) | A (D042); who and approval **TBD** |
**Prohibited:** deleting a store that records point to (§7.9) · rewriting past visits or Store Health history · closing items silently.
**Open:** treatment of employees, TL and trainee enrollments tied to the store (store closure/transfer links are Audit W16, **not approved**); whether a deactivated store leaves coverage.
**Audit events:** LOCATION.DEACTIVATED. **History:** status_history on the location; past visits keep the location ID.

## WF-012 TDD user deactivation (MOD-003) — ENT-024, 029, 030, 115

**States:** Active → Deactivated.
| # | Transition | Actor | Required fields and validation | Side effects | Notifications | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Active → Deactivated | **Admin** (RS) | reason; cannot deactivate self; cannot remove the last active Admin | sign-in blocked; sessions ended; delegations ended; **open plans, expiry tasks, TL enrollments, CAPAR cases go to the supervisor queue** (D042); past records keep the user ID and still show the name | supervisors (queue) | A (D042), RS |
**Prohibited:** self-deactivation · deactivating the last Admin · deleting a referenced user · reassigning silently.
**Audit events:** USER.DEACTIVATED, SESSION.ENDED_BY_ADMIN. **History:** status_history; created_by/updated_by links remain valid.
**Open:** whether an approval request precedes it (E-03 names employees only); reactivation.

## WF-013 Reassignment queue (supporting, D042) — ENT-115

**Item states:** Queued → Reassigned | Closed (with reason).
| # | Transition | Actor | Required fields | Side effects | Tag |
| --- | --- | --- | --- | --- | --- |
| 1 | (deactivation) → Queued | system | source record, previous owner, deactivation cause | item flagged on the supervisor queue and digest | A |
| 2 | Queued → Reassigned | S, M, Sr (Admin **TBD**) | new assignee | the item is updated through its owning service; history row | A |
| 3 | Queued → Closed | S, M, Sr | **reason** | the item is closed through its owning workflow (e.g. TL → Quit/Failed per its rules); history row | A |
**Prohibited:** leaving an item unowned and unflagged · closing without a reason. Whether the queue is a table or a view: ISS-P1-16.

## WF-009 Import with review (D022, D023, §7.7)
**States:** Uploaded → Validated → Previewed → (fix/skip rows) → Submitted → **Verified by a FLAG-001 holder** (trainee imports) → Recorded; or Rejected with reason. Nothing is saved until every row is valid or skipped. Load order: stores → employees (one-time, D025) → trainees → TLs → certifications → CAPAR history → SVMI visit history → past sessions. Records are written through the owning services; `legacy_ref` on every row. Prohibited: saving before review; verifying without the flag; duplicate rows by name only (IDs first, name proposes a match). Audit: IMPORT.UPLOADED/.VALIDATED/.SUBMITTED/.VERIFIED/.REJECTED/.RECORDED.

## WF-010 Admin edit, delete, restore (D021, §7.6)
**States:** Active → In Recycle bin (reason) → Restored (Active). Admin edit: any field with a reason. Delete hides the record from all screens and reports; restore brings it back; **referenced records cannot be deleted, only deactivated** (§7.9). Each step audited with old/new, user, time. Prohibited: deleting audit, history or snapshot rows · delete or edit without a reason.

---

## 9. Notifications named in the Handover (the only approved set)

| Event | Recipients | Channel | Source |
| --- | --- | --- | --- |
| Overdue items, items due this week, items waiting for approval | each user | one email digest every morning | §7.2, D023 |
| Unassigned expiry tasks; overdue CAPAR stages | supervisors | daily digest | §7.2, §5.4 |
| Unassigned or unscheduled expiry task past the Admin days | supervisors | dashboard + digest | §5.4 |
| CAPAR stage past its working-day target | assignee, supervisors | dashboard + digest | §5.3 |
| TL deadline within 14 days; passed deadline (red) | officer, supervisors | dashboard + digest | §5.7 |
| TL with no officer, visit or certification by its visit date | supervisors | queue + digest | §5.7 |
| Items placed in the queue by a deactivation | supervisors | queue | D042 |
| LMS question awaiting an answer | supervisors | queue | §5.5 |
Everything else (e.g. "planned visit overdue", per-transition messages) is **P or not specified** and is not built until approved.

## 10. Open items affecting workflows (details in [DECISION-GATE](DECISION-GATE.md))
ISS-P1-01 (QA endorsement meaning), ISS-P1-02 (trainee Quit/Terminate/extension/correction), ISS-P1-03 (TL formula), ISS-P1-04 (TL extension limit, quit reasons), ISS-P1-05 (cross-training rule), ISS-P1-06 (plan vs verification visit), ISS-P1-08 (expiry visit purpose), ISS-P1-10/15/19 (CAPAR targets, photos, counting), ISS-P1-11 (expiry windows), ISS-P1-16 (queue table vs view), AMB-04/05/10/14/15 (PERMISSIONS), W16 store closure links (not approved), PROP-002/003 (Cancelled, Closing).

## 11. Dependency map

### 11.1 Workflow → data entities (W = writes, R = reads; ENT ids from DATA-MODEL)

| Entity | WF-001 Trainee | WF-002 TL | WF-003 Visit | WF-004 CAPAR | WF-005 Expiry | WF-014 Cross-train | WF-006 Close | WF-007 Deleg. | WF-008 Emp deact | WF-011 Store deact | WF-012 User deact | WF-013 Queue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| persons 020 | W | R | — | — | — | R | — | — | R | — | R | — |
| employees 022 | W (Passed) | R | — | — | R | R | — | — | W | R | — | — |
| users 024 | R | R | R | R | R | R | R | W/R | — | — | W | R |
| locations 012 | R | R | R | R | R | — | R | — | — | W | — | R |
| batches 040 / trainee 041 / station results 042 | W | — | — | — | — | — | R | — | R | — | R | R |
| assessments 043 | W | W | — | — | — | W | — | — | — | — | — | — |
| TL 060–063 | — | W | R | — | — | — | — | — | R | R | R | W |
| certifications 070 / validations 071 | W (home certs) | — | — | — | W/R | W | R | — | R | — | — | — |
| expiry tasks 072 | — | — | R | — | W | — | — | — | W (queue) | W (queue) | W (queue) | W |
| visit plans 080 | — | W (TLTC) | W | W (verification plan) | W | — | R | — | — | W (queue) | W (queue) | W |
| visits 081–083 | — | R | W | W (verification visit) | — | — | R | — | — | — | — | — |
| CAPAR 090–094 | — | — | R | W | — | — | R | — | — | W (queue) | W (queue) | W |
| delegations 029 | — | — | — | — | — | — | — | W | — | — | W (ends) | — |
| month_closes 105 / snapshots 106 | — | — | — | — | — | — | W | — | — | — | — | — |
| KPI/KRA 100–103 | — | — | R | R | R | R | R | — | — | — | — | — |
| settings 001 / lookups 003 / holidays 004 | R | R | R | R | R | R | R | R | — | — | — | — |
| files 005 / email_log 007 / ai_log 008 | W (import) | — | W (reports) | W | — | W (proof) | — | — | — | — | — | — |
| approvals 114 / queue 115 | — | — | — | — | — | — | — | — | W | — | — | W |
| notifications 006 | W | W | W | W | W | — | W | W | W | W | W | W |
| status_history / record_history / audit_log 117–118 | W | W | W | W | W | W | W | W | W | W | W | W |

### 11.2 Workflow → workflow dependencies

| From | Triggers or feeds | Link |
| --- | --- | --- |
| WF-001 Trainee (Passed) | creates an employee; creates home certifications | WF-005 / WF-014 start from those certifications; WF-002 needs an employee |
| WF-002 TL | creates TLTC plans; Quit/Failed cancels them | WF-003 |
| WF-004 CAPAR | Scheduled creates a plan; Verified creates/links a visit; failures feed Store Health | WF-003 → Store Health (KPI) |
| WF-003 Visit | counts toward KPI, coverage, Store Health | WF-006 snapshot |
| WF-005 Expiry | creates tasks; scheduling uses WF-003 plans | WF-014 / certifications |
| WF-008 / 011 / 012 | place open items in WF-013; WF-012 ends WF-007 delegations | WF-013 → owning workflows (WF-002, 003, 004, 005) |
| WF-009 Import | feeds WF-001, WF-002, WF-005, WF-004, WF-003 history | owning services |
| WF-006 Close | locks months for every workflow | all |

### 11.3 Build order implied
Foundation (users, permissions, audit, history, queue) → master data and employees → **WF-003 Visit** → **WF-004 CAPAR** → **WF-001 Trainee** → **WF-002 TL** → **WF-005/014 Certification** → **WF-006 Close**. Delegation (WF-007) and deactivation (WF-008/011/012/013) belong to the foundation because every module relies on them (ROADMAP).
