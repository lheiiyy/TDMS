'use strict';
// src/appsscript.json: the 0-002 manifest decisions (ARCHITECTURE AD-01, gate G-03).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'appsscript.json'), 'utf8'));

test('manifest: V8 runtime and Asia/Manila time zone', () => {
  assert.equal(manifest.runtimeVersion, 'V8');
  assert.equal(manifest.timeZone, 'Asia/Manila');
});

test('manifest: web app runs as the owner with anonymous access (AD-01; S-06 may change access to DOMAIN)', () => {
  assert.equal(manifest.webapp.executeAs, 'USER_DEPLOYING');
  assert.equal(manifest.webapp.access, 'ANYONE_ANONYMOUS');
});

// SPIKE ONLY (slice 0-005, approved by Leo for the spike): read the _meta tab, and read the remaining mail quota.
// To be reviewed at 0-010 before any live push. Each later slice adds only the scope its adapter needs.
test('manifest: only the two spike-only OAuth scopes are declared (review at 0-010)', () => {
  assert.deepEqual(manifest.oauthScopes, [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/script.send_mail',
  ]);
});

test('manifest: apart from the scopes it is unchanged since 0-002', () => {
  const { oauthScopes, ...rest } = manifest;
  assert.deepEqual(rest, {
    timeZone: 'Asia/Manila',
    runtimeVersion: 'V8',
    exceptionLogging: 'STACKDRIVER',
    webapp: { executeAs: 'USER_DEPLOYING', access: 'ANYONE_ANONYMOUS' },
  });
});

test('manifest: holds no script, spreadsheet or Drive ID', () => {
  assert.doesNotMatch(JSON.stringify(manifest), /[A-Za-z0-9_-]{25,}/);
});
