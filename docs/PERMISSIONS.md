# TDMS Authorization Model v1.0

Status: **FINAL model with the open items in §11 and §12.** Server-side only: hiding a screen, menu or button is **never** authorization (Handover §7.4, RULE-006). No implementation code here.
Authority: Handover §3, §7.4, §7.6, §7.9, D002, D004, D015, D021, D023, D026, D031, D037, D040, D059, D061, D062, D067, D068, D042 > Plan Audit > Roles Access Spec v0.2 (Oct 5, pre-dates D024–D068) > prototype `CAN`/`PD` (evidence only). Requirements: [REQUIREMENTS](REQUIREMENTS.md) REQ-020..030. Data: [DATA-MODEL](DATA-MODEL.md) ENT-024..029. Workflows: [WORKFLOWS](WORKFLOWS.md).

**Cell tokens:** a role code means *allowed* · `(own)` only records the user created, inside the edit window (24 h, setting) · `(asg)` only records assigned to the user · `(scope)` only within the user's assigned stores · `(reason)` allowed only with a written reason, audited · `FLAG` requires FLAG-001 · `?` **no approved source — implemented as DENY until decided** · `—` not allowed · `n/a` the action does not exist for that module.
Role codes: **O** Training Officer (ROLE-001) · **S** Training Supervisor (ROLE-002; the Training Assistant Supervisor uses it, D004) · **M** Training Manager (ROLE-003) · **Sr** Senior Training Manager (ROLE-004) · **A** System Admin (ROLE-005) · **SH** Store Head (ROLE-006) · **AM** Area Manager (ROLE-007). **FLAG-001** = EXECom officer flag, not a role.

## 1. Roles and role scope

| Role | Main use (Handover §3) | Record scope | Accounts in v1? |
| --- | --- | --- | --- |
| O | Logs visits, sessions, validations, CAPAR verifications; certifies, extends, closes TL enrollments; edits own entries within the edit window | All brands visible; assigned brands only set defaults and notifications (D005) | Yes |
| S | Schedules and assigns work, edits any entry, approves CAPAR closures, promotes TLs, opens the restricted area | All brands | Yes |
| M | Supervisor rights plus master data, programs, targets, final approvals, delegation approvals | All brands | Yes |
| Sr | Full control of all modules, final approvals | All brands | Yes |
| A | Accounts, roles, settings, lookups, imports, audit log, data edit and delete | All, including audit log | Yes |
| SH | Views and acknowledges records of own stores; never trainee monitoring or EXECom | Assigned stores only | **No — role exists in the model from Phase 0; accounts go live in v2 (D002, §3)** |
| AM | Same as Store Head across an area | Assigned stores only | **No — as above** |

The SH and AM columns below are **provisional** (Handover text only; module list confirmed in v2). Because no SH/AM accounts exist in v1, they are enforced as deny until provisioned.

## 2. Record-level scope

| Scope | Definition | Used by |
| --- | --- | --- |
| **Own record** | `created_by = me` and `now < created_at + edit window` (server time) | O edit/remove of own entries; S, M, Sr, A are exempt (RULE-007) |
| **Assigned** | the record names me as assignee/officer (plan, case, expiry task, TL certifying officer) | O moving a plan, verifying a case, scheduling an expiry task |
| **Assigned brand** | `user_brands`. **Defaults, filters and notifications only — it never restricts access in v1** (D005, §3). The scope kind exists in the model so a future decision can use it | none restrictive |
| **Assigned store** | `user_locations` and employees/records of those locations | SH, AM (v2) |
| **All brands** | no brand or store filter | O, S, M, Sr (view and act per matrix), A (all) |
| **Delegated access** | the delegator's role added to my effective roles while a delegation is active; scope = union of effective roles | S, M, Sr delegations (§5) |
| **Training Dept only** | trainee monitoring and EXECom: TDD roles; SH/AM never (D037) | §6 |

## 3. Authorization rules (AR)

| ID | Rule | Source |
| --- | --- | --- |
| AR-01 | **Fail closed.** No explicit allow = deny. `?` cells are deny. | §7.4, instruction §10 |
| AR-02 | Identity comes only from the server session; any user id in a request payload is ignored. | §7.4 |
| AR-03 | Every API method is registered with the permission code(s) it needs; an unregistered method cannot be called. A test must enumerate all API methods against the registry. | D023, instruction §17 |
| AR-04 | Order of checks: session valid and user active → effective roles → permission granted to any effective role → scope → workflow transition allowed → month lock → write → audit. | §7.4; WORKFLOWS |
| AR-05 | **Reads are scope-filtered in the data query**, not in the UI. Lists, counts, aggregates, exports, reports, notifications and digests use the same filter. | §7.4 |
| AR-06 | A record outside the caller's scope is answered as "not found" (†, so existence is not leaked); a record in scope but action not allowed is FORBIDDEN. | design † |
| AR-07 | Each user holds exactly one role; extra access only from an approved delegation. | §3, D015 |
| AR-08 | The permission matrix is data, edited only through Configuration, every change audited with old/new and reason; effective on the next request. | §7.4 |
| AR-09 | **Self-protection:** a user cannot change own role, deactivate self, approve own delegation, or remove the last active Admin. | Roles spec §9 |
| AR-10 | Edit-window rule: O edits/removes only own entries inside the window; S+ and A may still edit; the window is a setting (CFG-004). | §3, §7.4 |
| AR-11 | Sensitive actions require a written reason: Admin edit/delete/restore, month reopen, role change, FLAG change, deactivation approval, password reset. | §7.6, D021 |
| AR-12 | Files: opened or downloaded only through TDMS after a role/category check **on every request**; never by link. | D027 |
| AR-13 | A closed month rejects writes dated inside it; the change is recorded with a note in the next open month. | D007, RULE-145 |
| AR-14 | No role is invented and no matrix cell is widened without a decision in [DECISIONS](DECISIONS.md). | instruction §14 |

## 4. System Admin powers (and limits)

**Has (Handover §3, D021, Roles spec):** create/edit users, roles, brands; temporary password and clear cooldown; set/clear FLAG-001; settings, lookups, holiday list, imports (HR one-time import); view the whole audit log; edit and delete business data **with reason, to the Recycle bin, restorable**; restore; approve deactivation requests (E-03); keeps the approval rights in the Roles spec (close CAPAR, approvals queue, approve a Senior's delegation) — the Audit's "Admin loses approval rights" (W14) was **not** approved.
**Does not have:** logging field work (visits) — "Admin does not log field work" (Roles spec); edit or delete of audit log, status/record history or month snapshots; certify or promote (not stated, `?`); changing own role, deactivating self, removing the last Admin (AR-09); viewing password hashes. Admin actions are visible to the Senior Training Manager in the audit view (§7.9).

## 5. Delegation and acting-as

| # | Rule | Source |
| --- | --- | --- |
| DL-01 | Request: S, M or Sr, start date ≥ today, delegate holds lower access, no overlapping pending/approved delegation. | Roles spec §6 |
| DL-02 | Approval: by the next-higher role (S's by M, M's by Sr, Sr's by A). Nobody approves a delegation they requested, **including through a role they hold only by delegation** (†). | Roles spec §6; † |
| DL-03 | States: Pending → Approved / Rejected / Cancelled; derived Scheduled / Active / Ended. Ending (early or by date) removes access at once. | Roles spec §6, D015 |
| DL-04 | While Active, the delegate's **effective roles = own role + delegator's role**; scope = union. The delegate keeps own access. | D015 |
| DL-05 | **Acting-as behaviour:** the UI shows an "Acting as …" banner; effective roles are recomputed **on every request** (no cached grants) so ending takes effect immediately. | Roles spec §6 |
| DL-06 | **Audit while acting-as:** the actor is the delegate (own user id and Employee ID, never the delegator's), plus `acting_as_role` and `delegation_id` on the row (†). | §7.4, †  |
| DL-07 | Not re-delegable; FLAG-001 is not delegated. Both recommended, **not approved** (W18 and INFERRED); implemented as deny. | AMB-14 |
| DL-08 | Deactivating either party ends the delegation. | D042 |

## 6. EXECom access (FLAG-001)

- The flag is orthogonal to role: **it grants exactly one capability** — verify, commit or reject a trainee import (D037, WF-009). It confers no view rights; trainee monitoring and EXECom visibility come from the role (TDD roles; never SH/AM).
- Set and cleared only by A, with reason, audited; only on TDD users; at least one holder must exist (prototype rule, kept as a guard).
- Not delegable (DL-07). Whether a submitter may verify their own import is not decided (AMB-12).

## 7. Audit requirements

Every authenticated action writes an `audit_log` row (ENT-117) with: user id, Employee ID, role, `acting_as_role` and `delegation_id` when delegated, time (UTC), entity, record id, action, old/new values (≤ 50,000 chars), and **reason** for the AR-11 actions. Also logged: sign-in success and failure, lockout, password reset, role and permission-matrix changes, FLAG changes, delegation lifecycle, file open/download, report exports, and **denied attempts** (FORBIDDEN/out of scope, †). The log is immutable (nobody edits or deletes it), archived yearly past ~50,000 rows, viewable by A and Sr, and **viewing it is itself audited** (†).

## 8. Complete permission matrix (module × action)

Definitions of the actions: **view** read · **create** add a record · **edit** change a record · **delete** remove to the Recycle bin (never physical delete; D021) · **approve** decide a request or stage that needs higher authority · **verify** confirm a fact or stage (CAPAR verification, import verification) · **certify** declare a certification or pass · **promote** TL promotion · **restore** bring back a deleted record or reopen a closed state · **configure** change that module's settings/lists · **administer** account-, flag- or lifecycle-level control.
Rule for Admin edits: D021 lets A edit/delete business data as a correction with a reason; this is shown as `A(reason)`, not as operational authority.

| Module | view | create | edit | delete | approve | verify | certify | promote | restore | configure | administer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Master data** (brands, locations/stores, regions, positions, stations, programs) | O S M Sr A; SH AM (scope) | M Sr A | M Sr A | A(reason) | n/a | n/a | n/a | n/a | A | n/a | n/a |
| **Person / Employee** | O S M Sr A; SH AM (scope) | A (HR import); single add `?` (AMB-04) | `?` (AMB-04); A(reason) | A(reason), only if unreferenced | A (deactivation) | n/a | n/a | n/a | A | n/a | A (deactivate, reactivate) |
| **Users, roles** | A | A | A | n/a | n/a | n/a | n/a | n/a | A | n/a | A (temp password, cooldown, FLAG, deactivate) |
| **Visits** (log) | O S M Sr A; SH AM (scope) | O S M Sr | O(own) S M Sr; A(reason) | O(own); A(reason) | n/a | n/a | n/a | n/a | A | n/a | n/a |
| **Visit plans / Calendar** | O S M Sr A; SH AM `?` | O(own) S M Sr | move: O(asg or own) S M Sr; reassign: S M Sr; A `?` | O(own); A(reason) | n/a | n/a | n/a | n/a | A | n/a | n/a |
| **Store Health** | O S M Sr A; SH AM (scope) | n/a (computed) | n/a | n/a | n/a | n/a | n/a | n/a | n/a | A (versioned settings) | n/a |
| **CAPAR** | O S M Sr A; SH AM `?` | O S M Sr | findings/photos: O(asg) S M Sr; A(reason); schedule verification: S M Sr A, O `?` (AMB-05) | A(reason) | close case: S M Sr A | mark Verified; send to QA: O(asg) S M Sr A | n/a | n/a | A | A (stage targets, QA address, lists) | n/a |
| **Trainees** | O S M Sr A; SH AM — | enroll: O(own) S M Sr; batch: S M Sr, O `?` (AMB-06) | grades/dates: O(own) S M Sr; A `?`; pass below mark or correct final status: `?` (AMB-06) | A(reason) | n/a | n/a | n/a (Passed follows the station rules) | n/a | A | A (durations, components, pass marks, station plans) | n/a |
| **Trainee import / EXECom** | O S M Sr A; SH AM — | submit: O S M Sr; A `?` | fix rows before submit: submitter | n/a | n/a | verify, commit, reject: FLAG | n/a | n/a | n/a | n/a | set FLAG-001: A |
| **Team Leaders** | O S M Sr A; SH AM — | enroll, entry grades: O(own) S M Sr; A `?` | extend, close, quit: O S M Sr; return to probation: S M Sr; A `?` | A(reason) | n/a (no TL approval, D067) | n/a | O S M Sr; A `?` (AMB-02) | S M Sr; A `?` (AMB-02) | A | A (probation, pass mark, weights, quit reasons) | n/a |
| **Proficiency / certification** | O S M Sr A; SH AM (scope) | record validation, cross-training: O S M Sr | A(reason) only (renewal = new record) | A(reason) | n/a | n/a | O S M Sr | n/a | A | A (validity, warning window) | n/a |
| **Expiry tasks** | O(asg) S M Sr A | system | assign: S M Sr; A `?`; schedule: O(asg) S M Sr | n/a | n/a | n/a | n/a | n/a | n/a | A (windows, flag days) | n/a |
| **Training sessions & attendance** | O S M Sr A | O S M Sr A | O(own) S M Sr A | O(own); A(reason) | n/a | n/a | n/a | n/a | A | A (types, programs list) | n/a |
| **Library** | O S M Sr A; restricted files S M Sr A; SH AM `?` | O S M Sr A | O(own upload); Sr A (restricted); others `?` | A(reason) | n/a | n/a | n/a | n/a | A | A (categories, file types, view/upload roles) | n/a |
| **LMS help** | O S M Sr A; SH AM `?` | ask: `?` (AMB-13) | answer, publish FAQ: S M Sr; A `?` | A(reason) | n/a | n/a | n/a | n/a | A | n/a | n/a |
| **KPI / KRA** | own scorecard: O; all: S M Sr; A (view) | targets: S M; Sr A `?` | scorecards: S M Sr; attendance log: S, M Sr `?`; survey import: `?` (AMB-09) | A(reason) | n/a | n/a | n/a | n/a | A | A (KRA weights, bands) | n/a |
| **Month close / snapshots** | O S M Sr A | n/a | n/a | n/a | close: S, M Sr A `?` (AMB-10) | n/a | n/a | n/a | reopen: M A (§5.6), Sr `?` | A (deadline, if configurable) | n/a |
| **Reports / dashboards** | O S M Sr A; SH AM `?` | generate Daily Activities, Store Visit Report: S M Sr; O `?` | n/a | n/a | n/a | n/a | n/a | n/a | n/a | A (headers, sign-offs) | n/a |
| **Approvals queue / reassignment** | S M Sr A | system or requester | resolve queue items: S M Sr; A `?` | n/a | per item (see rows above) | n/a | n/a | n/a | n/a | n/a | n/a |
| **Delegation** | own; A all | S M Sr (request) | requester cancels; ends early: requester, M (S's), A (any) | n/a | M (S), Sr (S, M), A (Sr) | n/a | n/a | n/a | n/a | n/a | n/a |
| **Notifications / digest** | own, all roles | system | own read state | n/a | n/a | n/a | n/a | n/a | n/a | A (digest time, if decided) | n/a |
| **Configuration** (settings, lookups, holidays) | M Sr A (view); S `?` | A | A | n/a | n/a | n/a | n/a | n/a | n/a | A | n/a |
| **Permission matrix** | A; Sr `?` | n/a | editor `?` (AMB-01); recommended A | n/a | n/a | n/a | n/a | n/a | n/a | editor `?` (AMB-01) | n/a |
| **Audit log** | Sr A | system | nobody | nobody | n/a | n/a | n/a | n/a | n/a | n/a | A (archive) |
| **Recycle bin / data correction** | A | n/a | n/a | A (purge, audited) | n/a | n/a | n/a | n/a | A | n/a | A |
| **Files (Drive)** | by category/role, checked on every request | via the owning record's create right | n/a | A | n/a | n/a | n/a | n/a | A | n/a | n/a |

SH and AM: every cell above is provisional (v2). In v1 the only SH/AM rows are deny.
Fine-grained capability codes (PERM-nnn, used as `permission_code` in `role_permissions`) are in Appendix A.

## 9. Permission rules requiring shared server logic

One shared authorization service (not per-module copies) must provide:

| ID | Shared logic | Why shared |
| --- | --- | --- |
| SL-01 | `effective roles` resolver: own role + active delegations, recomputed per request | acting-as, immediate end of delegation |
| SL-02 | Scope resolver: all / assigned store / assigned / own+window / delegated union, returned as a data filter the repository applies | AR-05; same filter for lists, counts, exports, reports |
| SL-03 | Permission lookup against `role_permissions` (versioned, effective-dated) | one permission system (D023) |
| SL-04 | Edit-window evaluator on server time | RULE-007 |
| SL-05 | Workflow transition guard (who may move a record from state X to Y) | WORKFLOWS WF-001..010 |
| SL-06 | Month-lock guard and "record in next open month" handling | RULE-144/145 |
| SL-07 | Self-protection guard: own role, self-deactivation, own-delegation approval (including through delegated roles), last-Admin | AR-09 |
| SL-08 | Reason-required guard for sensitive actions | AR-11 |
| SL-09 | FLAG-001 check for import verification; flag changes audited | D037 |
| SL-10 | File access check on every open/download | D027 |
| SL-11 | Audit writer used by every service, including denied attempts, with acting-as fields | §7 |
| SL-12 | Cross-module side effects run with the **acting user's** authority (CAPAR "Verified" creating the verification visit; trainee Passed creating the employee; import commit writing through owning services) and record the actor | D038, D062, WF-009 |
| SL-13 | Calendar move rule: officers move only their own plans; S+ any | D040 |
| SL-14 | Notification and digest recipient filter: never send a record to someone out of its scope | AR-05 |
| SL-15 | Out-of-scope response policy (not found vs forbidden) | AR-06 |

## 10. Source conflicts (resolved by authority order unless marked)

| # | Conflict | Resolution |
| --- | --- | --- |
| CON-01 | Roles spec: Certify = Approve (S+); D067: officer certifies, no approval | D067 wins |
| CON-02 | Roles spec: promotion M/Sr only; prototype `finalApprove`; D031: Supervisor or higher | D031 wins; "higher" vs Admin open (AMB-02) |
| CON-03 | Prototype gives S/M/Sr view+configure on Configuration; Handover gives settings to Admin and master data/programs/targets to Manager | OPEN (AMB-07) |
| CON-04 | Targets: Roles spec Admin edits; prototype Admin view; §5.9 "Supervisors or Managers" | §5.9 wins for S, M; Sr and A `?` (AMB-08) |
| CON-05 | Roles spec: officer cannot schedule CAPAR verification; D061 lets officers plan visits from a CAPAR case | OPEN (AMB-05) |
| CON-06 | "Admin does not log field work" vs Roles-spec Admin edit on TL/CAPAR/sessions | Admin edits are corrections with reason (D021) |
| CON-07 | Roles spec 5 role columns; Handover 7 | Handover wins; SH/AM provisional |
| CON-08 | Prototype: SH/AM see 5 screens; Handover: "records of own stores" | OPEN, v2 (AMB-11) |
| CON-09 | Prototype demo role switcher | REMOVED (§7.4) |
| CON-10 | Earlier baseline notes said month reopen had no actor; §5.6 names Manager or Admin (RULE-146) | §5.6 wins; corrected in the gate and data model |

## 11. Permission ambiguities (all deny until decided)

| ID | Ambiguity | Recommended decision | Blocks |
| --- | --- | --- | --- |
| AMB-01 | Who may edit the permission matrix (§7.4 says "in Configuration") | A only, with reason, audit and last-Admin guard | 1D authorization slice |
| AMB-02 | Does D031 "Supervisor or higher" include System Admin; may Admin certify/promote TLs | Follow the Roles spec for Admin (no promote) unless Leo says otherwise | PERM-034, TL slice |
| AMB-03 | Admin access to trainee monitoring and EXECom (D037 excludes SH/AM explicitly; Admin silent) — matrix shows Admin view as allowed (§3 scope "All"; D002 TDD roles) | Confirm | none (view only) |
| AMB-04 | Who creates/edits a single employee (D025 says "TDD maintains" but names no role) | S M Sr A | 1F single-employee screens (HR import by A unaffected) |
| AMB-05 | May officers schedule a CAPAR verification (CON-05) | Yes, assigned officer (follows D061/D062) | CAPAR slice |
| AMB-06 | Who creates a batch; who passes a trainee below the mark or corrects a final status (§11 text: supervisor records another result) | Batch: S M Sr; correction: S M Sr with remark | Trainee slice |
| AMB-07 | Settings view/configure for S, M, Sr (CON-03) | Admin configures; M Sr view; S per Leo | Configuration screens |
| AMB-08 | Targets: Sr and Admin | Sr yes (full control); Admin view only | KPI slice |
| AMB-09 | Coaching survey import and team attendance log: who | Attendance log: S (§5.9 "a supervisor"); survey: S M after the source is decided | KPI slice |
| AMB-10 | Who may close a month besides Supervisor; Senior reopen | Close: S M Sr; reopen: M A as §5.6, Sr per Leo | Month-close slice |
| AMB-11 | SH/AM visible modules and the undefined "acknowledge" action | Defer to v2 | none in v1 |
| AMB-12 | May the submitter of a trainee import also verify it | No (segregation) — not in the Handover | Import slice |
| AMB-13 | LMS: who may ask a question | Any signed-in TDD user | LMS slice |
| AMB-14 | Delegation: re-delegation and delegating FLAG-001 | Deny both | Delegation slice |
| AMB-15 | Who may request a deactivation (Admin approves, E-03) | S M Sr request; A approves | Deactivation workflow (1E) |
| AMB-16 | Admin corrections inside a closed month (D021 vs D007) | Allowed with reason, recorded in the next open month (RULE-145) | Month-close slice |

## 12. Remaining blockers

- **Before Phase 0 (repo bootstrap):** none from authorization.
- **Before the authorization slice (1D):** **AMB-01** (matrix editor) and **AMB-02** (Admin and "higher") — gate item G-06. All other `?` cells are safe because they default to deny.
- **Before the named module slice:** AMB-15 (1E deactivation), AMB-04 (1F single-employee edit), AMB-05 (CAPAR), AMB-06 and AMB-12 (Trainee/Import), AMB-08, 09 (KPI), AMB-10 (Month close), AMB-13 (LMS), AMB-14 (Delegation).
- **Not blockers:** AMB-03, AMB-07, AMB-11, AMB-16.

**AUTHORIZATION BLOCKERS FOR PHASE 0: NO. FOR THE AUTHORIZATION SLICE: YES (AMB-01, AMB-02).**

## Appendix A. Capability codes (`permission_code`)

Fine-grained codes used by `role_permissions`. The §8 matrix is the module view of the same rules; where they differ, §8 is current (it applies D021 for Admin edits and §3 "All" scope for Admin view).

| PERM | Capability | O | S | M | Sr | A | SH | AM | Source / note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Visits & Calendar** | | | | | | | | | |
| PERM-010 | Log visit | Y | Y | Y | Y | — | — | — | Roles spec; Admin "does not log field work" |
| PERM-011 | Edit visit | Own | Y | Y | Y | Y (reason) | — | — | §3, D021 |
| PERM-012 | Plan a visit (any store screen) | Own | Y | Y | Y | — | — | — | D061, Roles spec |
| PERM-013 | Move a plan to another date | Asg/Own | Y | Y | Y | ? | — | — | D040; Admin not stated |
| PERM-014 | Reassign a plan's officer | — | Y | Y | Y | — | — | — | Roles spec |
| PERM-015 | View visits, calendar, boards | Y | Y | Y | Y | Y | ? | ? | Roles spec; SH/AM: §3 says "records of own stores" but prototype limits to 5 screens |
| **CAPAR** | | | | | | | | | |
| PERM-020 | Open case | Y | Y | Y | Y | — | — | — | D030 (O or S; M/Sr inherit) |
| PERM-021 | Schedule verification | ? | Y | Y | Y | Y | — | — | **Conflict** Roles spec (O "—") vs D061 (officers plan visits from a CAPAR case) |
| PERM-022 | Mark Verified (creates verification visit) | Asg | Y | Y | Y | Y | — | — | Roles spec, D062 |
| PERM-023 | Send report to QA / record endorsement | Asg | Y | Y | Y | Y | — | — | Roles spec "verify/endorse"; endorsement semantics open (ISS-P1-01) |
| PERM-024 | Close case | — | Y | Y | Y | Y | — | — | §3, Roles spec |
| PERM-025 | Edit finding blocks / photos | Asg | Y | Y | Y | ? | — | — | INFERRED |
| **Team Leaders** | | | | | | | | | |
| PERM-030 | Enroll TL, record entry grades | Own | Y | Y | Y | Y (edit) | — | — | §5.7, Roles spec |
| PERM-031 | Certify, extend, close | Y | Y | Y | Y | ? | — | — | **D067** (no approval) |
| PERM-032 | Record quit | Y | Y | Y | Y | ? | — | — | D068 |
| PERM-033 | Return TL to Probationary | — | Y | Y | Y | ? | — | — | §5.7 step 4 |
| PERM-034 | Promote | — | Y | Y | Y | ? | — | — | **D031** ("Supervisor or higher": does "higher" include Admin? ISS-P0-06) |
| PERM-035 | Uniform transactions | Y | Y | Y | Y | ? | — | — | INFERRED |
| **Trainees / EXECom** | | | | | | | | | |
| PERM-040 | View trainee monitoring, EXECom | Y | Y | Y | Y | Y† (AMB-03) | **—** | **—** | D037, RULE-009 |
| PERM-041 | Enroll trainee / edit grades | Own | Y | Y | Y | ? | — | — | Roles spec; prototype `tCanEdit` |
| PERM-042 | Create batch | ? | Y | Y | Y | ? | — | — | **Conflict** Roles spec (officer C) vs prototype (supervisor only) |
| PERM-043 | Adjust one trainee's milestone dates | Y (logged) | Y | Y | Y | ? | — | — | §6.1 |
| PERM-044 | Submit import for verification | Y | Y | Y | Y | ? | — | — | D022 |
| PERM-045 | Verify / commit / reject import | FLAG-001 only | FLAG-001 only | FLAG-001 only | FLAG-001 only | FLAG-001 only | — | — | D037 |
| PERM-046 | Pass a trainee below the mark / correct a final status | ? | ? | ? | ? | ? | — | — | prototype only (supervisor); Handover: supervisor records "another result" at Training End |
| **Proficiency** | | | | | | | | | |
| PERM-050 | Record proficiency / cross-training | Y | Y | Y | Y | Y (edit) | — | — | D059 ("any Training Officer") |
| PERM-051 | View proficiency matrix | Y | Y | Y | Y | Y | V (scope) | V (scope) | Roles spec; prototype VSCR |
| PERM-052 | Assign expiry task | — | Y | Y | Y | ? | — | — | D026, §5.4 |
| PERM-053 | Schedule an assigned expiry task | Asg | Y | Y | Y | ? | — | — | §5.4 |
| **Training, library, LMS** | | | | | | | | | |
| PERM-060 | Create/edit training sessions | Own | Y | Y | Y | Y | — | — | D032, Roles spec |
| PERM-061 | Programs and master data | V | V | Y | Y | Y | — | — | Roles spec, §3 |
| PERM-070 | Upload library files | Y | Y | Y | Y | Y | — | — | Roles spec |
| PERM-071 | View restricted files | — | V | V | V/E | V/E | — | — | Roles spec; open via TDMS only (D027) |
| PERM-072 | Answer LMS question, publish FAQ | — | Y | Y | Y | ? | — | — | §5.5 |
| PERM-073 | View library / LMS | Y | Y | Y | Y | Y | V | V | prototype VSCR |
| **KPI** | | | | | | | | | |
| PERM-080 | My scorecard (read only) | Own | — | — | — | — | — | — | D011, 040 |
| PERM-081 | View/edit all scorecards | — | Y | Y | Y | V | — | — | Roles spec |
| PERM-082 | Set monthly targets | — | Y | Y | ? | ? | — | — | §5.9 (S or M); Roles spec adds Sr, A; prototype A = view only |
| PERM-083 | Mark team attendance log | — | Y | ? | ? | — | — | — | §5.9 ("a supervisor") |
| PERM-084 | Import coaching survey | ? | ? | ? | ? | ? | — | — | form/owner undefined |
| **Month close, reports** | | | | | | | | | |
| PERM-090 | Close month | — | Y | ? | ? | ? | — | — | §5.6 ("A Supervisor") |
| PERM-091 | Reopen month (reason logged) | — | — | Y | ? | Y | — | — | §5.6 ("Training Manager or Admin") |
| PERM-120 | View reports / export | Y | Y | Y | Y | Y | ? | ? | D013; SH/AM undefined |
| PERM-121 | Generate Daily Activities / Store Visit Report | ? | Y | Y | Y | — | — | — | §7.1; who may generate team-wide Daily Activities undefined |
| **Approvals & delegation** | | | | | | | | | |
| PERM-100 | Approvals queue | — | Y | Y | Y | Y | — | — | Roles spec, "Not approved" row in §4 |
| PERM-101 | Request delegation | — | Y | Y | Y | — | — | — | Roles spec §6 |
| PERM-102 | Approve delegation | — | — | Y (S requests) | Y (S, M) | Y (Sr) | — | — | Roles spec §6; nobody approves own |
| PERM-103 | End delegation early | — | requester | requester, M | requester | Y | — | — | Roles spec §6 |
| **Administration** | | | | | | | | | |
| PERM-110 | Create/edit users, roles, brands | — | — | — | — | Y | — | — | Roles spec; no self-role-change |
| PERM-111 | Temporary password, clear cooldown | — | — | — | — | Y | — | — | Roles spec §7 |
| PERM-112 | Settings, lookups, rules | — | — | ? | — | Y | — | — | §3: Admin settings; M "master data, programs, targets"; **prototype gives S/M/Sr `vc`** |
| PERM-113 | View audit log | — | — | — | V (incl. all Admin actions) | Y | — | — | §7.9 |
| PERM-114 | Admin edit with reason / delete to Recycle bin / restore | — | — | — | — | Y | — | — | D021 |
| PERM-115 | Request deactivation of employee/store/TDD user | ? | ? | ? | ? | Y | — | — | E-03: "Admin-approved request"; requester role undefined |
| PERM-116 | Reassign/close items from a deactivation | — | Y | Y | Y | ? | — | — | D042 ("supervisor queue") |
| PERM-117 | Set FLAG-001 (EXECom officer) | — | — | — | — | Y | — | — | D037 |
| PERM-118 | Edit the permission matrix | ? | ? | ? | ? | ? | — | — | §7.4 "edited in Configuration"; **editor undefined** |
| PERM-130 | Open/download a stored file | by category/role rule, checked per request | | | | | | | D027 |
