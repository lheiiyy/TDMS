'use strict';
// Shared static scanner for the architecture checks (ARCHITECTURE §0.6).
// Plain Node, no dependencies. Scans source text; never executes it.
const fs = require('node:fs');
const path = require('node:path');

const SOURCE_EXT = new Set(['.js', '.gs', '.html', '.json']);
const SCAN_DIRS = ['src', 'config', 'tools'];

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p));
    else if (SOURCE_EXT.has(path.extname(e.name))) out.push(p);
  }
  return out.sort();
}

// Replace comments (always) and string contents (unless keepStrings) with spaces,
// keeping line breaks so reported line numbers stay correct.
function mask(text, { keepStrings = false } = {}) {
  let out = '';
  let i = 0;
  const n = text.length;
  const blank = (s) => s.replace(/[^\n]/g, ' ');
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (c === '/' && d === '/') {
      let j = i;
      while (j < n && text[j] !== '\n') j++;
      out += blank(text.slice(i, j));
      i = j;
    } else if (c === '/' && d === '*') {
      let j = text.indexOf('*/', i + 2);
      j = j === -1 ? n : j + 2;
      out += blank(text.slice(i, j));
      i = j;
    } else if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && text[j] !== c) {
        if (text[j] === '\\') j++;
        j++;
      }
      j = Math.min(j + 1, n);
      const lit = text.slice(i, j);
      out += keepStrings ? lit : c + blank(lit.slice(1, -1)) + c;
      i = j;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

function lineOf(text, index) {
  let line = 1;
  for (let k = 0; k < index; k++) if (text[k] === '\n') line++;
  return line;
}

// Files of a tree (relative to root) with masked content.
function load(root, opts) {
  const files = [];
  for (const d of SCAN_DIRS) {
    for (const abs of listFiles(path.join(root, d))) {
      if (path.extname(abs) === '.json') continue; // data files carry no code
      const rel = path.relative(root, abs).split(path.sep).join('/');
      files.push({ rel, text: mask(fs.readFileSync(abs, 'utf8'), opts) });
    }
  }
  return files;
}

function findAll(text, re) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const hits = [];
  let m;
  while ((m = g.exec(text))) {
    hits.push({ index: m.index, match: m[0] });
    if (m[0].length === 0) g.lastIndex++;
  }
  return hits;
}

// Violation if `re` appears in a file whose path does not match `allowed`.
function forbidOutside(root, re, allowed, label) {
  const v = [];
  for (const f of load(root)) {
    if (allowed.some((a) => a.test(f.rel))) continue;
    for (const h of findAll(f.text, re)) v.push({ file: f.rel, line: lineOf(f.text, h.index), token: h.match, rule: label });
  }
  return v;
}

// Violation if `re` appears in any file whose path matches `inside`.
function forbidInside(root, re, inside, label) {
  const v = [];
  for (const f of load(root)) {
    if (!inside.test(f.rel)) continue;
    for (const h of findAll(f.text, re)) v.push({ file: f.rel, line: lineOf(f.text, h.index), token: h.match, rule: label });
  }
  return v;
}

// Tokens that run at file load: those not inside any function body.
const NOT_FN = /^(if|for|while|switch|catch|with|else|do|try|finally)$/;
function topLevelHits(text, re) {
  const marks = findAll(text, re);
  const hits = [];
  const stack = []; // true = function body
  let mi = 0;
  for (let i = 0; i < text.length; i++) {
    while (mi < marks.length && marks[mi].index === i) {
      if (!stack.includes(true)) hits.push(marks[mi]);
      mi++;
    }
    const c = text[i];
    if (c === '{') {
      const before = text.slice(Math.max(0, i - 200), i);
      const arrow = /=>\s*$/.test(before);
      const fn = /\bfunction\b[^{};]*\)\s*$/.test(before);
      const method = before.match(/(?:^|[\s;{},])(?:async\s+)?(?:static\s+)?([A-Za-z_$][\w$]*)\s*\([^(){};]*\)\s*$/);
      stack.push(arrow || fn || (!!method && !NOT_FN.test(method[1])));
    } else if (c === '}') stack.pop();
  }
  return hits;
}

function loadTopLevel(root, re, label) {
  const v = [];
  for (const f of load(root)) {
    for (const h of topLevelHits(f.text, re)) v.push({ file: f.rel, line: lineOf(f.text, h.index), token: h.match, rule: label });
  }
  return v;
}

function format(violations) {
  return violations.map((x) => `${x.rule} ${x.file}:${x.line} ${x.token}`).join('\n');
}

module.exports = { listFiles, mask, load, findAll, lineOf, forbidOutside, forbidInside, loadTopLevel, topLevelHits, format, SCAN_DIRS };
