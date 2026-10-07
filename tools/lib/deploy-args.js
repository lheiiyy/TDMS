'use strict';
// Pure checks for tools/deploy.js. No file, process or network access here.
const ENVIRONMENTS = ['dev', 'test', 'live'];

function configFileName(env) {
  return '.clasp.' + env + '.json';
}

// argv: arguments after the script name. Returns { ok, env, live, dryRun } or { ok: false, error }.
function parseArgs(argv) {
  let env = null;
  let live = false;
  let dryRun = false;
  for (const a of argv) {
    if (a === '--live') live = true;
    else if (a === '--dry-run') dryRun = true;
    else if (a.startsWith('-')) return refuse('Unknown option: ' + a);
    else if (env === null) env = a;
    else return refuse('Only one environment may be given.');
  }
  if (env === null) return refuse('Environment is required: node tools/deploy.js <dev|test|live> [--live] [--dry-run]');
  if (ENVIRONMENTS.indexOf(env) === -1) return refuse('Unknown environment "' + env + '". Use dev, test or live.');
  if (env === 'live' && !live) return refuse('Refusing to deploy to live without the explicit --live flag.');
  if (env !== 'live' && live) return refuse('--live is only valid with the live environment.');
  return { ok: true, env: env, live: live, dryRun: dryRun };
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

module.exports = { ENVIRONMENTS, configFileName, parseArgs, validateClaspConfig, claspPushArgs };
