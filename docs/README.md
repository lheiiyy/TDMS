# TDMS documentation index

Authority order when documents disagree: **Handover > Plan Audit > baseline docs (this folder) > prototype.** `DATA-MODEL.md` is the schema authority. Superseded documents are in [archive/](archive/).

Claude Code reads, in order: `CLAUDE.md` -> [PROJECT-STATE](PROJECT-STATE.md) -> the docs the task names -> affected source -> tests ([HANDOFF-MODEL](HANDOFF-MODEL.md) §2).

## Working documents

| Doc | Purpose |
| --- | --- |
| [PROJECT-STATE](PROJECT-STATE.md) | Current phase, blockers, next task (STATUS) |
| [ROADMAP](ROADMAP.md) | Phases PH-0..PH-17, slices, gates, first task packet (PLAN) |
| [DECISIONS](DECISIONS.md) | Approved decisions D001.. (adr) |
| [DECISION-GATE](DECISION-GATE.md) | Open gates G-01..G-05 and the answers recorded |
| [CHANGELOG](CHANGELOG.md) | Change history of the documents and repository |
| [HANDOFF-MODEL](HANDOFF-MODEL.md) | Claude Code task packet template, stop rule, definition of done |

## Specification

| Doc | Purpose |
| --- | --- |
| [PROJECT-BIBLE](PROJECT-BIBLE.md) | What TDMS is and the permanent project rules |
| [REQUIREMENTS](REQUIREMENTS.md) | Approved requirements REQ-001..108 |
| [BUSINESS-RULES](BUSINESS-RULES.md) | Business rule register (draft) |
| [WORKFLOWS](WORKFLOWS.md) | Workflow specification WF-001..014 |
| [PERMISSIONS](PERMISSIONS.md) | Authorization model |
| [DATA-MODEL](DATA-MODEL.md) | Logical data model (schema authority) |
| [CONFIGURATION](CONFIGURATION.md) | Configuration blueprint (CFG settings) |
| [ARCHITECTURE](ARCHITECTURE.md) | Layers, repository layout, ARC checks, environments |
| [API-CONTRACT](API-CONTRACT.md) | API envelope, error codes, method catalogue |
| [TEST-STRATEGY](TEST-STRATEGY.md) | Test families and ids |
| [MODULE-MAP](MODULE-MAP.md) | Modules and phase labels |
| [MIGRATION-PLAN](MIGRATION-PLAN.md) | Legacy data and PostgreSQL migration |

## Analysis of the prototype

| Doc | Purpose |
| --- | --- |
| [PROTOTYPE-INVENTORY](PROTOTYPE-INVENTORY.md) | What the Claude Design prototype contains |
| [GAP-MATRIX](GAP-MATRIX.md) | Prototype versus production gaps |
| [ISSUE-REGISTER](ISSUE-REGISTER.md) | Issues ISS-P0/P1.. (superseded where the gate says so) |

## Runbooks

| Doc | Purpose |
| --- | --- |
| [runbooks/dev-environment](runbooks/dev-environment.md) | Steps to create the dev, test and live-shell environments (TDMS-0-002 to 0-004) |
| [runbooks/account-transfer](runbooks/account-transfer.md) | Moving TDMS to another Google account (draft; verified in spike S-09) |

Also here: `roadmap.png` (roadmap picture).
