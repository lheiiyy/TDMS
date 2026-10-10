'use strict';
// Deploy script (tools/deploy.js): refusals and the exact clasp command. No real clasp, no network.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { main } = require('../../tools/deploy');
const lib = require('../../tools/lib/deploy-args');

const ROOT = '/repo';
const TODAY = '2026-10-08';
const good = (extra) => JSON.stringify(Object.assign({ scriptId: 'FAKE-SCRIPT-ID', rootDir: 'src' }, extra));

function run(argv, files, spawn, platform) {
  const out = { logs: [], errors: [], spawned: [] };
  const present = Object.assign({ [path.join(ROOT, 'src', 'appsscript.json')]: '{}' }, files);
  const deps = {
    root: ROOT,
    platform: platform || 'linux',
    fs: { existsSync: (p) => p in present, readFileSync: (p) => present[p] },
    spawnSync: (cmd, args, opts) => { out.spawned.push({ cmd, args, opts }); return spawn || { status: 0 }; },
    log: (m) => out.logs.push(m),
    error: (m) => out.errors.push(m),
    today: () => TODAY,
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
    today: () => TODAY,
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

test('deploy: test never deploys live: --live is refused and the live config is never read for it', () => {
  const files = { [cfgFile('live')]: good(), [cfgFile('test')]: good() };
  let r = run(['test', '--live'], files);
  assert.equal(r.code, 1);
  assert.equal(r.spawned.length, 0);
  r = run(['test'], { [cfgFile('live')]: good() });
  assert.equal(r.code, 1);
  assert.match(r.errors[0], /Missing \.clasp\.test\.json/);
  assert.equal(r.spawned.length, 0);
});

test('deploy: live runs only with --live and a fresh --backup-date', () => {
  for (const day of [TODAY, '2026-10-07']) {
    const r = run(['live', '--live', '--backup-date', day], { [cfgFile('live')]: good() });
    assert.equal(r.code, 0, day);
    assert.deepEqual(r.spawned[0].args, ['push', '--project', '.clasp.live.json']);
    assert.ok(r.logs[0].includes('LIVE'));
    assert.ok(r.logs.some((l) => l.includes('reminder only')), 'must say the date is a reminder, not proof');
  }
});

test('deploy: live is refused without a backup date, or with a missing value', () => {
  for (const argv of [['live', '--live'], ['live', '--live', '--backup-date'], ['live', '--live', '--backup-date', '--dry-run']]) {
    const r = run(argv, { [cfgFile('live')]: good() });
    assert.equal(r.code, 1, argv.join(' '));
    assert.equal(r.spawned.length, 0);
    assert.match(r.errors[0], /backup-date/);
  }
});

test('deploy: live is refused for a backup date that is stale, in the future or not a real date', () => {
  for (const day of ['2026-10-06', '2026-09-01', '2026-10-09', '2027-01-01', '2026-13-40', '2026-02-30', '2026-10-8', '08-10-2026', 'yesterday', '']) {
    const r = run(['live', '--live', '--backup-date', day], { [cfgFile('live')]: good() });
    assert.equal(r.code, 1, JSON.stringify(day));
    assert.equal(r.spawned.length, 0);
    assert.match(r.errors[0], /backup-date/);
  }
});

test('deploy: --backup-date is refused for dev and test, and a dry run for live still needs a valid date', () => {
  for (const env of ['dev', 'test']) {
    const r = run([env, '--backup-date', TODAY], { [cfgFile(env)]: good() });
    assert.equal(r.code, 1);
    assert.equal(r.spawned.length, 0);
  }
  let r = run(['live', '--live', '--dry-run'], { [cfgFile('live')]: good() });
  assert.equal(r.code, 1);
  r = run(['live', '--live', '--dry-run', '--backup-date', TODAY], { [cfgFile('live')]: good() });
  assert.equal(r.code, 0);
  assert.equal(r.spawned.length, 0);
});

test('deploy: clasp failure and a missing clasp binary are reported', () => {
  let r = run(['dev'], { [cfgFile('dev')]: good() }, { status: 3 });
  assert.equal(r.code, 3);
  r = run(['dev'], { [cfgFile('dev')]: good() }, { error: new Error('ENOENT') });
  assert.equal(r.code, 1);
  assert.match(r.errors[0], /npm install -g @google\/clasp/);
});

test('deploy: non-win32 runs clasp directly, without a shell', () => {
  for (const platform of ['linux', 'darwin']) {
    const r = run(['dev'], { [cfgFile('dev')]: good() }, null, platform);
    assert.equal(r.spawned[0].cmd, 'clasp');
    assert.deepEqual(r.spawned[0].args, ['push', '--project', '.clasp.dev.json']);
    assert.equal(r.spawned[0].opts.shell, false);
  }
});

test('deploy: win32 runs clasp through a shell with one fixed command string', () => {
  const r = run(['test'], { [cfgFile('test')]: good() }, null, 'win32');
  assert.equal(r.code, 0);
  assert.equal(r.spawned.length, 1);
  assert.equal(r.spawned[0].cmd, 'clasp push --project .clasp.test.json');
  assert.deepEqual(r.spawned[0].args, []);
  assert.equal(r.spawned[0].opts.shell, true);
  assert.equal(r.spawned[0].opts.cwd, ROOT);
});

test('deploy: win32 live guards are unchanged', () => {
  const files = { [cfgFile('live')]: good() };
  let r = run(['live'], files, null, 'win32');
  assert.equal(r.code, 1);
  r = run(['live', '--live'], files, null, 'win32');
  assert.equal(r.code, 1);
  assert.equal(r.spawned.length, 0);
  r = run(['live', '--live', '--backup-date', TODAY], files, null, 'win32');
  assert.equal(r.spawned[0].cmd, 'clasp push --project .clasp.live.json');
});

test('deploy: a hostile environment name is refused before anything is spawned, on every platform', () => {
  const hostile = ['dev & calc', 'dev && del *', 'dev|whoami', 'dev;ls', '$(id)', '`id`', 'dev"', '..\\dev', 'dev\ncalc'];
  for (const platform of ['win32', 'linux']) {
    for (const env of hostile) {
      const r = run([env], { [cfgFile(env)]: good() }, null, platform);
      assert.equal(r.code, 1, env);
      assert.equal(r.spawned.length, 0, env);
    }
  }
});

test('deploy lib: claspInvocation refuses any argument outside the allowlist', () => {
  for (const platform of ['win32', 'linux']) {
    for (const bad of ['a b', 'a&b', 'a|b', 'a;b', 'a>b', '%PATH%', '$(x)', '"x"', '']) {
      assert.equal(lib.claspInvocation(['push', '--project', bad], platform).ok, false, bad);
    }
  }
});

test('deploy: on win32 the ENOENT message keeps "Could not run clasp" and adds the clasp.cmd hint', () => {
  let r = run(['dev'], { [cfgFile('dev')]: good() }, { error: new Error('ENOENT') }, 'win32');
  assert.match(r.errors[0], /Could not run clasp/);
  assert.match(r.errors[0], /clasp\.cmd must be on PATH/);
  r = run(['dev'], { [cfgFile('dev')]: good() }, { error: new Error('ENOENT') }, 'linux');
  assert.match(r.errors[0], /Could not run clasp/);
  assert.doesNotMatch(r.errors[0], /clasp\.cmd/);
});

test('deploy lib: the environment list is dev, test, live and file names follow .clasp.<env>.json', () => {
  assert.deepEqual(lib.ENVIRONMENTS, ['dev', 'test', 'live']);
  assert.equal(lib.configFileName('test'), '.clasp.test.json');
});
