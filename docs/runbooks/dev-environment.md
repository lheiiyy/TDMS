# Runbook: dev environment (TDMS-0-002)

Owner: Leo. Account: `lheii.fcsitraining@gmail.com`. By D069 the same account owns dev, test and live (interim; see [account-transfer](account-transfer.md)). The dev and test steps create nothing in `live`; the live shell is described at the end.

Rules: never commit a script ID, spreadsheet ID or folder ID. The IDs go into the local, git-ignored `.clasp.dev.json` and into Script Properties only ([ARCHITECTURE §16.2](../ARCHITECTURE.md), ARC-04).

## Drive layout (decision D070)

Everything lives in one mother folder in the Drive root of `lheii.fcsitraining@gmail.com`:

```
TDMS/
  TDMS-dev/     contains TDMS-dev-DB
  TDMS-test/    contains TDMS-test-DB
  TDMS-live/    contains TDMS-live-DB
  _apps-script/ reserved for the Apps Script projects
```

- **Never share the mother folder `TDMS`.** Share only an environment subfolder (for example `TDMS-dev`). Sharing the mother folder would also expose `TDMS-live`.
- `DRIVE_ROOT_ID` is the environment subfolder (`TDMS-dev`, `TDMS-test` or `TDMS-live`), never `TDMS`. The app never needs the mother folder.
- Moving an item in Drive keeps its ID. On 2026-10-08 the three folders and three sheets were moved into `TDMS` and every ID was unchanged, so `DRIVE_ROOT_ID` and `DB_ID` did not change.
- **Apps Script projects.** A new project is created at script.google.com and may first appear in the Drive root (My Drive). Move each project by hand into `TDMS/_apps-script`: in Drive, open the menu of the project and choose Move to, then `TDMS` and `_apps-script`. Moving a project is expected to keep its script ID; after the first move, check that the project still opens and that `.clasp.<env>.json` still works. The folder is left empty on purpose.
- The sharing of every item is unchanged: nothing is shared.

## Already created for you (names only)

| What | Name | Used as |
| --- | --- | --- |
| Drive folder (inside the mother folder `TDMS`) | `TDMS-dev` | Script Property `DRIVE_ROOT_ID` |
| Google Sheet, inside that folder | `TDMS-dev-DB` | Script Property `DB_ID` |
| Tab in that sheet | `_meta` | A1 `key`, B1 `value`, A2 `environment`, B2 `dev` |

Both were created in the account's own Drive and not shared with anyone. Claude gave you their IDs in chat. If you ever need them again, open the item in Drive: the folder ID is the last part of the folder URL, and the spreadsheet ID is the part between `/d/` and `/edit`.

## Steps

### 1. Install the tools (once)

- Node.js 22 or newer.
- `npm install -g @google/clasp` (clasp 3.x).
- Turn on the Apps Script API for the account: https://script.google.com/home/usersettings
- `clasp login`, and sign in as `lheii.fcsitraining@gmail.com`.

### 2. Create the Apps Script project

Run from the repository root, on the branch you are deploying:

```
clasp create --type standalone --title "TDMS dev" --rootDir src
mv .clasp.json .clasp.dev.json
git checkout -- src/appsscript.json
git status
```

`clasp create` overwrites `src/appsscript.json` with a default one. The `git checkout` puts the approved manifest back (V8, Asia/Manila, no OAuth scopes, web app run as the owner). `git status` must show a clean tree: `.clasp.dev.json` is git-ignored and must not appear. If `src/appsscript.json` shows as modified, run the `git checkout` line again.

Check that `.clasp.dev.json` contains `"rootDir": "src"`. The template is `.clasp.json.template` at the repository root.

### 3. Set the Script Properties

Open the new project at https://script.google.com, then Project Settings, then Script Properties. Add these three, with the values from Claude's message:

| Property | Value |
| --- | --- |
| `ENV` | `dev` |
| `DB_ID` | the ID of `TDMS-dev-DB` |
| `DRIVE_ROOT_ID` | the ID of the `TDMS-dev` folder |

Two more are listed in ARCHITECTURE §16.2 and are **set in a later slice**: `ARCHIVE_IDS` (archive spreadsheets, when archiving is built) and `BACKUP_ROOT_ID` (backup folder, slice 6-006). Do not add them now.

### 4. Check the deploy script, then push

```
node tools/deploy.js dev --dry-run
node tools/deploy.js dev
```

The dry run prints `clasp push --project .clasp.dev.json` and pushes nothing. The script refuses if `.clasp.dev.json` is missing, still has the template placeholder, or has a `rootDir` other than `src`. It never pushes `live` without `--live`.

### 5. Check the project

In the Apps Script editor, open Project Settings. The time zone must be `(GMT+08:00) Asia/Manila` (manifest `timeZone`) and the runtime V8. The project has no code yet beyond the manifest, so there is nothing to run.

Do not create a web app deployment yet. That belongs to slice 0-005 (spike S-06).

### 6. Environment guard (what exists in 0-002)

Per [ARCHITECTURE §16.3](../ARCHITECTURE.md), when the guard finds a mismatch it must disable all writes and return `SERVER` with a guard code. **In 0-002 only the pure comparison exists**, in `src/core/envGuard.js`, proven by the Node tests (`npm test`, file `tests/core/env-guard.test.js`). Nothing reads Script Properties or the `_meta` tab yet, so a mismatched environment is not refused at run time. That runtime behaviour arrives in slice 2-006.

To check by hand for now: `ENV` in Script Properties must equal the `environment` value in the `_meta` tab (`dev` for both). Valid values are exactly `dev`, `test` and `live`, written in lower case.

## Notes

- **Web app access.** The manifest uses `executeAs: USER_DEPLOYING` and `access: ANYONE_ANONYMOUS` (ARCHITECTURE AD-01), because users sign in with Employee ID and not a Google identity. The fallback `DOMAIN` exists only on a Google Workspace account; a personal Gmail account cannot use it. Spike S-06 (slice 0-005) decides.
- **OAuth scopes.** `oauthScopes` is empty on purpose: 0-002 uses no Google service. Each later slice adds only the scope its adapter needs.
- **Test and live.** `test` is described below (slice 0-003). `live` is described in the last section (slice 0-004).
- **Reset.** To start over, delete the Apps Script project, remove `.clasp.dev.json`, and repeat step 2. The Drive folder and sheet can stay.

## Test environment (TDMS-0-003)

Same account and rules as dev (interim G-01: dev and test only). Nothing here touches `live` or any legacy sheet (SVMI, TL Monitoring, CAPAR, PMS).

### Already created for you (names only)

| What | Name | Used as |
| --- | --- | --- |
| Drive folder (inside the mother folder `TDMS`) | `TDMS-test` | Script Property `DRIVE_ROOT_ID` |
| Google Sheet, inside that folder | `TDMS-test-DB` | Script Property `DB_ID` |
| Tab in that sheet | `_meta` | A1 `key`, B1 `value`, A2 `environment`, B2 `test` |

Both are in the account's own Drive and not shared. Claude gave you the IDs in chat. They never go into the repository.

### Browser-only path (no terminal, no clasp)

Use this path to create the Apps Script project "TDMS test" without installing anything.

1. Open https://script.google.com signed in as `lheii.fcsitraining@gmail.com`. Choose New project and rename it to `TDMS test`.
2. Open Project Settings and turn on "Show appsscript.json manifest file in editor". Back in the editor, open `appsscript.json`.
3. Open `src/appsscript.json` in the repository and copy all of it. Replace the whole content of `appsscript.json` in the editor with it, then save. It sets V8, time zone `Asia/Manila`, no OAuth scopes, and the web app settings.
4. In Project Settings, under Script Properties, add:

| Property | Value |
| --- | --- |
| `ENV` | `test` |
| `DB_ID` | the ID of `TDMS-test-DB` |
| `DRIVE_ROOT_ID` | the ID of the `TDMS-test` folder |

5. Check Project Settings: the time zone must be `(GMT+08:00) Asia/Manila`. Do not create a web app deployment yet (slice 0-005, spike S-06).
6. Check by eye that `ENV` equals the `environment` value in the `_meta` tab (`test`). The run-time guard arrives in slice 2-006.

`clasp` and `tools/deploy.js` are only needed once real code exists to push (slice 1-006, the first deployed shell). Until then the project holds only the manifest. When that time comes, the terminal path is the same as dev: `clasp create` (then the `mv` and `git checkout` fixes in step 2 above), `.clasp.test.json`, and `node tools/deploy.js test`. Deploying `test` never needs `--live`, and `deploy.js` refuses `--live` for any environment other than `live`.

### Reset to seed

No tables or seed data exist yet, so there is nothing to reset. The procedure is documented when the first tables and seed tools arrive.

## Live shell (TDMS-0-004)

Same account (D069). This creates an **empty shell only**: no data, no users, no web app deployment, no code push.

### Already created for you (names only)

| What | Name | Used as |
| --- | --- | --- |
| Drive folder (inside the mother folder `TDMS`) | `TDMS-live` | Script Property `DRIVE_ROOT_ID` |
| Google Sheet, inside that folder | `TDMS-live-DB` | Script Property `DB_ID` |
| Tab in that sheet | `_meta` | A1 `key`, B1 `value`, A2 `environment`, B2 `live` |

Both are in the account's own Drive and not shared. Claude gave you the IDs in chat. They never go into the repository.

### Browser-only path (tablet, no terminal)

1. Open https://script.google.com signed in as `lheii.fcsitraining@gmail.com`. Choose New project and rename it to `TDMS live`.
2. Open Project Settings and turn on "Show appsscript.json manifest file in editor". Back in the editor, open `appsscript.json`.
3. Open `src/appsscript.json` in the repository and copy all of it. Replace the whole content of `appsscript.json` in the editor with it, then save.
4. In Project Settings, under Script Properties, add:

| Property | Value |
| --- | --- |
| `ENV` | `live` |
| `DB_ID` | the ID of `TDMS-live-DB` |
| `DRIVE_ROOT_ID` | the ID of the `TDMS-live` folder |

5. Check Project Settings: the time zone must be `(GMT+08:00) Asia/Manila`. Do **not** create a web app deployment.
6. Check by eye that `ENV` equals the `environment` value in the `_meta` tab (`live`). The run-time guard arrives in slice 2-006.

### Before any real data

- Turn on 2-step verification on the account.
- Name the backup editor (gate G-08, open). Close it **before the first real data import**.
- Limit or disable the Claude Drive/Sheets connectors for this account, or move live to an account without them (gate G-09), **before real employee data enters live**.
- No real data in live before slice 2-006 (the environment guard refuses at run time).
- Deploy to live only when Leo says so, after a dated live backup: `node tools/deploy.js live --live --backup-date yyyy-mm-dd`. The date is a reminder, not proof of a backup.
- To move the account later, follow [account-transfer](account-transfer.md).

