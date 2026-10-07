# src/api

`tdmsApi` (the single server entry point), request pipeline, method registry and schemas.

- May call: session, permission, settings, services, audit.
- Must not call: the repository directly.
- Public globals are exactly `doGet` and `tdmsApi` (ARC-05, pending).
