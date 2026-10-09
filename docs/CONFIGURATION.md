# TDMS Configuration Blueprint v1.0

Status: FINAL BLUEPRINT for review. Supersedes Configuration Inventory v0.1. Logical specification only; no code, no spreadsheet layout.
Authority: Handover (D001–D068, §3–§7, §5.8, §5.9) > Plan Audit §E > other approved docs > prototype `RULES` / `cfg.lists` (evidence only, tagged **P**).
Companion docs: DATA-MODEL (ENT-001, 003, 004, 015–019, 026, 100, 101), PERMISSIONS §8 ("configure" column, AMB-01, AMB-07), WORKFLOWS, ISSUE-REGISTER, DECISIONS.

Setting IDs `CFG-nnn` are stable and keep their v0.1 numbers (other documents cite them). New IDs added by this audit: CFG-010.1–.5 (split of CFG-010), CFG-038, CFG-105, CFG-106, CFG-107.

---

## Part 1 — Classes, legend and governing rules

### 1.1 Classes (project instruction §9)

| Class | Meaning | Where listed |
| --- | --- | --- |
| **CONFIGURABLE** | Business value an authorised user may change | Section 1 (full 12-attribute definition) |
| **FIXED** | Approved workflow or business rule; changed only by a release | Section 2 |
| **SYSTEM** | Technical setting; not a business setting | Section 2 |
| **DECISION** | Not approved yet (existence, behaviour or value). Nothing is built or defaulted | Section 3 |

A setting can be **CONFIGURABLE with a value still pending**. It then appears in Section 1 (class and shape are approved) and in Section 3 (value needed). Its default is shown as `REQUIRES DECISION`, never as a guess.

### 1.2 Legend used in Section 1

| Column | Codes |
| --- | --- |
| **Type** | int, dec, text, date, bool, email, enum, list, matrix (role × permission), secret |
| **Validation** | **S** = structural only (right type, required, whole number ≥ 1 for counts and durations, valid date, unique). **P** = prototype range, not approved. Group rules (weights total 100, bands ordered) are stated in full |
| **Effective date** | **E** = effective-dated version; the user chooses `effective_from` (rule R2). **I** = immediate version; `effective_from` = save time, never backdated. **L** = list or master record; status plus field history, no `effective_from` |
| **Audit** | **A1** = old value, new value, user, time (§7.6). **A2** = A1 plus a written reason required (**proposed**, CD-31) |
| **Existing records** | **N0** none affected. **N1** new results only (D008): results already saved keep their stamped rule. **N2** trainees/enrollments created after `effective_from` only (D063 pattern). **N3** derived or live display is re-evaluated; no stored result changes. **N4** takes effect at the next request or session check |
| **History kept** | **H1** every version retained (VER row). **H2** item deactivated, never deleted; field history kept. **H3** the rule version is stamped on each affected result (Part 2) |

### 1.3 Governing rules (apply to every CONFIGURABLE setting)

| Rule | Statement | Source |
| --- | --- | --- |
| R1 | Settings live in `settings` (ENT-001) as **one row per version**. A change inserts a new row with `supersedes_id`; no row is edited in place. Lists and master records use their own entities (ENT-003, 010–019) with status and field history | D008, DATA-MODEL P-profiles |
| R2 | `effective_from` is **today or later** (server date, zone per CFG-104). Backdating is refused. Rulesets that work by month (Store Health, KPI) start on the **first day of a month** (proposed, CD-32) | Critical rule; CD-32 |
| R3 | A computation "as of date D" uses the version in force on D | §5.8, D063 |
| R4 | **Rule stamp.** Every saved result that depends on a configurable rule stores the version/effective date of that rule (Part 2). A later change never recomputes a saved result | D008, RULE-027 |
| R5 | Derived values (Store Health, scorecards, department KPI) are not source data. They are frozen only by the month snapshot, which stamps the rule versions used | DATA-MODEL P11, §5.6 |
| R6 | A setting change never alters a closed month's snapshot | RULE-144 |
| R7 | Group validation is done on the whole group, saved atomically as one **bundle version** (Part 2): weights total 100; rating bands strictly descending; tier thresholds ordered; offsets in order | prototype `setRules` pattern (P) |
| R8 | Every change is audited (A1 or A2). Failed saves are not versions | §7.6, §7.10 |
| R9 | Lists: deactivate, never delete, once referenced. System items cannot be renamed, disabled or deleted. Renaming changes the label of the same ID; a change of meaning is a new item plus deactivation of the old one (proposed, CD-35) | §7.9, prototype `LISTMETA` (P) |
| R10 | Who may change a setting is enforced on the server (PERMISSIONS). Default: System Admin. Exceptions are shown in the "Who" column | §3, PERMISSIONS §8 |
| R11 | Two people saving the same setting: the second save is rejected if the version it was based on is no longer current (optimistic concurrency) | ISS-P0-13 |
| R12 | Secrets (API keys, spreadsheet/Drive IDs) are never stored in a sheet | §7.11 |
| R13 | Prototype ranges are not approved. Until a range is approved, validation is structural (S) | ISS-P2-07 |
| R14 | A value that REQUIRES DECISION has no default. The feature that needs it is not enabled until the value is set by an authorised user | Instruction §14, §16 |

---

## Part 2 — Rule stamps (how historical results are protected)

### 2.1 Bundles

Settings that must be used together are saved as one **bundle version**. A result stamps the bundle version, so one stamp identifies every rule used.

| Bundle | Members | Used by |
| --- | --- | --- |
| BND-TRN-TIMELINE | CFG-030 (+ CFG-033 station plan) | Trainee milestone dates and station blocks |
| BND-TRN-GRADE | CFG-034, CFG-035 | Trainee station results |
| BND-TL-CERT | CFG-040, 041, 042, 043, 044, 045, 046 | TL deadline, extension and certification |
| BND-CERT-VALIDITY | CFG-050, 051, 053 | Certification expiry and expiry tasks |
| BND-CAPAR-SLA | CFG-060 | CAPAR stage due dates |
| BND-SH | CFG-017 (months), 070–075 | Store Health |
| BND-KPI | CFG-080, 081 (and CFG-083/084 once decided) | KPI/KRA scorecards |

DATA-MODEL ENT-001 has a single `settings_version_id` on station results. This blueprint extends the same idea to a **bundle version** (amendment DM-A0). This is a design proposal (PROP-006), not an approved decision.

### 2.2 Stamps required per result

| # | Result | Depends on | Stamp stored with the result | Fixed at | DATA-MODEL status |
| --- | --- | --- | --- | --- | --- |
| 1 | Trainee milestone dates | CFG-030, holidays (CFG-020) | milestone dates (stored) + `timeline_version_id` | enrollment | dates exist; stamp = **DM-A1** |
| 2 | Trainee station plan | CFG-033 | `plan_version_id` | enrollment | **DM-A2** |
| 3 | Trainee station result | CFG-034, 035 | `settings_version_id`, `passing_mark_used` | grade confirmation | **exists** (ENT-042) |
| 4 | Post-test result | CFG-037 | `passing_score_used` | result saved | **DM-A3** |
| 5 | TL enrollment deadline | CFG-040 | `deadline` (stored) + `tl_bundle_version_id` | enrollment | deadline exists; stamp = **DM-A4** |
| 6 | TL extension | CFG-042 | new `deadline` (stored), `extension_days_used` | extension | **DM-A4** |
| 7 | TL certification result | CFG-041, 044, 045 | `pass_mark_used`, weights version | certification | **DM-A5** |
| 8 | Certification expiry | CFG-050 | `valid_until` (stored) + `validity_months_used` | certification | `valid_until` exists; months = **DM-A6** |
| 9 | Expiry task | CFG-051 | `window_days_used`, `created_on` | task creation | **DM-A7** |
| 10 | CAPAR stage due dates | CFG-060 | `sla_version_id` + `due_on` per stage (stored) | stage entry | **DM-A8** |
| 11 | CAPAR QA send | CFG-061 | `sent_to_email` (address used) | send | **DM-A9** |
| 12 | Store Health, month | CFG-017, 070–075 | `bundle_version_id`, `engine_version` (v2.0.0) on the snapshot rows | month close | snapshot exists; stamp = **DM-A10** |
| 13 | KPI scorecard, month | CFG-080, 081, 082 | `bundle_version_id`, `targets_version_id` on the snapshot rows | month close | **DM-A10** |
| 14 | Month close | CFG-090, 020 | `deadline_day_used` on the close record | close | **DM-A11** |
| 15 | Generated report/memo file | CFG-092, 094 | header text and template version embedded in the stored file | generation | file stored; template id = **DM-A12** |
| 16 | AI-generated checklist (if approved) | CFG-063 | provider and model used | generation | conditional on ISS-P0-18 |

Derived live values (Expiring label, "overdue", deadline warnings) are **not** results: they are computed from stored dates and the version in force (N3).

### 2.3 Why stored dates matter

A due date or expiry date is stored when it is created. Changing a setting or adding a holiday later does not move it. "Overdue" and "Expiring" are computed against the stored date.

---

## Part 3 — Audit summary

| Class | Count | Notes |
| --- | --- | --- |
| CONFIGURABLE | 52 settings (CFG-010 counted as five) | 12 have a value still pending (CFG-007, 008 (who), 013, 018, 019, 050, 051, 052, 060 (three targets), 061, 062, 107); CFG-063 is conditional on IT approval |
| FIXED | 31 rules (FX-001–031), covering CFG-005, 006, 031, 076, 085, 103 | Section 2.1 |
| SYSTEM | 11 items (SY-001–011) | Section 2.2 |
| DECISION | 15 settings (CFG-011, 032, 036, 038, 047, 054, 083, 084, 090, 091, 093, 094, 104, 105, 106); 39 open decisions CD-01–39 | Section 3 |

Counts verified against the tables by search.

---

# Section 1 — CONFIGURATION REGISTRY (CONFIGURABLE settings)

Columns: ID · Setting (name — description) · Type · Validation / allowed values · Default · Effective date · Who · Audit · Existing records · History kept.
"Who": A = System Admin, M = Manager, Sr = Senior Training Manager, S = Supervisor, O = Officer.

## 1.1 Security and access

| ID | Setting | Type | Validation / allowed values | Default | Eff. | Who | Audit | Existing | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CFG-001 | **Idle sign-out** — minutes of inactivity before a session ends | int | S; P range 5–240 (not approved) | 30 min | I | A | A1 | N4 (next request) | H1 |
| CFG-002 | **Wrong passwords before pause** — failed sign-ins before the account is paused | int | S | 5 | I | A | A1 | N4 | H1 |
| CFG-003 | **Pause length** — minutes the account stays paused after CFG-002 | int | S | 15 min | I | A | A1 | N4 | H1 |
| CFG-004 | **Officer edit window** — hours an officer may edit own records after creating them | int | S; P range 1–168 | 24 h | I | A | A2 | N3 — evaluated at the edit attempt using the version in force then (CD-36) | H1 |
| CFG-007 | **Email sender address** — account that sends reset links, QA PDFs and notices | email | valid email; must equal the owner account held in Script Properties (SY-003); the setting is checked against it, never hard-coded (interim owner: personal Gmail `lheii.fcsitraining@gmail.com`, D069) | **REQUIRES DECISION** (CD-01) | I | A | A2 | N0 (future sends only) | H1 |
| CFG-008 | **Permission matrix** — which role may do which action, with scope | matrix | one entry per PERM-nnn × role; scope in {own, assigned brand, assigned store, all, delegated}; the last active Admin cannot lose Admin rights | seeded from PERMISSIONS §8 | E | **REQUIRES DECISION** (CD-02; proposed A) | A2 | N4 | H1 (ENT-026 VER) |
| CFG-009 | **EXECom officer flag (FLAG-001)** — per TDD user; gives EXECom report access | bool per user | at least one active holder; not delegable | ≥ 1 holder | I | A | A2 | N4 | field history |

## 1.2 Master data and lists

| ID | Setting | Type | Validation / allowed values | Default | Eff. | Who | Audit | Existing | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CFG-010.1 | **Brands** — code (permanent), name, colour | list | code unique and immutable (P pattern `^[A-Z]{2,4}$`); name unique | none; seeded at migration | L | A; M Sr create/edit records (PERMISSIONS §8) | A1 | N0 (display name only; links use the brand ID) | H2 |
| CFG-010.2 | **Regions** — name, brand link | list | unique per brand | none; seeded | L | A; M Sr | A1 | N0 | H2 |
| CFG-010.3 | **Locations / stores** — name, brand, region, type (CFG-011), visit frequency (CFG-017), status | list | name unique per brand; type from CFG-011; frequency from CFG-017 | none; seeded from HR masterlist | L | A; M Sr | A1 | N0; a frequency change affects future compliance only (see CFG-017) | H2 (WF-011 deactivation) |
| CFG-010.4 | **Positions** — name, level (staff / manager), requires HO tech val | list | unique; level drives default pass mark (D054) | none; seeded | L | A; M Sr | A1 | N2 for timeline effect (enrolled trainees keep their stamp) | H2 |
| CFG-010.5 | **Stations** — name, certification required, brand scope | list | unique; validity set in CFG-050 | none; seeded | L | A; M Sr | A1 | N0 | H2 |
| CFG-012 | **Visit purposes** — reasons for a store visit | list | unique; TLTC and CAPAR Verification are SYSTEM items (not renamed or disabled); a new purpose needs a Store Health score before use (CD-33) | Store Visit, TLTC, Curing/Support, CAPAR Verification | L | A | A1 | N0 | H2 |
| CFG-013 | **Audit / failure type** — one shared list used by CAPAR and visit failures (D010) | list | unique; used in the CAPAR duplicate key, so never repurposed (R9) | **REQUIRES DECISION** — prototype has 4 audit + 3 failure types, merge to be confirmed (CD-04) | L | A | A1 | N0 | H2 |
| CFG-014 | **Employee statuses** | list | Active and Deactivated are SYSTEM items | Active, Deactivated | L | A | A1 | N0 | H2 |
| CFG-015 | **Training types, session types, programs** — program has name, type, duration, has post-test | list | unique; a "Team Leader" session type is required (D032) | none; seeded | L | A (PERMISSIONS §8); M per Handover §3 (AMB-07) | A1 | N0; a duration change applies to future sessions | H2 |
| CFG-016 | **Library categories, allowed file types, view/upload roles** | list | unique category; file types from the allowed set | none; seeded | L | A | A1 | N3 — access re-checked on each open | H2 |
| CFG-017 | **Visit frequencies** — name and length in months | list (name, months) | S; P: months divides 12; a new frequency needs cadence days in CFG-074 before use (CD-33) | Monthly 1, Quarterly 3, Semi-Annual 6 | E | A | A2 | N1 — Store Health stamped per month; closed months frozen | H1 + H3 |
| CFG-018 | **TL quit reasons** (D068) | list | unique | **REQUIRES DECISION** (CD-06) | L | A | A1 | N0 | H2 |
| CFG-019 | **CAPAR QA status values** | list | unique | **REQUIRES DECISION** (CD-07); not built until decided | L | A | A1 | N0 | H2 |
| CFG-020 | **Holiday list** — date, name, scope; used for working-day counts (D036) | list | valid date; unique per date and scope | none; entered by Admin | L | A | A1 | N0 for stored dates (R-stored); N3 for derived working-day counts in open months; closed months frozen | H2 |

## 1.3 Trainees

| ID | Setting | Type | Validation / allowed values | Default | Eff. | Who | Audit | Existing | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CFG-030 | **Training length and milestone days** per track (Corporate, Franchise/Agency), with optional **brand override** — length, tech val offset, training end offset, in-store window, HR endorsement window | int set | S; offsets in order (tech val ≤ training end ≤ length); window start ≤ end ≤ length; tech val falls on a Thursday (FIXED CFG-031) | Corporate: 90 d; tech val = first Thursday on/after start +42; end = start +66; in-store +56…+65; HR endorsement +66…+90. Franchise/Agency: 15 d; tech val +14; end = same day as HO exam | E | A | A2 | **N2** — only trainees enrolled on/after `effective_from` | H1 + H3 |
| CFG-033 | **Station plan per position** — ordered blocks, stations in each block, block length | list | S; stations from CFG-010.5; exams fall on Friday (FIXED) | e.g. Manager/MT: Service + Cashier 15 d; Food Prep + Pizza Maker 15 d (tech val); Managerial 15 d (D055) | E | A | A2 | N2 (extends D063; CD-34) | H1 + H3 |
| CFG-034 | **Assessment component list** — HO exam, HO tech val, in-store exam, ISTV, and more | list | unique; group in {HO, SOD} | HO exam, HO tech val, in-store exam, ISTV | L | A | A1 | N0 | H2 |
| CFG-035 | **Per position + station: required components, weight, group, passing mark** | int set | S; weights total 100 over required components; mark 0–100 | weights 10 / 20 / 70 (SOD = in-store exam + ISTV ÷ 2); mark **89 staff / 90 manager** (D054) | E | A | A2 | **N1** — in-progress trainees get the new version when their grade is confirmed (CD-34); saved results keep `passing_mark_used` | H1 + H3 |
| CFG-037 | **Post-test passing score** | int (%) | S | 85 (**P**, Audit §E, not Handover) | E | A | A2 | N1 | H1 + H3 |

## 1.4 Team Leader

| ID | Setting | Type | Validation / allowed values | Default | Eff. | Who | Audit | Existing | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CFG-040 | **Probation period** — months from entry date to deadline | int | S | 3 | E | A | A2 | N2 — existing enrollments keep their stored deadline | H1 + H3 |
| CFG-041 | **Certification pass mark** | int | S; P 1–100 | 85 | E | A | A2 | N1 | H1 + H3 |
| CFG-042 | **Extension length** — days added by one extension | int | S | 30 | E | A | A2 | N1 — each extension stores its new deadline | H1 + H3 |
| CFG-043 | **Deadline warning** — days before deadline | int | S | 14 | E | A | A1 | N3 | H1 |
| CFG-044 | **Certification weights** — checklist / exam / feedback | int set | total 100 | 30 / 40 / 30 (**formula unconfirmed, D053**; CD-26) | E | A | A2 | N1 | H1 + H3 |
| CFG-045 | **Feedback weights** — kitchen / manager | int set | total 100 | 60 / 40 | E | A | A2 | N1 | H1 + H3 |
| CFG-046 | **Required entry-grade list** — assessments needed at TL entry | list | components from CFG-034 | 5: FP tech val, PM tech val, FP exam, PM exam, ISTV (D064) | E | A | A2 | N2 | H1 + H3 |

## 1.5 Proficiency and certification

| ID | Setting | Type | Validation / allowed values | Default | Eff. | Who | Audit | Existing | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CFG-050 | **Validity per station** — months a certification stays valid | int per station | S | **REQUIRES DECISION** (CD-12); prototype 365 d is **P** | E | A | A2 | **N1** — a certification's `valid_until` is stored and never moves; renewals use the new value | H1 + H3 |
| CFG-051 | **Expiry warning window** — days before `valid_until` when a certification shows Expiring and a task is created | int | S | **REQUIRES DECISION** (CD-13); prototype 30 d is **P** | E | A | A1 | N3 for the Expiring label; tasks already created stay | H1 + H3 |
| CFG-052 | **Unassigned/unscheduled task flag** — days before an expiry task is flagged | int | S | **REQUIRES DECISION** (CD-13) | I | A | A1 | N3 | H1 |
| CFG-053 | **Cross-training eligibility guidance** — months after regularization (guidance only, never a block; D058, D060) | int | S | 6 | I | A | A1 | N3 | H1 |

## 1.6 CAPAR

| ID | Setting | Type | Validation / allowed values | Default | Eff. | Who | Audit | Existing | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CFG-060 | **Stage target days** (working days) for Failed→Scheduled, Scheduled→Verified, Verified→Endorsed, Endorsed→Closed | int × 4 | S | Failed→Scheduled **7**; the other three **REQUIRES DECISION** (CD-15) | E | A | A2 | **N1** — each case stores its stage `due_on` and `sla_version_id`; "overdue" uses the stored date | H1 + H3 |
| CFG-061 | **QA email address** — recipient of the CAPAR PDF (D030) | email | valid email | **REQUIRES DECISION** (CD-16) | I | A | A2 | N0 — each send records the address used | H1 + H3 |
| CFG-107 | **Backup editor email** — the second person who can recover the live environment (G-08). A record and an input to the [account-transfer runbook](runbooks/account-transfer.md) only: it grants no access. Access is given by hand, by Leo, on the `TDMS-live` folder and the "TDMS live" Apps Script project; the mother folder `TDMS` is never shared (D070), except temporarily during an account move, as the runbook records | email | blank or a valid email; blank means not yet set | **blank (value pending)**; the address is recorded in DECISION-GATE G-08 and entered here after the first deploy; never stored in `config/` seed files | I | A | A2 | N0 | H1 |
| CFG-062 | **Photos per finding; maximum file size** | int × 2 | S | **REQUIRES DECISION** (CD-17) | I | A | A1 | N0 — photos already stored are kept | H1 |
| CFG-063 | **AI provider and model** for the CAPAR AI checklist (D065) | enum + text | provider from an approved list | Gemini (testing). **Conditional on IT approval** (ISS-P0-18) | I | A | A2 | N0 | H1 + H3 |

## 1.7 Store Health v2.0.0 (risk settings; one bundle BND-SH)

Baseline values are Handover §5.8. The source file `SVMKPI_RISK.gs` was never supplied, so parity with the live engine is unverified (ISS-P1-07).

| ID | Setting | Type | Validation / allowed values | Default | Eff. | Who | Audit | Existing | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CFG-070 | **Purpose scores** — score per visit purpose | int per purpose | S; one entry for every active purpose (CD-33) | Store Visit −2, Curing/Support −4, CAPAR Verification −4, TLTC −1 | E | A | A2 | N1; closed months frozen | H1 + H3 |
| CFG-071 | **Failure penalty** — per CAPAR case in its audit month | int | S | +5 | E | A | A2 | N1 | H1 + H3 |
| CFG-072 | **Penalty decay** — reduction per clean month, down to 0 | int | S | −1 | E | A | A2 | N1 | H1 + H3 |
| CFG-073 | **Compliance score** — within cadence / overdue or never visited | int × 2 | S | −3 / +3 | E | A | A2 | N1 | H1 + H3 |
| CFG-074 | **Cadence days** per frequency | int per frequency | S | Monthly 31, Quarterly 92, Semi-Annual 183 | E | A | A2 | N1 | H1 + H3 |
| CFG-075 | **Tier thresholds** | int × 2 | LOW < MEDIUM boundary < HIGH boundary, ordered | LOW < 5, MEDIUM 5–9, HIGH ≥ 10 | E | A | A2 | N1 | H1 + H3 |

## 1.8 KPI / KRA

| ID | Setting | Type | Validation / allowed values | Default | Eff. | Who | Audit | Existing | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CFG-080 | **KRA weights** — five KRAs | int set | total 100 | 25 / 25 / 20 / 20 / 10 (D033) | E | A | A2 | N1; closed months frozen | H1 + H3 |
| CFG-081 | **Rating bands** — lower bound of each band | int set | strictly descending; labels per prototype pattern (P) (CD-28) | 90 / 80 / 70 (§5.9) | E | A | A2 | N1; closed months frozen | H1 + H3 |
| CFG-082 | **Monthly targets per officer** — visits, sessions, certifications | int × 3 per month | S; one target per officer per month (D009) | none | E (per month) | **S or M** (not Admin) | A1 | N1 — a month's target, once the month is closed, is frozen | H1 + H3 |

## 1.9 Operations and reporting

| ID | Setting | Type | Validation / allowed values | Default | Eff. | Who | Audit | Existing | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CFG-092 | **Report headers and sign-off names** | text | S; not empty | none; supplied by Admin | I | A | A1 | N0 — generated files already saved keep their header | H1 + H3 |

---

# Section 2 — FIXED RULES REGISTRY (FIXED and SYSTEM)

These are not business settings. They change only by a release, with a decision recorded in DECISIONS.

## 2.1 FIXED workflow and business rules

| ID | Rule | Value / statement | Source | Why not configurable |
| --- | --- | --- | --- | --- |
| FX-001 | Reset-link validity (CFG-005) | 30 minutes | §7.8 | Security rule; stated outside the editable settings list |
| FX-002 | Password rule (CFG-006) | ≥ 8 characters, letters and numbers, not equal to the current password | Roles spec §7 | Security rule |
| FX-003 | Tech val and exam weekdays (CFG-031) | HO tech val on Thursday; exam on Friday | §6.1, D050 | Calendar anchors of the training model |
| FX-004 | Trainee tracks | Two tracks: Corporate 90-day, Franchise/Agency 15-day, chosen by manage-by | D043 | Structural; only the milestone numbers are configurable |
| FX-005 | Franchise/Agency training end | Same day as the HO exam | D043 | Relationship, not a number |
| FX-006 | Grade formula shape | Grade = weighted average; missing weights redistributed | D052 | Calculation rule; weights themselves are CFG-035 |
| FX-007 | Station retakes | Unlimited within the training period | D056 | Approved rule |
| FX-008 | Trainee conversion | Passed trainee becomes employee; Employee ID = HR number, digits only | D024 | Identity rule |
| FX-009 | TL actions | Officer certifies, extends and closes with no approval; Quit is separate from Failed; Promote = Supervisor or higher | D067, D068, D031 | Approved workflow |
| FX-010 | Cross-training eligibility is guidance, not a block; proof photos allowed | — | D060, D059 | Approved rule |
| FX-011 | CAPAR stage order | Failed → Scheduled → Verified → Endorsed → Closed; one stage at a time; Closed is locked | §5.3, WF-004 | Workflow |
| FX-012 | CAPAR duplicate block | Blocked on location + audit type + audit date | D030 | Data integrity |
| FX-013 | CAPAR QA rules | QA report file required; PDF emailed to QA with a send date; a separate QA endorsement date is required before Closed | §5.3, D030 | Workflow |
| FX-014 | CAPAR counted once | Failures in Store Health are computed from cases by audit date; no stored counter; no double counting | D029 | Integrity |
| FX-015 | Store Health structure (CFG-076) | Tier actions Monitor / Planned Follow-up / Immediate Intervention; attention-reason order; floor 0; year-to-date window | §5.8 ("unchanged") | Engine design; values are CFG-070–075 |
| FX-016 | KRA structure | Five KRAs with their formulas; department KPI = Σ actual ÷ Σ target | §5.9, D033 | Formulas; weights are CFG-080 |
| FX-017 | Attendance formula (CFG-085) | (present − lates − absences) ÷ working days; reporting year = calendar year | §5.9, D039 | Calculation rule |
| FX-018 | Month close sequence | Close by the 5th after the 24-hour edit window; snapshot of EXECom, KPI scorecards, coverage, Store Health, CAPAR status; closed month locked | D036, §5.6, RULE-144 | Workflow (the day number is DECISION CFG-090) |
| FX-019 | Month reopen | Manager or Admin, with a written reason | §5.6, RULE-146 | Approved rule |
| FX-020 | Seven roles; Store Head and Area Manager accounts live in v2; Training Assistant Supervisor = Supervisor; EXECom is a flag, not a role | — | §3, D002, FLAG-001 | Structural |
| FX-021 | Delegation approval chain (CFG-103) | M approves S; Sr approves S and M; A approves Sr; never self-approval; no re-delegation; FLAG-001 not delegated; delegate access is lower | D015, WF-007 | Authorization design |
| FX-022 | Workflow stages of CAPAR, TL, trainee, visit plan (CFG-103) | As in WORKFLOWS WF-001–004 | Audit §E | Workflow |
| FX-023 | Last-admin guard | The last active Admin cannot be deactivated or lose the role | WF-012 | Lock-out protection |
| FX-024 | Stable IDs; names are display only | Never a relationship key | Instruction §8, D001–006 | Architecture |
| FX-025 | Deletion policy | Delete moves to the Recycle bin (Admin only); purge is audited; referenced records are deactivated | D021 | Integrity |
| FX-026 | Authorization on the server | Hiding a control is not authorization | Instruction §10 | Security |
| FX-027 | System list items | TLTC, CAPAR Verification, Active, Deactivated cannot be renamed, disabled or deleted | §7.9 | Engine depends on them |
| FX-028 | Rule stamps (Part 2) | Results keep the rule used | D008 | Historical integrity |
| FX-029 | Audit trail append-only | No edit or delete of audit rows | §7.6 | Audit |
| FX-030 | Notification event set | The approved set in WORKFLOWS §9 | WF §9 | Fixed events; only digest time/opt-out is a pending decision (CFG-091) |
| FX-031 | Orientation length (CFG-032) | One week, **until CD-08 decides** | D050 | Treated as fixed pending decision |

## 2.2 SYSTEM / technical items

| ID | Item | Value / note | Source |
| --- | --- | --- | --- |
| SY-001 | AI API key (CFG-064) | Script Properties only; never in a sheet | §7.11 |
| SY-002 | ID prefixes and formats, audit columns, `row_version`, date/timestamp formats, EXECom report column set (CFG-100) | Code constants | §7.10, Audit §E |
| SY-003 | Spreadsheet and Drive folder IDs per environment, API key, owner account (CFG-101) | Script Properties; dev and live separated. The owner account is read from there and appears in no setting and no code (ARC-13); CFG-007 is checked against it | §2, D047, D012 (superseded by D069) |
| SY-004 | Page size 50, cache lifetimes, trigger schedules, lock timeouts (CFG-102) | Technical | §2, §8 |
| SY-005 | Session storage design | Hashed token; storage per Auth packet (ISS-P0-03) | DATA-MODEL ENT-030 |
| SY-006 | Cell limit 50,000 characters; snapshots stored as rows | Sheets limit | DATA-MODEL P10 |
| SY-007 | Text-column guard for IDs and batch codes | Prevents silent conversion | §8 |
| SY-008 | ID counter table under script lock | Concurrency | ISS-P0-14 |
| SY-009 | Audit-log archive yearly past about 50,000 rows | Sheets scale | §8 |
| SY-010 | 6-minute script limit; month-close snapshot job may need staging (PROP-003) | Platform | §8 |
| SY-011 | Time zone (CFG-104) | SYSTEM once CD-23 decides it | ISS-P0-17 |

---

# Section 3 — REMAINING DECISIONS

Everything here is open. "Recommended" is a suggestion only; none is approved. Nothing is built or defaulted until decided (R14).

## 3.1 Value and definition decisions

| ID | Setting | What is needed | Source | Blocks | Recommended (not approved) |
| --- | --- | --- | --- | --- | --- |
| CD-01 | CFG-007 | Account used to send. Interim answer 2026-10-08 (D069): the script-owning personal Gmail `lheii.fcsitraining@gmail.com`; confirm the final sender before real use | D069, ISS-P0-04 | Auth, CAPAR | Leo confirms the final sender |
| CD-02 | CFG-008 | Who edits the permission matrix; whether Admin sits above Senior | ISS-P0-06, AMB-01 | Authorization | Admin edits, audited, last-admin guard |
| CD-03 | CFG-011 | May the location type set grow? Only "Store" has behaviour | ISS-P2-01 | Master data | Keep five types fixed |
| CD-04 | CFG-013 | The merged audit/failure type list values | D010 | CAPAR | Leo supplies the list |
| CD-05 | CFG-014 | Whether any employee status beyond the two system ones is approved | Audit §E | Person | Keep only the two |
| CD-06 | CFG-018 | TL quit reason values | D068, ISS-P1-04 | TL | Leo supplies the list |
| CD-07 | CFG-019 | QA status values; whether needed at all | ISS-P1-01 | CAPAR | Decide with the endorsement trigger |
| CD-08 | CFG-032 | Is orientation length configurable? | D050, ISS-P2-02 | Training | Keep fixed at one week |
| CD-09 | CFG-036 | Trainee extension limit | §11, ISS-P1-02 | Training | — |
| CD-10 | CFG-038 | HR endorsement result values (`hr_result`) are not defined in the sources | DATA-MODEL ENT-041 | Training | Leo supplies the values |
| CD-11 | CFG-047 | TL extension limit | §11, ISS-P1-04 | TL | — |
| CD-12 | CFG-050 | Validity months per station | §5.10, Plan §6 | Proficiency | Leo supplies per station |
| CD-13 | CFG-051, CFG-052 | Expiry warning window and unassigned-task flag days | §5.4, §11, ISS-P1-11 | Proficiency | — |
| CD-14 | CFG-054 | Cross-training pass rule | §11, ISS-P1-05 | Proficiency | Average(exam, tech val) vs station mark |
| CD-15 | CFG-060 | Targets for Scheduled→Verified, Verified→Endorsed, Endorsed→Closed | RULE-065, ISS-P1-10 | CAPAR | — |
| CD-16 | CFG-061 | QA email address | D030 | CAPAR | — |
| CD-17 | CFG-062 | Photos per finding; maximum file size | §11, ISS-P1-15 | CAPAR | — |
| CD-18 | CFG-083 | Cap KRA score at 100%? | §11, ISS-P1-09 | KPI | — |
| CD-19 | CFG-084 | Coaching survey source and maximum score | §11, ISS-P1-09 | KPI | — |
| CD-20 | CFG-090 | Month-close deadline day: fixed at the 5th or configurable? | D036, Audit §E, ISS-P1-13 | Month end | Treat as fixed until decided |
| CD-21 | CFG-091 | Daily digest time, opt-out | Audit §E, ISS-P1-13 | Notifications | — |
| CD-22 | CFG-093 | Backup retention count | §11, ISS-P1-14 | Hardening | **Count = 14 (Leo, 2026-10-08)**; file-backup scope still open (AO-05) |
| CD-23 | CFG-104 | Time zone for "today", working days, month close | ISS-P0-17 | Core utilities | Leo names the zone |
| CD-24 | CFG-105 (new) | Maximum length of a delegation. WF-007 requires an end date but states no limit | WF-007, D015 | Delegation | Leo confirms whether a limit exists |
| CD-25 | CFG-106 (new) | Recycle-bin purge policy (who, when, retention). DATA-MODEL says "Admin, audited" | D021, ENT-116 | Admin | — |
| CD-26 | CFG-044 | Confirm TL certification formula 30/40/30 | D053, ISS-P1-03 | TL | — |
| CD-27 | CFG-030, CFG-034 | Starting training duration per brand and starting component list by position | ISS-P1-20 | Training | Leo supplies |
| CD-28 | CFG-081 | Band labels and the label for scores below the lowest band; sources reviewed do not state them | §5.9, prototype (P) | KPI | Leo confirms |
| CD-29 | CFG-063 | Whether the AI helper is approved at all (IT approval; Handover §9 puts AI in v2) | D065, ISS-P0-18 | CAPAR | — |
| CD-30 | CFG-094 | Memo template mechanism | D051 pending, ISS-P2-03 | Library | — |

## 3.2 Configuration-governance decisions (introduced by this blueprint; all PROPOSED)

| ID | Question | Why it matters | Recommended (not approved) |
| --- | --- | --- | --- |
| CD-31 | Is a written reason required (A2) for every setting that changes results? | Project goal: "why a sensitive change was made" | Yes for rows marked A2 |
| CD-32 | Confirm no backdating of `effective_from`, and month-start for Store Health and KPI rulesets | Critical rule | Yes |
| CD-33 | A purpose added to CFG-012, or frequency added to CFG-017, has no Store Health score or cadence days | The engine would have no value for it (also touches ISS-P1-08) | Cannot be activated until its score or cadence days exist (0 is allowed) |
| CD-34 | A trainee in progress when pass marks, weights or station plans change | Which version grades them? | Results use the version in force when the grade is confirmed; timeline and plan use the version at enrollment |
| CD-35 | Renaming a list item: label change only, or new item? | A rename changes every old record's displayed label | Rename = label only; change of meaning = new item |
| CD-36 | Does a changed officer edit window (CFG-004) apply to records already past the old window? | Could re-open locked records | Evaluate at the edit attempt with the current version; confirm |
| CD-37 | **Store Health year-to-date across a mid-year rule change.** The window is the year to date. Recompute earlier months with the new rules, or carry the frozen values of closed months? | Recomputing silently rewrites past scores (critical rule) | Carry frozen closed-month values; apply new rules to the open month and later |
| CD-38 | Bundle-version stamp (PROP-006, DM-A0): confirm the design | Needed to meet the stamp rule with one reference per result | **Adopted (Leo, 2026-10-08)** |
| CD-39 | Who may view and who may configure on the Configuration screens (S, M, Sr) | CON-03 / AMB-07: prototype vs Handover differ | Admin configures; M Sr view; S per Leo |

---

# Section 4 — SETTINGS THAT REQUIRE EFFECTIVE DATING

## 4.1 Effective-dated (E): user sets `effective_from`; results stamp the version

| Setting | `effective_from` granularity | Results that stamp it | Closed-month interaction |
| --- | --- | --- | --- |
| CFG-008 Permission matrix | date | none (applies at next request); every change audited | n/a |
| CFG-017 Visit frequencies | first day of a month | Store Health snapshot | frozen |
| CFG-030 Training timeline | date; applies by **enrollment date** | trainee milestone dates + `timeline_version_id` | n/a |
| CFG-033 Station plan | date; by enrollment date | `plan_version_id` | n/a |
| CFG-035 Components, weights, pass marks | date | station result (`settings_version_id`, `passing_mark_used`) | n/a |
| CFG-037 Post-test passing score | date | post-test result | n/a |
| CFG-040 Probation | date; by enrollment date | TL deadline | n/a |
| CFG-041 TL pass mark | date | TL certification | n/a |
| CFG-042 Extension length | date | each extension | n/a |
| CFG-044, 045 Weights | date | TL certification | n/a |
| CFG-046 Entry-grade list | date; by enrollment date | TL enrollment | n/a |
| CFG-050 Validity per station | date | certification (`validity_months_used`) | n/a |
| CFG-051 Expiry warning window | date | expiry task creation | n/a |
| CFG-060 CAPAR stage targets | date | CAPAR stage due dates | n/a |
| CFG-070–075 Store Health | first day of a month (proposed, CD-32) | Store Health snapshot | frozen |
| CFG-080, 081 KRA weights, bands | first day of a month | KPI scorecard snapshot | frozen |
| CFG-082 Monthly targets | the month itself | scorecard snapshot | frozen once closed |

## 4.2 Versioned but immediate (I): version row created at save time, never backdated

CFG-001, 002, 003, 004, 007, 009, 052, 053, 061, 062, 063, 092. The version history is kept (H1) so an audit can show what applied when. Where a stored result records the value used (CFG-061 address, CFG-092 header, CFG-063 model), the stamp is in Part 2.

## 4.3 Not versioned (L): status plus field history

Lists and master data: CFG-010.1–.5, 012, 013, 014, 015, 016, 018, 019, 020, 034. Protection comes from stable IDs, deactivation instead of deletion, and R9. They carry no `effective_from`; semantic changes are made by adding a new item (CD-35).

## 4.4 DECISION items that will need effective dating once approved

CFG-083 (KRA cap), CFG-084 (survey), CFG-090 (month-close day), CFG-054 (cross-training pass rule), CFG-036 and CFG-047 (extension limits), CFG-105 (delegation limit). When approved, each follows the same stamp rule (R4).

---

*Cross-references checked: every CFG id cited in ISSUE-REGISTER, DECISION-GATE, PERMISSIONS and GAP-MATRIX still exists in this file or is listed above as moved (CFG-010 → CFG-010.1–.5).*
