# src/repository

Table registry, readers/writers, unit of work, counters, history writers. Exposes entity operations, never ranges or sheet names.

- May call: platform adapters (lock, cache, props) and `SpreadsheetApp` (only here, ARC-01).
- Must not call: services or rules.
