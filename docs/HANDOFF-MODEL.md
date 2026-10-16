# Claude Code Handoff Model v0.1 (Deliverable J)

Claude Work prepares task packets; Claude Code implements them. Claude Code never redefines business rules (Instruction §22).

## 1. Roles

| Claude Work | Claude Code |
| --- | --- |
| Requirements, architecture, decisions, task packets, review, project state | Inspect repo, implement the packet, write and run tests, fix defects, update the docs the packet names, prepare the commit |

## 2. What Claude Code reads (token rule, Instruction §24)

1. `CLAUDE.md` 2. `docs/PROJECT-STATE.md` 3. the docs named in the packet 4. affected source 5. relevant tests. Nothing else.

## 3. Task packet template

```
TASK ID:        TDMS-<phase>-<nnn>
TITLE:
OBJECTIVE:
SCOPE:
OUT OF SCOPE:
SOURCE DOCUMENTS:   (file + section, e.g. BUSINESS-RULES RULE-065; Handover §5.3)
BUSINESS RULES:     (RULE-ids; copy none, cite)
PERMISSIONS:        (PERM-ids; scope; delegation behaviour)
DATA CHANGES:       (ENT-ids, fields, history type, delete behaviour)
API CHANGES:        (methods, inputs, outputs, error codes)
UI CHANGES:         (SCREEN-ids; phone behaviour)
CONFIGURATION:      (CFG-ids used; none hardcoded)
ACCEPTANCE CRITERIA:
TESTS:              (TEST-ids; unit, permission, validation, history, regression)
DOCUMENTATION:      (files to update; PROJECT-STATE always)
OPEN ISSUES BLOCKING: (ISS-ids; must be empty to start)
```

## 3A. Slice plan (written by the builder at the start of a slice)

One ROADMAP row is one slice (R-05); the parts named in its task text are its tasks. The packet (the row and the documents it cites) is the input, so the plan refers to it and does not repeat it. Leo's OK on this plan covers the whole slice (see CLAUDE.md, Batch approval per slice).

```
SLICE PLAN:    <slice ID> <title>
SLICE:         type, size, depends (all merged?), blocked by (must be empty, R-09), documents cited
TASKS:         in order (R-02). For each: files to add or change, tests (TEST-ids or family), commit message (task ID, RULE/PERM ids)
ACCEPTANCE:    the ROADMAP acceptance criteria this slice must meet and how each is verified (test id or manual check)
COMMITS/PRs:   the expected commits (one per milestone) and PRs; where a slice is split into PRs, where and why (stop after each PR until Leo merges it)
NEEDS SEPARATE OK: which of these this slice touches, or "none expected": schema change beyond the packet; scoring or calculation rule; permission or scope change; security impact; cross-module change; anything touching LIVE; a decision listed in DECISION-GATE; a push or deploy to an Apps Script project
DECISIONS:     BLOCKED — REASON — DECISION REQUIRED items, and at most 3 questions with a recommended answer
RISKS:         and rollback
DOCS:          PROJECT-STATE and CHANGELOG, and any other file named
```

**Scope change.** A task added or dropped; a file in another module or layer, or config, schema, permissions or manifest; a new dependency; a change to API, schema, permission or calculation. The builder stops, says what changed and why, writes the amended plan (only the differences), and continues after Leo's OK. A small deviation inside a task (for example one more test case or fixture in the same folder) is not a scope change; it goes in the end report.

**End of slice.** A report of at most 10 lines: slice ID, PR link(s), files changed, commits, `npm test` result, deviations from the plan, open issues, next slice.

## 4. Stop rule

Claude Code stops and reports `BLOCKED — REASON — DECISION REQUIRED` on: missing or conflicting rule, unclear data owner, undefined permission or scope, schema change beyond the packet, possible history corruption, security impact, cross-module change, unclear calculation or source of truth. It does not guess and does not widen scope.

## 5. Definition of done

Implementation complete · relevant tests pass · server-side authorization verified · validation and error handling done · docs updated · no unrelated files changed · no hidden blocker · `PROJECT-STATE.md` updated · ready to commit.

## 6. Commit and review

- One commit per slice milestone; the milestones are listed in the approved slice plan (§3A); message cites task ID and RULE/PERM ids.
- Review checklist for Claude Work: scope respected; no hardcoded configurable value; no name used as key; every read scope-filtered; audit written; historical protection kept; tests map to TEST-ids; docs consistent.

## 7. Repository layout (proposal, ISS-P0-01)

```
CLAUDE.md
docs/                (docs set)
src/
  api/ (api.js client + server entry points)
  services/          (one per module)
  rules/             (pure business rules, no I/O)
  repository/        (only layer touching SpreadsheetApp/DriveApp)
  core/              (clock, ids, validation, errors, audit)
  ui/                (HtmlService pages, per module)
tests/               (rules and services run without Sheets; repository against test spreadsheet)
config/              (setting definitions, ID prefixes)
```

## 8. Slice order

Follows ROADMAP.md. The first packet to issue is TDMS-0-001 (repository, environments, test harness), after ISS-P0-01, 04 and 17 are answered.
