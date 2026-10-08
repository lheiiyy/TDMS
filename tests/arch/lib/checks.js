'use strict';
// Implementations of the active architecture checks (ARCHITECTURE §0.6).
// Each check takes a repository root and returns a list of violations ([] = pass).
const path = require('node:path');
const fs = require('node:fs');
const S = require('./scan');

const adapter = (...names) => names.map((n) => new RegExp(`^src/platform/${n}([./_-]|/|$)`, 'i'));
const inCore = (n) => [new RegExp(`^src/core/${n}([./_-]|/|$)`, 'i')];

const GOOGLE_SERVICES = /\b(SpreadsheetApp|DriveApp|MailApp|GmailApp|UrlFetchApp|PropertiesService|CacheService|LockService|ScriptApp|Utilities)\b/;

// ARC-01: SpreadsheetApp only under repository/
const arc01 = (root) => S.forbidOutside(root, /\bSpreadsheetApp\b/, [/^src\/repository\//], 'ARC-01');

// ARC-02: DriveApp only in the FileStore and Backup adapters
const arc02 = (root) => S.forbidOutside(root, /\bDriveApp\b/, adapter('filestore', 'backup'), 'ARC-02');

// ARC-03: MailApp/GmailApp only in the Mail adapter; UrlFetchApp only in the Http adapter
const arc03 = (root) => [
  ...S.forbidOutside(root, /\b(MailApp|GmailApp)\b/, adapter('mail'), 'ARC-03'),
  ...S.forbidOutside(root, /\bUrlFetchApp\b/, adapter('http'), 'ARC-03'),
];

// ARC-04: PropertiesService only in core/env; no spreadsheet, folder, script or secret literal elsewhere
const ID_LITERAL = /(['"`])(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{25,}\1/;
const GOOGLE_URL_ID = /(?:\/d\/|\/folders\/|[?&]id=)[A-Za-z0-9_-]{25,}/;
const SECRET_ASSIGN = /\b(password|passwd|secret|api[_-]?key|token)\b\s*[:=]\s*(['"`])[^'"`\s]{8,}\2/i;
const arc04 = (root) => {
  const v = S.forbidOutside(root, /\bPropertiesService\b/, inCore('env'), 'ARC-04');
  for (const f of S.load(root, { keepStrings: true })) {
    for (const re of [ID_LITERAL, GOOGLE_URL_ID, SECRET_ASSIGN]) {
      for (const h of S.findAll(f.text, re)) v.push({ file: f.rel, line: S.lineOf(f.text, h.index), token: h.match.slice(0, 40), rule: 'ARC-04' });
    }
  }
  return v;
};

// ARC-07: rules/ is pure: no platform adapter, no Date.now / new Date(), no Google services, no global state
const arc07 = (root) => {
  const inRules = /^src\/rules\//;
  const v = [
    ...S.forbidInside(root, /\bDate\.now\b|\bnew\s+Date\b|\bDate\s*\(/, inRules, 'ARC-07'),
    ...S.forbidInside(root, GOOGLE_SERVICES, inRules, 'ARC-07'),
    ...S.forbidInside(root, /\b(globalThis|window|global)\b/, inRules, 'ARC-07'),
  ];
  for (const f of S.load(root, { keepStrings: true })) {
    if (!inRules.test(f.rel)) continue;
    for (const h of S.findAll(f.text, /platform\/|\bPlatform\./)) v.push({ file: f.rel, line: S.lineOf(f.text, h.index), token: h.match, rule: 'ARC-07' });
    for (const h of S.topLevelHits(f.text, /\b(let|var)\b/)) v.push({ file: f.rel, line: S.lineOf(f.text, h.index), token: h.match + ' (module-level state)', rule: 'ARC-07' });
  }
  return v;
};

// ARC-08: a service may use only its own repository. Convention (until PH-2 fixes the ownership map):
// src/services/<Name>Service.js (or src/services/<name>/...) owns repository modules/namespaces starting with <Name>.
const ownPrefix = (rel) => {
  const parts = rel.split('/').slice(2);
  const base = parts.length > 1 ? parts[0] : parts[0].replace(/\.[^.]+$/, '');
  return base.replace(/Service$/i, '').toLowerCase();
};
const arc08 = (root) => {
  const v = [];
  for (const f of S.load(root, { keepStrings: true })) {
    if (!f.rel.startsWith('src/services/')) continue;
    const own = ownPrefix(f.rel);
    const refs = [
      ...S.findAll(f.text, /\b([A-Z][A-Za-z0-9]*)Repository\b/).map((h) => ({ ...h, name: h.match.replace(/Repository$/, '') })),
      ...S.findAll(f.text, /repository\/([A-Za-z0-9_-]+)/).map((h) => ({ ...h, name: h.match.split('/')[1] })),
    ];
    for (const r of refs) {
      if (!r.name.toLowerCase().startsWith(own)) v.push({ file: f.rel, line: S.lineOf(f.text, r.index), token: r.match, rule: 'ARC-08' });
    }
  }
  return v;
};

// ARC-10: no Google service or other I/O runs at file load (outside any function body)
const arc10 = (root) => S.loadTopLevel(root, new RegExp(`${GOOGLE_SERVICES.source}|\\bfetch\\s*\\(|\\bfs\\.\\w+`), 'ARC-10');

// Used by the whole-repo secret scan (verification step, not an ARC check).
function scanRepoForIds(root) {
  const skip = new Set(['.git', 'node_modules']);
  const v = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|json|yml|yaml|template|md|html)$/.test(e.name)) {
        const t = fs.readFileSync(p, 'utf8');
        for (const re of [GOOGLE_URL_ID, /AKfycb[A-Za-z0-9_-]{20,}/, /"scriptId"\s*:\s*"(?!<)[A-Za-z0-9_-]{20,}"/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/]) {
          const m = t.match(re);
          if (m) v.push({ file: path.relative(root, p), line: 0, token: m[0].slice(0, 40), rule: 'REPO-ID' });
        }
      }
    }
  };
  walk(root);
  return v;
}

module.exports = { arc01, arc02, arc03, arc04, arc07, arc08, arc10, scanRepoForIds };
