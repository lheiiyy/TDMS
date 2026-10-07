'use strict';
// Deploy script (tools/deploy.js): refusals and the exact clasp command. No real clasp, no network.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { main } = require('../../tools/deploy');
const lib = require('../../tools/lib/deploy-args');

const ROOT = '/repo';
const good = (extra) => JSON.stringify(Object.assign({ scriptId: 'FAKE-SCRIPT-ID', rootDir: 'src' }, extra));

function run(argv, files, spawn) {
  const out = { logs: [], errors: [], spawned: [] };
  const present = Object.assign({ [path.join(ROOT, 'src', 'appsscript.json')]: '{}' }, files);
  const deps = {
    root: ROOT,
    fs: { existsSync: (p) => p in present, readFileSync: (p) => present[p] },
    spawnSync: (cmd, args, opts) => { out.spawned.push({ cmd, args, opts }); return spawn || { status: 0 }; },
    log: (m) => out.logs.push(m),
    error: (m) => out.errors.push(m),
  };
  out.code = main(argv, deps);
  return out;
}
const cfgFile = (env) => path.join(ROOT, '.clasp.' + env + '.json');

test('deploy: refuses when no environment is given', () => {
  const r = run([], {});
  assert.equal(r.code, 1);
  assert.equal(r.spawned.length, 0);
  assert.match(r.errors[0], /Environment is required/);
});

test('deploy: refuses an unknown environment, extra arguments and unknown options', () => {
  for (const argv of [['prod'], ['dev', 'test'], ['dev', '--force'], ['--live']]) {
    const r = run(argv, { [cfgFile('dev')]: good() });
    assert.equal(r.code, 1, argv.join(' '));
    assert.equal(r.spawned.length, 0);
  }
});

test('deploy: refuses live without --live, and --live with another environment', () => {
  const live = { [cfgFile('live')]: good(), [cfgFile('dev')]: good() };
  let r = run(['live'], live);
  assert.equal(r.code, 1);
  assert.match(r.errors[0], /explicit --live/);
  assert.equal(r.spawned.length, 0);
  r = run(['dev', '--live'], live);
  assert.equal(r.code, 1);
  assert.equal(r.spawned.length, 0);
});

test('deploy: refuses when the local config file for the environment is missing', () => {
  const r = run(['dev'], {});
  assert.equal(r.code, 1);
  assert.match(r.errors[0], /Missing \.clasp\.dev\.json/);
  assert.equal(r.spawned.length, 0);
});

test('deploy: refuses a config that is invalid JSON, has a placeholder or empty scriptId, or the wrong rootDir', () => {
  const bad = [
    'not json',
    good({ scriptId: '<SCRIPT_ID_FOR_THIS_ENVIRONMENT>' }),
    good({ scriptId: '' }),
    good({ scriptId: undefined }),
    good({ rootDir: '.' }),
    '[]',
  ];
  for (const content of bad) {
    const r = run(['dev'], { [cfgFile('dev')]: content });
    assert.equal(r.code, 1, content);
    assert.equal(r.spawned.length, 0);
  }
});

test('deploy: refuses when src/appsscript.json is missing', () => {
  const out = { errors: [], spawned: [] };
  const deps = {
    root: ROOT,
    fs: { existsSync: (p) => p === cfgFile('dev'), readFileSync: () => good() },
    spawnSync: () => { out.spawned.push(1); return { status: 0 }; },
    log: () => {},
    error: (m) => out.errors.push(m),
  };
  assert.equal(main(['dev'], deps), 1);
  assert.match(out.errors[0], /appsscript\.json/);
  assert.equal(out.spawned.length, 0);
});

test('deploy: --dry-run prints the command and pushes nothing', () => {
  const r = run(['dev', '--dry-run'], { [cfgFile('dev')]: good() });
  assert.equal(r.code, 0);
  assert.equal(r.spawned.length, 0);
  assert.ok(r.logs.some((l) => l === 'Command: clasp push --project .clasp.dev.json'));
});

test('deploy: dev and test run clasp push with their own config file from the repo root', () => {
  for (const env of ['dev', 'test']) {
    const r = run([env], { [cfgFile(env)]: good() });
    assert.equal(r.code, 0);
    assert.equal(r.spawned.length, 1);
    assert.equal(r.spawned[0].cmd, 'clasp');
    assert.deepEqual(r.spawned[0].args, ['push', '--project', '.clasp.' + env + '.json']);
    assert.equal(r.spawned[0].opts.cwd, ROOT);
  }
});

test('deploy: live runs only with the explicit flag', () => {
  const r = run(['live', '--live'], { [cfgFile('live')]: good() });
  assert.equal(r.code, 0);
  assert.deepEqual(r.spawned[0].args, ['push', '--project', '.clasp.live.json']);
  assert.ok(r.logs[0].includes('LIVE'));
});

test('deploy: clasp failure and a missing clasp binary are reported', () => {
  let r = run(['dev'], { [cfgFile('dev')]: good() }, { status: 3 });
  assert.equal(r.code, 3);
  r = run(['dev'], { [cfgFile('dev')]: good() }, { error: new Error('ENOENT') });
  assert.equal(r.code, 1);
  assert.match(r.errors[0], /npm install -g @google\/clasp/);
});

test('deploy lib: the environment list is dev, test, live and file names follow .clasp.<env>.json', () => {
  assert.deepEqual(lib.ENVIRONMENTS, ['dev', 'test', 'live']);
  assert.equal(lib.configFileName('test'), '.clasp.test.json');
});
