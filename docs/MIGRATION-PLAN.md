# Migration Plan v0.1
**One-time imports (D025, D047):** HR employee masterlist, TDD team, stores/brands/positions/stations, SVMI visit history, legacy TL monitoring (mapping needs sample files: ISS-P2-06). Imports go through a review step (D023); databases are built from scratch (D047).
**Legacy sheets** become read-only per phase exit (Handover §10).
**Future PostgreSQL (D041):** keep stable prefixed IDs, one repository interface, no business logic in sheet formulas, tables mirror DATA-MODEL entities, history tables append-only so they migrate as rows. Plan itself deferred to v2.
