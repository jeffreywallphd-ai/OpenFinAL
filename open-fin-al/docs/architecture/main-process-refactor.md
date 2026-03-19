# Main process refactor

## Goals

The Electron main process was split into focused modules so `src/main.js` can stay a thin startup/composition entry point while behavior and IPC channel names remain stable.

## Module boundaries

### Composition root

- `src/main.js` handles Electron startup, Squirrel bootstrap checks, and delegates to `src/main/index.js`.
- `src/main/index.js` wires infrastructure dependencies together, registers IPC handlers, starts the proxy server, applies the Content Security Policy, and owns app lifecycle orchestration.

### Window creation

- `src/main/window/createMainWindow.js` creates the primary application window with the same security posture as before.
- `src/main/window/createUrlWindow.js` creates the external URL window and supports hidden text extraction for the existing scraping flow.

### IPC registration

Each IPC registration module maps stable channel names to a specific service boundary:

- `registerConfigHandlers.js`
- `registerVaultHandlers.js`
- `registerFileHandlers.js`
- `registerDatabaseHandlers.js`
- `registerYahooHandlers.js`
- `registerTransformersHandlers.js`
- `registerPuppeteerHandlers.js`
- `registerWindowHandlers.js`

### Services

- `services/configService.js`: user-data path setup, username lookup, config file persistence, and asset path resolution.
- `services/certificateService.js`: certificate fingerprint lookup, storage, and refresh logic.
- `services/proxyServer.js`: Express proxy startup plus request/certificate validation flow.
- `services/secretService.js`: OS vault reads/writes through Keytar.
- `services/fileService.js`: UTF-8 and binary file reads.
- `services/databaseService.js`: SQLite connection management and query helpers.
- `services/transformersService.js`: transformers pipeline configuration and model reuse.
- `services/yahooFinanceService.js`: lazy Yahoo Finance API access.
- `services/puppeteerService.js`: page text extraction for automation/scraping.

## Dependency direction

The composition root injects process-level dependencies into services and passes those services into IPC registration modules. This keeps Electron-specific glue near startup while making core logic easier to unit test.

## Remaining technical debt

- Database migrations are still present but not yet enabled in runtime, matching the previous behavior.
- `get-user-path` still returns `app.getAppPath()` because that was the pre-existing contract exposed to the renderer.
- The proxy server still runs as a local Express process on port `3001`; future work could make lifecycle shutdown and port configurability explicit.
