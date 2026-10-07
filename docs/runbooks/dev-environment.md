# Runbook: dev environment (TDMS-0-002)

Owner: Leo. Account: `lheii.fcsitraining@gmail.com` (interim G-01: dev and test only; the live environment needs the company account, D012). This runbook creates nothing in `live`.

Rules: never commit a script ID, spreadsheet ID or folder ID. The IDs go into the local, git-ignored `.clasp.dev.json` and into Script Properties only ([ARCHITECTURE §16.2](../ARCHITECTURE.md), ARC-04).

## Already created for you (names only)

| What | Name | Used as |
| --- | --- | --- |
| Drive folder | `TDMS-dev` | Script Property `DRIVE_ROOT_ID` |
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
- **Test and live.** `test` repeats these steps in slice 0-003 with `.clasp.test.json` and `ENV` = `test`. `live` waits for slice 0-004 and the company account.
- **Reset.** To start over, delete the Apps Script project, remove `.clasp.dev.json`, and repeat step 2. The Drive folder and sheet can stay.
