# Test Strategy v0.2
Levels: rules (pure, no Sheets) · service · repository against the test spreadsheet · permission matrix (every PERM × role × scope, deny by default) · API contract · UI smoke on phone width · regression · historical (config change must not alter old results) · month-close.
Test ID families (from BUSINESS-RULES; the permission family is written TEST-PERM-nnn to avoid clashing with matrix capability ids PERM-nnn): AUTH, TEST-PERM, EMP, TRAIN, TL, CERT, CAPAR, RISK, VISIT, CAL, KPI, CLOSE, REPORT, ADMIN, AUDIT, PLAT, FILE. Added by ROADMAP v1.0: DATA (repository/schema), JOB (queue/worker), TEST-CFG (settings; avoids clashing with CFG-nnn setting ids). Also API-001..020 (API-CONTRACT §10) and ARC-01..12 (ARCHITECTURE §0.6).
Verified worked examples from the Handover (dates, trainee grade, TL formula, penalty decay) become fixed test vectors. Store Health parity tests need SVMKPI_RISK.gs (ISS-P1-07).
Cells marked `?` in PERMISSIONS.md are tested as **deny** until decided.
Done = Instruction §26.
