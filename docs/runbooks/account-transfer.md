# Runbook: moving TDMS to another Google account

Status: **draft. No step has been rehearsed.** Decision: D069 (one personal Gmail owns dev, test and live; ownership must stay easy to move). Owner: Leo.

**[VERIFY]** means "to verify in spike S-09 (slice 0-011)". It marks every claim about how Google handles ownership, deployments, triggers, quotas or sign-in that has not been checked. Until S-09 is done and its results are written here, treat every [VERIFY] item as unknown. Nothing below is a guarantee.

## 1. What is tied to the account

| Item | How it is tied | Survives a move? | If not |
| --- | --- | --- | --- |
| Apps Script project (one per environment) | Owned by the account that created it; has a script ID | [VERIFY] whether ownership can be transferred | Recreate the project under the new account (new script ID), push the same commit |
| Script Properties (`ENV`, `DB_ID`, `DRIVE_ROOT_ID`; later `ARCHIVE_IDS`, `BACKUP_ROOT_ID`, mail sender, AI key if used) | Stored inside the project | [VERIFY] whether they travel with the project | Enter them again; Leo keeps the values offline, never in the repository |
| Database spreadsheet | Owned by the account; has an ID | [VERIFY] whether ownership transfer keeps the ID | A copy gets a new ID: change `DB_ID` |
| Mother folder `TDMS` and its Drive folder tree (D070): `TDMS-dev`, `TDMS-test`, `TDMS-live`, `_apps-script`, files, nightly backups | Owned by the account; `TDMS` is the single unit to transfer | [VERIFY] whether folder and file IDs stay the same | The `files` table stores Drive file IDs (ARCHITECTURE §9). Copies get new IDs, so a remap tool would be needed (not built) |
| Web app deployment and URL | Runs as the owner (`USER_DEPLOYING`, AD-01) | [VERIFY] whether the deployment and URL survive | Create a new versioned deployment; tell users the new URL |
| Triggers (the time-driven job worker, AD-07) | Created by and run as one account | [VERIFY] whether they can be moved | Delete and recreate under the new owner |
| Authorisation of scopes | The owner authorises the script | [VERIFY] what the new owner must do on first run | Open the project and run once as the new owner |
| Mail sender (CFG-007) | The address that sends reset links and notices | [VERIFY] whether the new account may send as the configured address and its daily mail limit | Change CFG-007 to the new account |
| Quotas (mail, triggers, run time, concurrency) | Per account type | [VERIFY] limits of the new account (personal and Workspace may differ) | Re-size digest and job rates |
| Editors (backup editor, G-08: `Hrad.tnd@gmail.com`, answered 2026-10-08, not shared yet) | Sharing lists on the `TDMS-live` folder and the "TDMS live" project (never the mother folder, D070) | Not carried over by default [VERIFY] | Share again with the same people |
| `clasp` login | `.clasprc.json` on each computer, per account | No | `clasp logout`, `clasp login` as the new account, delete the old file |
| `.clasp.<env>.json` | Holds the script ID, local and git-ignored | Only if the script ID is unchanged | Edit `scriptId` |
| Account security | 2-step verification and recovery options of the account | No | Turn on 2-step verification on the new account before it owns anything |
| Claude Drive/Sheets connectors | Connected to one account (gate G-09: to be disabled for the live account before real employee data, answered 2026-10-08) | No | Keep them off for live; reconnect only as Leo decides |
| GitHub `lheiiyy/TDMS`, CI | Not Google-bound; CI holds no Google credential | Yes | Nothing |

**Where things live (D070).** The mother folder `TDMS` holds `TDMS-dev`, `TDMS-test`, `TDMS-live` (each with its database sheet) and `_apps-script`. Apps Script projects are created at script.google.com and moved by hand into `_apps-script`; whether a project counts as part of the folder when ownership moves is [VERIFY]. Moving a Drive item keeps its ID (confirmed for the folders and sheets on 2026-10-08), so `DRIVE_ROOT_ID` and `DB_ID` are not affected by the layout.

TDMS users and audit columns use employee IDs (D024), not Google accounts, so history does not depend on who owns the files.

## 2. Before a move

1. The backup editor is `Hrad.tnd@gmail.com` (G-08, answered 2026-10-08). Once Leo has shared the `TDMS-live` folder and the "TDMS live" project with it, keep it on them. It appears to be a department mailbox: keep 2-step verification on and limit who holds the password. It is the safest second hand-holder, and the natural first recipient.
2. Have the new account ready: 2-step verification on, recovery email and phone set.
3. Make sure S-09 has been run and its results recorded in this file. If not, rehearse on **test** first, never on live.

## 3. Steps

1. **Announce a maintenance window** and stop writes. Use the maintenance flag in `_meta` once slice 2-006 exists; before that, live has no users, so just stop using it.
2. **Take a dated backup** of the database and the Drive tree (ARCHITECTURE §17). Write down the date. The live deploy script asks for it as `--backup-date`.
3. **Record the inventory**: script ID, deployment ID and URL, the list of triggers, the Script Property names and values (kept offline).
4. **Add the new account as editor** on the Apps Script project, the spreadsheet and the mother folder `TDMS`. This is the only time the mother folder is shared (normally it is never shared, D070): only the new owner account, only for the move. Leo confirms this exception at move time; the alternative is to share and transfer each environment subfolder one by one and recreate `TDMS` under the new account.
5. **Transfer ownership** of the mother folder `TDMS` (one unit), then the spreadsheets and the Apps Script projects, in that order [VERIFY, including whether ownership of a folder carries the items inside it]. If an item cannot be transferred, stop and use section 4.
6. **As the new owner**: open the project, authorise it, and check that the Script Properties are present [VERIFY]. Re-enter any that are missing. `ENV` must stay `live`.
7. **Create a new versioned web app deployment** (execute as the owner; access as AD-01 allows) and note the new URL [VERIFY].
8. **Recreate the triggers** under the new owner [VERIFY].
9. **Update** CFG-007 (mail sender), `clasp login`, and `.clasp.live.json` if the script ID changed. Push code only if needed, with `node tools/deploy.js live --live --backup-date yyyy-mm-dd`.
10. **Smoke test**: the environment guard (`ENV` equals the `_meta` marker), then sign-in, one read and one write (and `system.ping` once it exists).
11. **Lift the maintenance flag.**
12. **Remove the old account's access** to all three items, delete its `.clasprc.json`, and review the connectors. Record the date and the new owner in DECISIONS and PROJECT-STATE.

## 4. Fallback when ownership cannot be transferred (copy and re-point)

1. Make copies of the spreadsheet and the Drive tree under the new account (all IDs change).
2. Create a new Apps Script project there and push the same commit with `clasp`.
3. Enter the Script Properties again, with the new `DB_ID` and `DRIVE_ROOT_ID`.
4. Remap the Drive file IDs stored in the `files` table. **No tool exists for this**; it would be a new slice.
5. Continue from step 7 above.

## 5. Verification (spike S-09, slice 0-011)

Run on the **test** environment, moving it to a second Gmail. Leo must provide the second Gmail, and the "TDMS test" Apps Script project must already exist. For every [VERIFY] row, record: what worked, what did not, the exact steps used, and any change of ID or URL. Then replace "[VERIFY]" in this file with the result and the date.

## 6. Not covered

A move to a company Google Workspace domain (where the "within the company domain" access fallback of AD-01 exists), and the later PostgreSQL migration.
