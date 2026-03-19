# Architecture decision: modularize the Electron main process

- **Status:** Accepted
- **Date:** 2026-03-19

## Context

The Electron main process had accumulated startup logic, IPC wiring, window creation, and service behavior in a small number of entry files. That made changes risky because unrelated concerns lived together and Electron-specific composition details were mixed with testable service logic.

## Decision

Keep `src/main.js` and `src/main/index.js` as thin startup/composition layers and place main-process behavior into focused modules:

- `src/main/window/**` for window creation
- `src/main/ipc/**` for IPC registration
- `src/main/services/**` for process-owned services

## Consequences

### Positive

- IPC handlers can be tested in isolation.
- Node/Electron integration stays close to the main process instead of leaking into renderer modules.
- Startup code becomes easier to reason about because `bootstrapMainProcess()` wires explicit dependencies.

### Trade-offs

- Adding a new main capability usually requires touching both a service module and an IPC registration module.
- The main-process composition root remains a manual wiring point rather than a DI container.

## Notes for contributors

If new functionality requires Node APIs, secrets, filesystem access, database access, or BrowserWindow ownership, start in `src/main/services/**` and then expose it through `src/main/ipc/**` plus `src/preload.js` only when the renderer truly needs it.
