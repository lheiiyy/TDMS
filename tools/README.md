# tools

Owner-run scripts: clasp, deploy, schema check, seed.

| Script | Status |
| --- | --- |
| `deploy.js` | available (TDMS-0-002) |
| schema check, seed, promotion | later slices |

## deploy.js

```
node tools/deploy.js <dev|test> [--dry-run]
node tools/deploy.js live --live --backup-date yyyy-mm-dd [--dry-run]
```

Pushes `src/` with `clasp push --project .clasp.<env>.json`. No dependencies; needs `clasp` installed. It refuses (exit 1, nothing pushed) when:

- the environment is missing or not `dev`, `test` or `live`;
- `live` is requested without `--live`, or `--live` is used with another environment;
- `live` is requested without `--backup-date`, or the date is not a real `yyyy-mm-dd`, is in the future, or is more than 1 day before today (Asia/Manila). `--backup-date` is refused for `dev` and `test`;
- `.clasp.<env>.json` is missing, is not valid JSON, still has the template `scriptId`, or has a `rootDir` other than `src`;
- `src/appsscript.json` is missing.

**The backup date is a reminder, not proof.** The script cannot check that a backup exists. Take the dated live backup first, and deploy to live only when Leo says so (CLAUDE.md).

**Windows.** npm installs clasp as `clasp.cmd`, which Node cannot start without a shell. On Windows only (`win32`) the script therefore runs clasp through the shell, as one fixed command string. The arguments come only from the validated environment name and the fixed config file name, and each must match `[A-Za-z0-9._-]+` or the script refuses before spawning. Mac and Linux run clasp directly, with no shell. If clasp is still not found on Windows, check `where clasp`.

`--dry-run` prints the command and pushes nothing. Setup steps: [docs/runbooks/dev-environment.md](../docs/runbooks/dev-environment.md).

## Future deploy flow (ARCHITECTURE §16.4, approved layout)

- `main` is the release branch. Work happens on short-lived feature branches, one commit per slice milestone citing the task ID and RULE/PERM ids.
- `clasp` pushes the **same commit** to dev, then test, then live. A release is a tagged commit; live uses a **versioned** deployment, not the head `/dev` URL.
- Schema check and additive migrations run on each environment before the code that needs them.
- Promote only when the test environment passes the slice's acceptance checks.
- Rollback = redeploy the previous version.
- Only the owner account deploys. Dev and test use separate Apps Script projects, spreadsheets and Drive folders (AD-12).

## clasp configuration

Copy `.clasp.json.template` (repo root) to `.clasp.<env>.json` locally (for example `.clasp.dev.json`) and fill in the script ID for that environment. `.clasp.json`, `.clasp.*.json`, `.clasprc.json` and `.env*` are git-ignored. Never commit script, spreadsheet or Drive IDs.
