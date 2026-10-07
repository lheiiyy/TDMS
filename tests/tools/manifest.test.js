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

test('manifest: no OAuth scopes in 0-002; each later slice adds the scope its adapter needs', () => {
  assert.deepEqual(manifest.oauthScopes, []);
});

test('manifest: holds no script, spreadsheet or Drive ID', () => {
  assert.doesNotMatch(JSON.stringify(manifest), /[A-Za-z0-9_-]{25,}/);
});
