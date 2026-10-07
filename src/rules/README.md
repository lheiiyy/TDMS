# src/rules

Pure business rules: grading, store health, SLA dates, timeline. Plain values in, plain values out.

- May call: other rules, plain data.
- Must not use: any I/O, platform adapter, `Date.now`, `new Date()`, global or module-level state (ARC-07). Settings are passed in.
