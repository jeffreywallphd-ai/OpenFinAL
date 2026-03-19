# Database architecture

## Chosen SQLite library

OpenFinAL now standardizes its desktop-app local persistence path on **`better-sqlite3`**.

### Why `better-sqlite3` was chosen

`better-sqlite3` is the least disruptive path for the current Electron architecture because:

- the main process already packages and ships the native `better-sqlite3` binary in `package.json`;
- the existing migration infrastructure (`src/Database/MigrationManager.js`) already targets `better-sqlite3`;
- the database is only accessed from the Electron main process, where synchronous SQLite calls fit naturally behind async IPC handlers;
- consolidating on one main-process driver removes the previous split where `sqlite3` handled queries while `better-sqlite3` was reserved for partially disabled migrations.

`sqlite3` was therefore removed from the main-process runtime path in favor of a single shared connection managed by `src/main/services/databaseService.js`.

## Current database access paths in the desktop app

There are two renderer-facing access paths today, both terminating in the same main-process database service:

1. **Preferred path:** `window.database.*` from `src/preload.js`.
   - This is the stable preload bridge used by most gateways and interactors.
   - `SQLiteSelect` remains a legacy alias of `SQLiteQuery` so existing renderer code keeps working.
2. **Legacy direct IPC path:** a small amount of renderer code still calls `window.electron.ipcRenderer.invoke('sqlite-query' | 'sqlite-get', ...)` directly.
   - Those calls continue to work because the same IPC contracts remain registered.
   - New code should not use direct channel strings from the renderer.

On the main side, every database IPC request now flows through `registerDatabaseHandlers()` into the centralized `databaseService.execute()` helper.

## Connection and initialization flow

The intended flow is:

1. `bootstrapMainProcess()` creates a single `databaseService` instance.
2. The first database operation lazily opens one shared `better-sqlite3` connection for the app session.
3. The service enables connection-level pragmas (`foreign_keys`, `journal_mode=WAL`).
4. Existing databases trigger migration checks during first access.
5. New databases are still bootstrapped by the existing renderer-triggered `SQLiteInit(schema)` flow.
6. After `SQLiteInit(schema)` executes the base schema, migrations are run immediately.
7. The shared connection is closed during Electron `before-quit`.

This keeps renderer behavior stable while making connection lifecycle explicit and centralized in one service.

## How migrations are intended to work

### Current behavior

Migrations live in `src/Database/migrations/*.sql` and are orchestrated by `src/Database/MigrationManager.js`.

- A `migrations` bookkeeping table is created automatically.
- Migration files are applied in filename order.
- Successful migrations are recorded in the `migrations` table.
- Duplicate-column errors are treated as skippable for legacy databases whose schema already includes the migrated column definitions.

### Important constraint

The current migration set assumes the base application schema already exists, especially the `User` table. For that reason, the service only runs migrations when the base `User` table is present.

This means the present migration strategy is:

- **base schema creation:** still handled by `SQLiteInit(schema)` from the existing table-creation gateway;
- **incremental updates:** handled by `MigrationManager` after the base schema exists.

### Deferred cleanup

A fuller migration-first bootstrap model is still deferred because the repository currently mixes:

- large renderer-owned schema creation SQL;
- repository/gateway classes that assume tables are initialized externally; and
- legacy direct IPC usage in a few SQLite gateways.

Refactoring all repositories/gateways to a migration-only bootstrap path would be broader than this change set. Until that follow-up lands, new migrations should continue to assume the base schema already exists.

## How new database-facing code should be written

### Main-process code

- Route all new database work through `src/main/services/databaseService.js`.
- Prefer `databaseService.execute({ query, parameters, mode })` for new handler/service code.
- Use `mode: 'all'` for row arrays, `mode: 'get'` for a single row, and `mode: 'run'` for writes.
- Do not create ad hoc SQLite connections in handlers or services.

### Renderer code

- Use `window.database.SQLiteQuery`, `SQLiteGet`, `SQLiteInsert`, `SQLiteUpdate`, or `SQLiteDelete` through the preload bridge.
- Do **not** invoke raw IPC channel strings from the renderer for new code.
- Do **not** import any SQLite library into renderer code.

### Schema and migration guidance

- If a change is part of the established base schema, update the base schema definition carefully.
- If a change must preserve existing user databases, add a new numbered migration in `src/Database/migrations`.
- Keep migrations idempotent where possible because legacy databases may already contain parts of the expected shape.

## Remaining technical debt

The local persistence layer is now centralized at the connection/service level, but some technical debt remains in repository/gateway code:

- several SQLite gateways still construct SQL inline inside renderer-side classes;
- `SQLiteSelect` / `SQLiteSelectData` remain for compatibility and should eventually be reduced to a smaller API surface;
- some renderer code still bypasses the preload `window.database` bridge and calls raw IPC channels directly;
- the large schema string in `SQLiteTableCreationGateway.ts` is still the base-schema source of truth instead of a dedicated main-process schema module.

Those are good follow-up candidates once repository/gateway rewrites are in scope.
