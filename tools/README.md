# tools

Owner-run scripts: clasp, deploy, schema check, seed. None exist yet (TDMS-0-001 adds structure only).

## Future deploy flow (ARCHITECTURE §16.4, approved layout)

- `main` is the release branch. Work happens on short-lived feature branches, one commit per slice milestone citing the task ID and RULE/PERM ids.
- `clasp` pushes the **same commit** to dev, then test, then live. A release is a tagged commit; live uses a **versioned** deployment, not the head `/dev` URL.
- Schema check and additive migrations run on each environment before the code that needs them.
- Promote only when the test environment passes the slice's acceptance checks.
- Rollback = redeploy the previous version.
- Only the owner account deploys. Dev and test use separate Apps Script projects, spreadsheets and Drive folders (AD-12).

## clasp configuration

Copy `.clasp.json.template` (repo root) to `.clasp.json` locally and fill in the script ID for the environment you are working on. `.clasp.json`, `.clasprc.json` and `.env*` are git-ignored. Never commit script, spreadsheet or Drive IDs.
