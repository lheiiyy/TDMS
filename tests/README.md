# tests

Run with `npm test` (Node built-in runner, no dependencies).

- `rules/`, `services/`: run in Node with fakes, no Sheets.
- `repository/`: contract tests against the TEST spreadsheet (owner-run).
- `arch/`: static architecture checks ARC-nn.
- `plat-001.test.js`: the runner works with no dependencies.
