# src/services

One namespace per module (AuthService, VisitService, ...). One writer per entity ([ARCHITECTURE §3](../docs/ARCHITECTURE.md)).

- May call: rules, its own repository, other services' **public API**, platform adapters.
- Must not call: another service's repository (ARC-08), `SpreadsheetApp` (ARC-01), `DriveApp` (ARC-02).
- ARC-08 convention until PH-2: `<Name>Service.js` uses only repository modules named `<Name>*`.
