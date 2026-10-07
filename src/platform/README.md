# src/platform

Adapters: clock, lock, cache, mail, filestore, pdf, http, props. Each wraps one Google service.

- `DriveApp`: filestore and backup only (ARC-02). `MailApp`/`GmailApp`: mail only. `UrlFetchApp`: http only (ARC-03).
- May call: only the service it wraps. Nothing else may call that service.
