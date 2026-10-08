'use strict';
// Pure checks for tools/deploy.js. No file, process or network access here.
const ENVIRONMENTS = ['dev', 'test', 'live'];

function configFileName(env) {
  return '.clasp.' + env + '.json';
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toUtcDay(s) {
  if (!DATE_RE.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== m - 1 || back.getUTCDate() !== d) return null;
  return t / 864e5;
}

// Live deploys need a backup date: a valid yyyy-mm-dd, not in the future, at most one day before today.
// This is a reminder that a backup is due. It cannot prove that a backup exists.
function checkBackupDate(value, today) {
  const b = toUtcDay(value || '');
  const t = toUtcDay(today || '');
  if (b === null) return '--backup-date must be a real date written yyyy-mm-dd.';
  if (t === null) return 'Today\'s date could not be determined.';
  if (b > t) return '--backup-date is in the future.';
  if (t - b > 1) return '--backup-date is more than 1 day old. Take a fresh backup first.';
  return null;
}

// argv: arguments after the script name; today: yyyy-mm-dd (Asia/Manila), passed in so this stays pure.
// Returns { ok, env, live, dryRun, backupDate } or { ok: false, error }.
function parseArgs(argv, today) {
  let env = null;
  let live = false;
  let dryRun = false;
  let backupDate = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--live') live = true;
    else if (a === '--dry-run') dryRun = true;
    else if (a === '--backup-date') {
      i++;
      if (i >= argv.length || argv[i].startsWith('-')) return refuse('--backup-date needs a value: --backup-date yyyy-mm-dd');
      backupDate = argv[i];
    } else if (a.startsWith('-')) return refuse('Unknown option: ' + a);
    else if (env === null) env = a;
    else return refuse('Only one environment may be given.');
  }
  if (env === null) return refuse('Environment is required: node tools/deploy.js <dev|test|live> [--live] [--dry-run]');
  if (ENVIRONMENTS.indexOf(env) === -1) return refuse('Unknown environment "' + env + '". Use dev, test or live.');
  if (env === 'live' && !live) return refuse('Refusing to deploy to live without the explicit --live flag.');
  if (env !== 'live' && live) return refuse('--live is only valid with the live environment.');
  if (env !== 'live' && backupDate !== null) return refuse('--backup-date is only valid with the live environment.');
  if (env === 'live') {
    if (backupDate === null) return refuse('Live deploys need --backup-date yyyy-mm-dd (a dated live backup, taken today or yesterday).');
    const problem = checkBackupDate(backupDate, today);
    if (problem) return refuse(problem);
  }
  return { ok: true, env: env, live: live, dryRun: dryRun, backupDate: backupDate };
}

// cfg: parsed contents of .clasp.<env>.json. Returns a list of problems ([] = usable).
function validateClaspConfig(cfg, file) {
  const problems = [];
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) return [file + ' must contain a JSON object.'];
  const id = cfg.scriptId;
  if (typeof id !== 'string' || id.trim() === '') problems.push(file + ': scriptId is missing.');
  else if (/^<.*>$/.test(id.trim())) problems.push(file + ': scriptId is still the template placeholder.');
  if (cfg.rootDir !== 'src') problems.push(file + ': rootDir must be "src".');
  return problems;
}

function claspPushArgs(file) {
  return ['push', '--project', file];
}

function refuse(error) {
  return { ok: false, error: error };
}

module.exports = { ENVIRONMENTS, configFileName, parseArgs, checkBackupDate, validateClaspConfig, claspPushArgs };
