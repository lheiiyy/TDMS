# tests/arch

Static architecture checks ([ARCHITECTURE §0.6](../../docs/ARCHITECTURE.md)). They scan `src/`, `config/` and `tools/` for forbidden tokens by folder.

| Check | Status |
| --- | --- |
| ARC-01, 02, 03, 04, 07, 08, 10 | active, each with planted-violation fixtures |
| ARC-05, 06, 09, 11, 12 | pending (`pending.test.js`); a later slice activates each |

`lib/scan.js` is the scanner, `lib/checks.js` the check functions, `lib/harness.js` plants violations in a temporary folder. ARC-08 is convention-based until the ownership map exists (PH-2).
