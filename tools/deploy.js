#!/usr/bin/env node
'use strict';
// Owner-run deploy: pushes src/ to the Apps Script project of one environment with clasp.
// Usage: node tools/deploy.js <dev|test> [--dry-run]
//        node tools/deploy.js live --live --backup-date yyyy-mm-dd [--dry-run]
// Reads the local, git-ignored .clasp.<env>.json (never committed; it carries the script ID).
// No dependencies. See tools/README.md.
const path = require('node:path');
const lib = require('./lib/deploy-args');

const ROOT = path.resolve(__dirname, '..');

function realDeps() {
  return {
    fs: require('node:fs'),
    spawnSync: require('node:child_process').spawnSync,
    log: function (m) { console.log(m); },
    error: function (m) { console.error(m); },
    root: ROOT,
    // Today in Asia/Manila as yyyy-mm-dd (the project time zone, gate G-03).
    today: function () { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); },
  };
}

// Returns the process exit code. 1 = refused; otherwise clasp's own status.
function main(argv, deps) {
  deps = deps || realDeps();
  const parsed = lib.parseArgs(argv, deps.today());
  if (!parsed.ok) return refuse(deps, parsed.error);

  const file = lib.configFileName(parsed.env);
  const abs = path.join(deps.root, file);
  if (!deps.fs.existsSync(abs)) {
    return refuse(deps, 'Missing ' + file + '. Copy .clasp.json.template to ' + file + ' and fill in the script ID for ' + parsed.env + '.');
  }
  let cfg;
  try {
    cfg = JSON.parse(deps.fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    return refuse(deps, file + ' is not valid JSON.');
  }
  const problems = lib.validateClaspConfig(cfg, file);
  if (problems.length) return refuse(deps, problems.join('\n'));
  if (!deps.fs.existsSync(path.join(deps.root, 'src', 'appsscript.json'))) {
    return refuse(deps, 'src/appsscript.json is missing. Restore it with: git checkout -- src/appsscript.json');
  }

  const args = lib.claspPushArgs(file);
  deps.log('Environment: ' + parsed.env + (parsed.live ? ' (LIVE, explicit)' : ''));
  if (parsed.live) deps.log('Backup date: ' + parsed.backupDate + ' (a reminder only; this script cannot verify that a backup exists).');
  deps.log('Command: clasp ' + args.join(' '));
  if (parsed.dryRun) {
    deps.log('Dry run: nothing was pushed.');
    return 0;
  }
  const res = deps.spawnSync('clasp', args, { cwd: deps.root, stdio: 'inherit' });
  if (res.error) return refuse(deps, 'Could not run clasp: ' + res.error.message + '. Install it with: npm install -g @google/clasp');
  return typeof res.status === 'number' ? res.status : 1;
}

function refuse(deps, message) {
  deps.error('Refused: ' + message);
  return 1;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { main };
