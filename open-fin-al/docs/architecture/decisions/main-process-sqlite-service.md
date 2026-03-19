# Architecture decision: standardize local persistence on a main-process SQLite service

- **Status:** Accepted
- **Date:** 2026-03-19

## Context

OpenFinAL packages SQLite for a desktop-only persistence story. The repository already converged on `better-sqlite3` and a centralized `src/main/services/databaseService.js`, but contributors still need a clear rule for where database ownership belongs.

## Decision

Treat SQLite as a **main-process-owned service**:

- `src/main/services/databaseService.js` owns connection lifecycle and query execution
- renderer access happens through preload and IPC contracts
- `better-sqlite3` is the standard packaged driver
- migrations remain under `src/Database/migrations/**` and are orchestrated through `MigrationManager`

## Consequences

### Positive

- There is one authoritative connection lifecycle.
- Database work stays on the Node/Electron side of the boundary.
- Packaging and migration behavior are easier to reason about.

### Trade-offs

- Existing renderer-side SQLite gateway classes still contain SQL and are not fully abstracted yet.
- Database APIs are asynchronous from the renderer perspective even though the main-process driver is synchronous internally.

## Notes for contributors

Do not add new direct SQLite library usage in renderer code. If a feature needs persistence, extend the main-process service and expose the narrowest preload/API shape required by the renderer.
