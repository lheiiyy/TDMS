# TDMS Prototype Inventory (Deliverable A)

Status: DRAFT for review · Date: 2026-10-07 · Authority: Prototype = Authority 4 (evidence, not requirement)

## 0. How to read this

**Source inspected:** `TRAINING_AND_DEVELOPMENT_WORKSPACE-handoff.zip` (Claude Design export). Read directly: `tdms-store.js` (125 KB, the whole rules/data layer), `Roles Access Spec.dc.html`, the screen files' store calls, the modal routing in `TDMS.dc.html`, and the Handover/Audit. **Not** read line by line: the visual markup of each `*.dc.html` screen, `support.js` (the design-tool runtime), and the two SVMI Command Center files (a separate earlier app). Field-level form inventories per screen are therefore **not yet complete** (see §6, Coverage gaps).

**Classification tags** (never silently upgraded):

| Tag | Meaning |
| --- | --- |
| CONFIRMED | Explicitly supported by the Handover (cites DEC/section) or another approved source |
| PROTOTYPE | Exists in the prototype; not an approved requirement |
| INFERRED | Reasoned from structure/behaviour; needs approval |
| TBD | Insufficient evidence |

Disposition (KEEP CONCEPT / KEEP UX / REDESIGN UX / REBUILD LOGIC / REMOVE / DEFER / UNKNOWN) is in `GAP-MATRIX.md`, not here.

`Dnnn` = Handover decision `Dn` (see `DECISIONS.md`).

---

## 1. Modules (item 1)

The prototype has no module registry; modules are inferred from navigation and the store. Handover §1 refers to modules M0–M9 from the Project Plan.

| ID | Module | Prototype evidence | Tag |
| --- | --- | --- | --- |
| MOD-001 | Core / master data (brands, stores, positions, stations, lookups) | `MasterData`, `Config`, `Stores` screens; `data.cfg.lists` | CONFIRMED (Plan M0, D045) |
| MOD-002 | Person / Employee | `Employees`, `Trainee` (TEMP IDs), `staffFor()` creates staff on Passed | CONFIRMED (D003, 024, 025, 038, 044) |
| MOD-003 | Sign-in, users, roles, delegation | `Login`, `Admin`, `Team`; `delegations`, `USERS` | CONFIRMED (D015, 024) |
| MOD-004 | Store visits + Calendar | `LogVisit`, `Calendar`, `Boards` (visit tab) | CONFIRMED (D017, 028, 061) |
| MOD-005 | Store Health (risk score) | `risk()` in store; `Stores`, `Boards`, `Reports` | PROTOTYPE logic; CONFIRMED concept. Formula superseded by D029 |
| MOD-006 | CAPAR | `Capar`, `Boards` (CAPAR tab), `capars` | CONFIRMED |
| MOD-007 | Trainee monitoring + EXECom | `Trainee`, `ExecResults`, `ExecomReport` | CONFIRMED (D037) |
| MOD-008 | Team Leader program | `TeamLeaders`, `tl-*` modals | CONFIRMED |
| MOD-009 | Proficiency / cross-training / expiry | `Proficiency`, `cert-edit` modal | CONFIRMED concept; expiry tasks NOT in prototype |
| MOD-010 | Training sessions | `Training`, `session-new`, `session-complete` | CONFIRMED (D032) |
| MOD-011 | Library + LMS | `Library`, `LMS` | CONFIRMED (D014) |
| MOD-012 | KPI / KRA | `KpiMonitor`, `kra-edit`, `kpi-targets`, `KPI` sample array | CONFIRMED (D033, 034) |
| MOD-013 | Dashboards, reports, digest | `Dashboard`, `Reports` | CONFIRMED |
| MOD-014 | Approvals + notifications | `Approvals`, `T.notifications()` | CONFIRMED |
| MOD-015 | Admin: config, audit, recycle bin, import | `Admin`, `Config`; **no recycle bin, no audit viewer beyond `AuditTable`** | CONFIRMED (D021) |
| MOD-016 | Boards (stage tracker + workload) | `Boards`, `Kanban` | CONFIRMED (D040) |

## 2. Screens and navigation (items 2, 3)

**Navigation (PROTOTYPE, `T.nav()`)** — role-filtered groups:

| Group | Items |
| --- | --- |
| Overview | Dashboard, Calendar |
| Field work | Log visit, Boards, Stores |
| Programs | CAPAR, Team Leaders, Training, Proficiency |
| Insights | Reports, Library |
| Restricted (supervisor+) | Approvals, KPI monitoring, Admin (admin only) |
| Records (added by later patch) | Employees, Trainee monitoring (hidden from Store Head/Area Manager) |

Other routable screens: `team` (T&D Team), `lms`, `config`, `store` (detail), `trainees`.

**Screen files** (one per `*.dc.html`; size in bytes; Tag PROTOTYPE unless noted):

| SCREEN | File | Size | Store calls used (evidence) |
| --- | --- | --- | --- |
| SCREEN-001 | Login | 13,289 | signIn, requestReset, resetPassword, changePassword, demoUsers |
| SCREEN-002 | Dashboard | 15,327 | notifications, risk, moveCard, removeCard |
| SCREEN-003 | Calendar | 21,096 | moveCard, rescheduleCard/Capar/TL/Session, cardPerm, tlPending |
| SCREEN-004 | LogVisit | 22,436 | logVisit, syncDrafts, discardDraft, risk |
| SCREEN-005 | Boards | 10,864 | moveCard, reassign, removeCard, risk, cardPerm |
| SCREEN-006 | Stores | 24,045 | risk, toggleStore, pendingReq, csv, setBrands |
| SCREEN-007 | Employees | 17,072 | requestDeactivation, tHistoryFor, csv |
| SCREEN-008 | Team (T&D team) | 11,890 | delStatus, findUser |
| SCREEN-009 | Capar | 8,692 | moveCapar, csv |
| SCREEN-010 | TeamLeaders | 6,510 | moveTL, tlCertResult, tlFinalAvg, tlPending |
| SCREEN-011 | Training | 10,138 | csv, rule |
| SCREEN-012 | Trainee | 31,085 | addTrainee, importPreview/Submit/Commit/Reject, passTrainee, setTraineeStatus |
| SCREEN-013 | Proficiency | 6,441 | csv, visibleStaff |
| SCREEN-014 | Reports | 15,797 | csv, print, execomCsv, risk |
| SCREEN-015 | Library | 12,969 | addResource, deleteResource, setResourceAccess, libAccess |
| SCREEN-016 | LMS | 13,596 | lmsSearch, lmsApprove |
| SCREEN-017 | Approvals | 4,130 | approvals, approve |
| SCREEN-018 | KpiMonitor | 5,788 | kraScore, kraOverall, activeKras |
| SCREEN-019 | Admin | 22,930 | setUserRole, toggleUser, adminResetPassword, decideDelegation, setMailFrom |
| SCREEN-020 | Config | 39,056 | cfgAdd/Edit/Toggle/Delete/Move, setRules, setPerm, setExecomOfficers |
| SCREEN-021 | MasterData | 11,188 | savePosition, saveStation, setStationBrands |
| SCREEN-022 | ExecResults | 9,301 | execomRows, risk, visitStats |
| SCREEN-023 | ExecomReport | 6,420 | execomCsv |
| (support) | Kanban, AuditTable, MultiSelect | 7,444 / 2,360 / 5,548 | shared components |
| (reference) | Roles Access Spec; Trainee Planning/EXECom; System Audit; Configuration Audit | 23,666 / 26,091 / 34,848 / 8,040 | spec pages, not screens |
| (out of scope) | SVMI Command Center v1/v2 | 58,983 / 206 | earlier SVMI app, not TDMS |

Handover §1 says "22 screens"; this inventory counts 23 screen files. Difference not reconciled (INFERRED: ExecResults vs ExecomReport counted once).

## 3. Forms and modals (items 4, 5)

Modal routing found in `TDMS.dc.html` (`case '…'`): **29 distinct modal types** (PROTOTYPE):

`admin-add, capar-new, capar-schedule, card-manage, cert-edit, change-password, deact-new, delegation-request, employee-form, kpi-edit, kpi-targets, kra-edit, plan, return, session-complete, session-new, store-form, team-edit, temp-password, tl-cert, tl-grades, tl-new, tl-period, tl-profile, tl-uniform, user-new, visit, visit-edit, visit-req`

The Handover (§1) says "about 60 modal forms". The 29 above are only those routed by name in `TDMS.dc.html`; the remaining forms (Trainee screen forms, Config editors, Library upload, LMS ask-a-question) are inline in their screens. **Per-form field lists: TBD** (see §6).

Known form-validation behaviour read from code (PROTOTYPE): password rules (≥8, letters+digits, ≠ current), brand code `^[A-Z]{2,4}$`, color `#rrggbb`, frequency months must divide 12, batch `^[1-9][0-9]?[A-Z]-[0-9]{2}$` (rejects `DTS`, conflicts with D046), mobile `09XXXXXXXXX`, dates `yyyy-mm-dd`, trainee status remark ≥5 chars (≥10 for correcting a final status), grades 0–100.

## 4. Roles, permissions, delegation (items 6, 7, 13)

**Roles (CONFIRMED, Handover §3):** Training Officer, Training Supervisor, Training Manager, Senior Training Manager, System Admin, Store Head, Area Manager. Prototype keys: `officer, supervisor, manager, senior, admin, storehead, area`; `RANK` = 1,2,3,4,**5 (admin)**,0,0.

**Permission behaviour (PROTOTYPE) — TWO parallel systems (confirms E-05):**
1. `CAN` — fixed arrays per action: `edit, review, approve, restricted, admin, log, approveDelegation, kpiEdit, delegate, finalApprove`.
2. `PD` — module × role matrix with letters v/a/e/d/g/p/c for 12 modules (Calendar, Boards, Stores, Master data, Employees, Proficiency, Programs, Library, LMS, KPI, Approvals, Configuration), read by `T.perm()`.

Notable prototype/Handover disagreements (details in `PERMISSIONS.md` §5): `moveTL` blocks certifying unless `can('approve')` (supervisor+), so an officer cannot certify (conflicts D067); `finalApprove = [senior, manager]` for promotion (conflicts D031: Supervisor or higher); `PD.Configuration` gives supervisors/managers/seniors `vc` (view+configure) while Handover gives settings to Admin; Store Head/Area Manager see only Stores, Employees, Proficiency, Library, LMS (`VSCR`).

**Delegation (PROTOTYPE, matches Roles Access Spec §6):** status `pending/approved/rejected/cancelled/ended`; derived `scheduled/active/ended` from dates; delegate gains delegator's role in `myRoles()`; "Acting as" banner. Admin screen has approve/reject/end. CONFIRMED by D015 (in v1).

**Edit window:** `editHours` rule (default 24), officer edits own entries only (PROTOTYPE; CONFIRMED §3, §7.4).

**Demo role switcher:** `T.setRole()` (localStorage `tdms-role`). Handover §7.4 removes it. REMOVE.

## 5. Workflows, statuses, calculations (items 8–11)

| Area | Prototype states / logic | Tag vs Handover |
| --- | --- | --- |
| Visit plan (`VISIT_COLS`) | planned → progress → done; Done is "saved to the visit log" (a second record is created by `applyVisit`) | States CONFIRMED (§5.1). Plan-vs-visit as two records: INFERRED; undefined in Handover. No Cancelled state (needed by D068) |
| CAPAR (`CAPAR_COLS`) | failed → scheduled → verified → endorsed → closed; one stage at a time; closed locked; `returnItem` sends endorsed → verified with a note; failed→scheduled needs a visit date + officers; "schedule within 7 days" | Stages CONFIRMED §5.3. Return-with-note: PROTOTYPE only. Stored `failed` counter on store: PROTOTYPE bug (R10) |
| Team Leader (`TL_COLS`) | entry, probation, cert, certified, extended, failed (labelled "Failed / Quit"), promoted; deadline = `add(TODAY, 90)` on enroll; extension adds `tlExtDays`; certify needs `can('approve')` | Stages CONFIRMED §5.7 except: Quit must be separate (D068); certify needs no approval (D067); deadline = entry + probation months |
| Trainee | `TSTAT` = Ongoing, Passed, Extended, Failed, Quit, Terminate; `tAllowed()` from Ongoing → Extended/Failed/Quit/Terminate; Passed via `passTrainee`; end date = start + `trainDays` (default 14), extension + `extDays`; four equal-weight grades (written, practical, immersion, final), pass mark in settings | Statuses CONFIRMED. 14-day period and 4-equal grading are SUPERSEDED (D043, 052, 055) |
| Month-end | No close/snapshot logic found. A `T.runRollover()` call exists in the store (purpose not examined) | MISSING (D036, §5.6) |
| Expiry tasks | Not present. `certWarn` rule (30 days) only | MISSING (§5.4) |
| Delegation | see §4 | CONFIRMED |
| Deactivation | `requestDeactivation` + `pendingReq` + Admin `decideRequest` | CONFIRMED direction (E-03, D042); cleanup/reassignment NOT built |

**Calculations in the store (PROTOTYPE):**
- `risk(s)`: `failed×5 + (no visit this quarter ? 3 : 0) + recency(0/1/2/4 by days ≤30/60/90/>90)`; tiers 0–4 LOW, 5–9 MEDIUM, ≥10 HIGH. **Superseded by D029 (SVMI Store Health v2.0.0).**
- `tAvg` = mean of 4 grades; `tlCertResult` / `tlFinalAvg` weights from rules (30/40/30, kitchen/manager 60/40).
- `kraScore/kraOverall`: weights from `kras`; sample `KPI` array (12 officers × 12 months of fixed numbers — E-07).
- Rule ranges (`RULES`, PROTOTYPE validation only): tlPassMark 1–100 (85), tlExtDays 1–180 (30), tlDueWarn 1–90 (14), caparDays 1–60 (7), certWarn 1–180 (30), certValid 30–1095 days (365), postPass (85), kpiOut/VS/Sat (90/80/70), idleMin 5–240 (30), editHours 1–168 (24). The ranges are not approved; defaults mostly match Handover §5.7/§5.9/Roles spec.

## 6. Notifications, search, reports, exports, files, offline, mock data (items 12, 14–19)

| Item | Prototype behaviour | Tag |
| --- | --- | --- |
| Notifications | Computed in-browser by `T.notifications()`: planned visit overdue; CAPAR not scheduled within `caparDays`; verification overdue; TL deadline ≤14 days; approvals waiting; offline drafts. No email, no digest | PROTOTYPE. Email digest CONFIRMED needed (§7.2) |
| Approvals | `T.approvals()`: CAPAR endorsed → close; TL cert pending; delegation requests; deactivation requests | CAPAR/delegation CONFIRMED; **TL certification approval REMOVED by D067** |
| Search/filters | Brand multi-select (`state.brands`, `MultiSelect`), period window, per-screen text filters; `visibleStores/visibleStaff` by scope | PROTOTYPE |
| Reports | `Reports` screen; exports via `T.csv`; `T.print` = `window.print()`; EXECom report computed from trainee status | CSV/print PROTOTYPE; PDF + Sheets output CONFIRMED needed (D013) |
| Exports | CSV on Reports, Training, TeamLeaders, Stores, Proficiency, KPI, Employees, Capar | PROTOTYPE |
| File handling | Library saves metadata only; no Drive; Trainee import reads CSV through `FileReader`; visit `photos` array exists | E-13 confirmed. Visit photos REMOVED (D035) except cross-training proof (D059) |
| Offline | Drafts in `localStorage['tdms-drafts']`, id `DRF-<timestamp>`, "simulate offline" toggle; `syncDrafts` replays; no dedupe key, not scoped to user | PROTOTYPE; fixes in §7.9 |
| Demo/mock | `TODAY='2026-10-05'`; 23 sample stores; 12 officer nicknames; synthetic trainee batches 3B-26/3A-26 …; `demoUsers`, `demoSwitch`; plain-text passwords | REMOVE (E-01, 02, 06, 07) |
| Undo | `commit()` snapshots and offers Undo toast | PROTOTYPE UX only |

## 7. Technical implementation, shortcuts, bugs, UX limits (items 20–25)

**Existing technical implementation (PROTOTYPE):** Claude-Design "DC" component runtime (`x-dc`, `DCLogic`, `support.js` 69 KB); a single global store object `T` (`tdms-store.js`) holding all data, rules, permissions and notification logic in browser memory; no backend; no persistence except `localStorage` drafts; screens call `T.*` synchronously.

**Technical shortcuts found (code-verified):**
1. All data and rules in one 125 KB file; ~190 hardcoded `2026` year literals (Handover §8).
2. `TODAY` constant instead of a clock (E-02).
3. Passwords as plain text in user objects (`password:'tdms2026'`), compared in the browser (E-06).
4. `T.nav` and `T.__go` are re-wrapped by successive patches (`_n3`, `_go3`) — logic depends on load order.
5. Two permission systems (`CAN` and `PD`) (E-05).
6. IDs minted from counters in the browser: `EMP-000101…` for users, `TRN-`, `TL-2026-`, `CAP-2026-` (year hard-coded), `PLN-`, `SES-2026-`, `VIS-`, `DRF-<timestamp>`; none match the Handover §7.10 formats.
7. Names used as keys: TL records hold a `name` (E-09); trainee match = `mobile OR name` (E-04); `officers`/`visitors` stored as nicknames.
8. Stores counted as one table; no Location type (D045).
9. Fixed station list `['Service','Cashier','Kitchen','Prep','Dispatch']` conflicts with D055 plans.
10. TL deadline `add(TODAY, 90)` hardcoded vs probation-months setting.
11. `passTrainee`/`staffFor` creates the employee inside the Trainee code path — a second writer for Employee (see P0 source-of-truth item).
12. Every list renders all rows (Handover §8).

**Known bugs:** E-01 to E-14 and 3 unnumbered rows are CONFIRMED in Handover §8 and are not repeated. Additional code-level observations beyond that list: certify gate uses `can('approve')` (conflicts D067); promotion gate uses `finalApprove` (conflicts D031); `BATCH_RE` rejects `DTS` (D046); `moveCapar` appears to allow backward moves that clear later stage dates (my read of that line was truncated; verify before relying on it) and the Handover does not define backward moves.

**UX limitations:** per Audit §I (I1–I5) and Handover D20 (every function on phone). Calendar drag fails on touch (E-11).

## 8. Coverage gaps (this inventory is incomplete in these ways)

| Gap | Impact | Next step |
| --- | --- | --- |
| Per-screen field lists for every form not extracted | Cannot yet write field-level UI specs | Phase-1 task per module: extract fields before building that module |
| ~60 vs 29 modal count unreconciled | Possible missed forms | Enumerate inline modals per screen file |
| `SVMI Command Center` not analysed | Not TDMS scope; SVMI history import mapping needs its schema | Needed before the SVMI import task |
| `SVMKPI_RISK.gs` (Store Health v2.0.0 source, repo `lheiiyy/TddProjectai`) not in the bundle | Cannot verify Store Health parity (RISK-001) | **Provide the file** (ISS-P1-07) |
| Legacy sheets (HR masterlist, TL Monitoring, ENDORSEMENT script) not in bundle | Import mappings remain "inferred" | Provide samples before their import tasks |
| Screenshots in `uploads/*.jpg|png` not reviewed | Possible UX intent not captured | Review on demand |
