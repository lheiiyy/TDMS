# TDMS - Training and Development Management System

One web app for the Training Department (Training and Development Division, HRAD) of Figaro Culinary Group, covering Angel's Pizza, Angel's Pizza Express, Tien Ma's, Koobideh Kebab and Figaro Coffee.

**Status:** planning phase. No app code yet; the plan and the UI design are still in progress. Build starts after both are approved.

| What | Where |
| --- | --- |
| Master plan (live, editable) | https://claude.ai/code/artifact/f89076cb-9986-4a8a-abe2-f0eb70d83dab |
| Master plan (copy in repo) | [docs/PLAN.md](docs/PLAN.md) |
| Phase and module checklist (live, team-shared) | https://claude.ai/artifact/1MBxV4t8Np1C6E5YMnejoV |
| Checklist (copy in repo) | [CHECKLIST.md](CHECKLIST.md) |
| UI design (Claude Design, in progress) | [SVMI Command Center v2](https://claude.ai/design/p/2ed405f3-0ef3-42e2-9b79-93e0f03653d0?file=SVMI+Command+Center+v2.dc.html&via=share) |
| UI/UX design brief (merged into the plan, Section 5) | [Oct 3 modernization plan](https://claude.ai/share/99d7f117-2fcf-47eb-ae80-6266dc28fe82) |
| Module specs | [specs/](specs/) |
| Rules for Claude Code | [CLAUDE.md](CLAUDE.md) |

## What it replaces

| Module | Replaces |
| --- | --- |
| M0 Core master data | CONFIG tabs in TOIS PMS, SETTINGS tabs |
| M1 Trainee orientation | Manual lists |
| M2 Training programs and sessions | Training Program & Delivery Monitoring 2026 |
| M3 Team Leader program | [sys] Team leader Monitoring |
| M4 Proficiency and cross-training | TOIS PMS, Cross Trained Staffs Monitoring |
| M5 Store visits | SVMI |
| M6 CAPAR | CAPAR Rectification Monitoring |
| M7 Dashboards and reports | Summary tabs, manual reports |
| M8 Resource library (SOPs, manuals, memos, FAQs, forms, exams) | Scattered Drive folders and chat files |
| M9 KPI monitoring (restricted) | KPI Monitoring Hub (`lheiiyy/KPI-MONITORING-HUB`) |

The legacy SVMI and TL Monitoring code, and the SVMI PostgreSQL schema (`database/`), stay in `lheiiyy/TddProjectai` as reference.

## How it is built

Google Sheets is the database for now; the app is an Apps Script web app. It is built in four layers so the move to a full-stack app (PostgreSQL + REST API) only replaces the bottom layer:

```
screens (HTML/JS)  ->  api.js  ->  services (*.gs, business rules)  ->  repository (only file that touches Sheets)
                                                                        later: PostgreSQL
```

Planned layout (created when Phase 0 starts):

```
README.md        this file
CLAUDE.md        rules for Claude Code sessions
CHECKLIST.md     phases, modules and features
docs/            plan, roadmap, user guides
specs/           one spec per module
apps-script/     .gs services, repository, api, appsscript.json, .clasp.json (test copy)
web/             screens, api.js, styles
tests/           service and repository tests
```

## Planning skills

Two Claude Code skills live in `.claude/skills/`:

- `tdms-module-planning` - write the spec for one TDMS module.
- `web-app-project-planning` - plan any new web app from scratch.

## Rules that never change

- Never write to a live legacy sheet. Imports read from copies.
- Never commit `.clasprc.json`, passwords, tokens or private sheet IDs.
- Changes reach `main` through pull requests once building starts.
