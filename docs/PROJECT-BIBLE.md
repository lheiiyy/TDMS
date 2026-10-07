# TDMS Project Bible

Stable description of the system. Details live in the referenced documents; nothing here is copied from them. Authority: Build Handover > Plan Audit > other approved documents > prototype (reference only).

## Purpose
TDMS (Training and Development Management System, D1) is the Training & Development Division's operating system. It replaces fragmented manual processes with one controlled, connected, auditable record of employee development, training, certification, field work, CAPAR, KPI/KRA and reporting.
Success = reliable data, clear ownership, controlled configuration, secure access, defined workflows, historical integrity, automated monitoring, accurate reporting, auditability, future scalability.

## Scope
v1, on hold, v2, not planned and out-of-scope lists: Handover §9 (indexed in [REQUIREMENTS](REQUIREMENTS.md) §Scope). Decision record: [DECISIONS](DECISIONS.md).

## Modules
Master data · Person/Employee · Sign-in, users, delegation · Store visits and Calendar · Store Health · CAPAR · Trainees and EXECom · Team Leaders · Proficiency and expiry · Training sessions · Library and LMS help · KPI/KRA · Dashboards, reports, digest · Approvals and notifications · Administration (configuration, audit, Recycle bin, import) · Boards. Dependencies and phases: [MODULE-MAP](MODULE-MAP.md), [ROADMAP](ROADMAP.md).

## Users
Seven roles: Training Officer, Training Supervisor, Training Manager, Senior Training Manager, System Admin, Store Head, Area Manager. One role per user; extra access only through approved delegation; an Admin-set EXECom officer flag. Store Head and Area Manager are in the role model from the start; their accounts go live in v2 (Handover §3, D2). Access rules: [PERMISSIONS](PERMISSIONS.md).

## Architecture principles
1. UI → `api.js` → modular services → business rules → repository → storage (Google Sheets; private Drive). Only the repository touches storage. No single-file application.
2. Server-side authorization on every call; hiding a control is not authorization.
3. Stable server-generated IDs; names are display only; never relationship keys.
4. History is never silently rewritten: effective dates, versions, snapshots; controlled deactivation over deletion.
5. Configurable ≠ everything editable: configurable, fixed workflow, system/technical, requires-decision are kept apart ([CONFIGURATION](CONFIGURATION.md)).
6. Separate dev/test and live data; company-owned account; GitHub is the source of truth.
7. Migration-ready for a future PostgreSQL schema in the same repository.
Detail: [ARCHITECTURE](ARCHITECTURE.md).

## Major workflows
Trainee lifecycle · Team Leader development · Store visit (plan → log) · CAPAR (Failed → Scheduled → Verified → Endorsed → Closed) · Certification expiry · Month-end close · Delegation · Deactivation cleanup · Import · Admin edit/delete/restore. Transitions, actors and side effects: [WORKFLOWS](WORKFLOWS.md) (WF-001..010).

## Major constraints
Google Sheets limits (6-minute execution, 50,000-character cells, paging); phone, tablet and desktop parity (D20); no full offline mode; no AI in the LMS (D14); no visit photos (D35); calendar-year reporting (D39); months lock at close (D7, D36); rule changes affect new results only (D8).

## Working rules
Instruction set: Master Instruction (project settings). Task packets: [HANDOFF-MODEL](HANDOFF-MODEL.md). Do not invent requirements; stop with BLOCKED — REASON — DECISION REQUIRED. Open items: [ISSUE-REGISTER](ISSUE-REGISTER.md), [DECISION-GATE](DECISION-GATE.md).
