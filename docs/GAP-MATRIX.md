# TDMS Prototype-vs-Production Gap Matrix v0.1 (Deliverable C)

Disposition: **KC** keep concept · **KU** keep UX · **RU** redesign UX · **RL** rebuild logic · **RM** remove · **DF** defer · **UK** unknown.
The prototype is evidence (Authority 4). "Production needs" cites Handover decisions (DEC) or open items (ISS).

## 1. Screens

| SCREEN | Name | Disposition | Gap / production needs | Refs |
| --- | --- | --- | --- | --- |
| 001 | Login | KU + RL | Real auth: server-side salted hash, throttle (CFG-002/003), reset link 30 min, forced change on temp password, no demo users, no plain text | RULE auth, ISS-P0-03/04 |
| 002 | Dashboard | KC + RL | Role-scoped data from services, not sample arrays; computed notifications move server-side | MOD-013 |
| 003 | Calendar | KC + RU | Touch drag fails (E-11): add tap-to-reschedule. Plan vs visit split undefined | ISS-P1-06, D016 |
| 004 | Log visit | KC + RL | Offline drafts need dedupe key and user scope; photos removed (D035); purpose list per D017 | WF-003 |
| 005 | Boards | KC + RL | Backward moves undefined; stage rules per WF; reassign needs permission checks | D040 |
| 006 | Stores | KC + RL | Location type (D045); Store Health v2.0.0 replaces `risk()` | ISS-P1-07 |
| 007 | Employees | KC + RL | Person/Employee ownership (single writer); deactivation via request | ISS-P0-07/08, D042 |
| 008 | Team | KU | Becomes user list under Admin; names not keys | ENT users |
| 009 | CAPAR | KC + RL | QA status/Endorsed semantics; working-day SLA; link to verification visit once | ISS-P1-01/06/10 |
| 010 | Team Leaders | KC + RL | Quit separate from Failed (D068); certify without approval (D067); deadline = entry + probation months | ISS-P1-03/04 |
| 011 | Training | KC + RL | Session types incl. Team Leader (D032) | |
| 012 | Trainee | KC + RL + RU | Two tracks, weighted grading, no TEMP-name keys, template columns, extension semantics | D043/052/055, ISS-P1-02/12 |
| 013 | Proficiency | KC + RL | Expiry tasks absent; cross-training rule; configurable validity | ISS-P1-05/11, D058 |
| 014 | Reports | KC + RL | CSV/print exist; add PDF and Sheets output; reports use same services as modules | D013 |
| 015 | Library | KC + RL | Real Drive-backed files, private access; categories and roles configurable | ISS-P0-09 |
| 016 | LMS | KC | Non-AI help in v1 (D014); AI helper separate | D065 |
| 017 | Approvals | KC + RL | Remove TL certification approval (D067); add deactivation reassignment | WF-007/008 |
| 018 | KPI monitor | KC + RL | Real data not sample array; KRA cap/survey decisions | ISS-P1-09 |
| 019 | Admin | KC + RL | Add audit viewer, recycle bin, last-admin guard | WF-010 |
| 020 | Config | KC + RL | Versioned settings with effective date; permission editor owner undefined | CFG, ISS-P0-06 |
| 021 | MasterData | KC + RL | Stable IDs; deactivate not delete | D045 |
| 022 | ExecResults | KC | EXECom flag gate | D037 |
| 023 | ExecomReport | KC | Column set is SYSTEM | CFG-100 |

## 2. Features and mechanisms

| Feature | Disposition | Reason |
| --- | --- | --- |
| Single global store `T` with all data and rules | **RM / RL** | Replaced by UI → API → Services → Rules → Repository → Sheets |
| `TODAY` constant, ~190 `2026` literals | RM | Server clock, year derived from record date |
| Plain-text passwords in browser | RM | E-06; security |
| Demo users, role switcher (`setRole`), sample KPI array, 23 sample stores | RM | E-01/02/06/07 |
| Two permission systems (`CAN`, `PD`) | RL | One server-side matrix (PERMISSIONS.md) |
| Browser-minted IDs | RL | Server-generated prefixed IDs under lock |
| Names as keys (TL name, nicknames, trainee match) | RL | Stable IDs |
| `risk()` formula | RL | Store Health v2.0.0 (D029) |
| Trainee 4 equal grades, 14 days | RL | D043/052/055 |
| Fixed station list | RL | Station plans per position (D055) |
| `passTrainee` creates the employee | RL | Single writer for Employee |
| Batch regex rejects `DTS` | RL | D046 |
| Offline drafts in localStorage | KC + RL | Keep concept, add dedupe key and user scope |
| Undo toast | KU | UX only; server data not undone |
| Return Endorsed → Verified with note | UK | Prototype only; Handover silent |
| Backward card moves | UK | Verify before relying on it |
| Visit photos | RM | D035 (except cross-training proof, D059) |
| `runRollover` | UK | Purpose not examined |
| Month-end close and snapshots | **missing** | Build (WF-006) |
| Expiry tasks | **missing** | Build (WF-005) |
| Recycle bin, audit viewer | **missing** | Build (D021) |
| Email digest, reset emails, QA PDF | **missing** | Build (§7.2) |
| Delegation | KC + RL | In v1 (D015) |
| Commit-to-view-all-rows lists | RL | Paging, 50 rows (§8) |
| SVMI Command Center files | RM (out of scope) | Separate earlier app |

## 3. Counts

23 screens: 7 KC+RL straight rebuild of logic, rest KC/KU with logic rebuilt; 0 screens removed. Mechanisms: 7 removed, 11 rebuilt, 3 missing modules (month end, expiry, recycle/audit), 3 unknown.
