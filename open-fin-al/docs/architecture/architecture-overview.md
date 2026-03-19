# OpenFinAL architecture overview

OpenFinAL is an Electron desktop application with a split runtime:

- the **main process** owns OS integration, IPC handlers, local persistence, secret storage, and outbound integrations that require Node/Electron access;
- the **preload bridge** exposes a constrained `window.*` API to the renderer;
- the **renderer** contains React views plus application logic organized into View, Interactor, Gateway, Entity, Utility, and newer `application`/`infrastructure` folders.

This document makes the intended dependency direction explicit, points contributors at the right home for new code, and records which rules are currently enforced automatically.

## Layer map

### Process boundaries

```text
Electron main process
  src/main/**
    -> owns BrowserWindow lifecycle, IPC registration, persistence services, secret storage,
       certificate validation, outbound adapters, and long-running Node integrations

Preload bridge
  src/preload.js
  src/IPC/**
    -> translates typed IPC contracts into safe renderer-facing window APIs

Renderer process
  src/View/**
  src/Interactor/**
  src/Gateway/**
  src/Entity/**
  src/Utility/**
  src/application/**
  src/infrastructure/**
```

### Renderer-side architectural roles

| Layer | Purpose | Examples | Should depend on |
| --- | --- | --- | --- |
| View | React components, routing, UI state, event handling | `src/View/App.jsx`, `src/View/News/Listing.jsx` | Interactor, request models, view-only utilities |
| Interactor / Application | Use-case orchestration and response shaping | `src/Interactor/StockInteractor.ts`, `src/Interactor/InitializationInteractor.ts` | Entity, Gateway ports/implementations, application service interfaces |
| Gateway | External data access, SQLite access, model/provider adapters, presenter/request abstractions | `src/Gateway/Data/**`, `src/Gateway/AI/**`, `src/Gateway/Request/**` | Entity, Utility, application service interfaces, preload APIs during legacy paths |
| Entity / Domain | Core request/entity/value objects and business data shapes | `src/Entity/StockRequest.ts`, `src/Entity/User.ts` | Other entities and narrow shared helpers only; never Electron or `window.*` |
| Utility | Cross-cutting helpers without view concerns | `src/Utility/RequestSplitter.ts`, `src/Utility/PinEncryption.ts` | No View or main-process modules |
| Application service interfaces | Stable renderer-facing ports for infrastructure concerns | `src/application/services/*.ts` | Type definitions only |
| Infrastructure adapters | Electron-specific implementations of service interfaces | `src/infrastructure/electron/*.ts` | `src/application/services/**` and preload `window.*` APIs |

## Intended dependency direction

At a high level, new code should move toward this direction:

```text
View
  -> Interactor / application use cases
    -> Ports / service interfaces / gateway abstractions
      -> Infrastructure adapters or main-process-backed preload APIs

Entity / Domain
  -> should stay inward-facing and framework-agnostic
```

More concretely:

1. **Views call use cases, not Electron APIs directly, whenever practical.**
   - Existing code still has some `window.config` and `window.urlWindow` usage in views.
   - New work should prefer an interactor or a small application-facing adapter when the behavior is more than trivial UI glue.
2. **Interactors coordinate entities and gateways.**
   - They should not import React views or main-process modules.
   - Constructor injection is preferred when an interactor needs a service that ultimately talks to Electron.
3. **Application service interfaces define ports; infrastructure adapters implement them.**
   - The stock slice already follows this pattern with `IConfigService`, `ISecretService`, `IYahooFinanceClient`, and the Electron adapters under `src/infrastructure/electron/`.
4. **Main-process modules stay on the Electron side of the boundary.**
   - `src/main/**` owns Node-only concerns and should not import renderer layers.
5. **Entities stay portable.**
   - Entity/domain code must not depend on `window`, Electron modules, or other renderer globals.

## Current codebase alignment

The current refactored codebase already contains several important architectural seams:

- `src/main/index.js` acts as a composition root for the Electron main process and delegates to focused IPC and service modules.
- `src/IPC/contracts/index.js` centralizes channel names, payload serialization, and light runtime validation shared by preload and main.
- `src/application/services/*.ts` and `src/infrastructure/electron/*.ts` introduce a service-interface seam used by the stock-related renderer path.
- `src/main/services/databaseService.js` centralizes the `better-sqlite3` connection and handler-facing query execution.

These seams are the basis for the rules below.

## Lightweight rules enforced today

The repository now includes `scripts/check-architecture.js`, which is wired into `npm run lint` via `npm run lint:architecture`.

The script intentionally enforces only a small set of stable, high-signal boundaries:

1. **`src/Entity/**` may not import Electron, `src/main/**`, `src/View/**`, or `src/infrastructure/**`.**
2. **`src/Entity/**` may not reference `window.*`.**
3. **`src/application/**` may not import Electron, `src/main/**`, `src/View/**`, or `src/infrastructure/**`.**
4. **`src/application/**` may not reference `window.*`.**
5. **`src/main/**` may not import renderer-side layers** (`src/View/**`, `src/Interactor/**`, `src/Gateway/**`, `src/Entity/**`, `src/Utility/**`, `src/application/**`, `src/infrastructure/**`).
6. **Renderer-side layers may not import `src/main/**`.**

These guardrails are intentionally modest: they protect the most important process/domain boundaries without forcing a large refactor of legacy renderer code.

## Contributor guidance: where new code should live

### Add new UI behavior

- Put React components, route composition, and presentation-only state in `src/View/**`.
- If the feature needs non-trivial orchestration, add or extend an interactor under `src/Interactor/**` instead of embedding workflow logic directly in JSX.

### Add a new use case or workflow

- Start in `src/Interactor/**`.
- Keep request/response shaping there.
- Reuse or add entities under `src/Entity/**` for business objects.

### Add a new Electron-backed renderer dependency

- First define a small interface in `src/application/services/**`.
- Then implement it in `src/infrastructure/electron/**`.
- Inject that interface into the interactor or gateway that needs it.
- Only expose new behavior through `src/preload.js` and `src/IPC/**` when renderer access is required.

### Add a new outbound provider or persistence adapter

- For main-process-owned integrations, prefer `src/main/services/**` plus an IPC registration module under `src/main/ipc/**`.
- For renderer-side gateways that must consume existing preload APIs, keep them under `src/Gateway/**`.
- If the gateway needs secrets/config/yahoo access, prefer going through an application service interface instead of calling `window.*` directly.

### Add shared helpers

- Use `src/Utility/**` only for helpers that are not view-specific and do not require main-process imports.
- If a helper is only meaningful for one slice, keep it near that slice rather than expanding `Utility` unnecessarily.

## Boundaries not yet strictly enforced

Some architectural goals are documented but not yet machine-enforced because the current codebase still contains legacy patterns:

- Many interactors, gateways, and views still call preload globals such as `window.config`, `window.database`, `window.vault`, `window.outbound`, and `window.urlWindow` directly.
- Several entities and gateway abstractions still depend on request/response model types that live under `src/Gateway/**`.
- SQLite access is still initiated from renderer-side gateway classes in many slices, even though the actual database connection is centralized in the main process.
- There is not yet a single renderer composition root that wires all interactors/factories with injected interfaces.

Those areas are good candidates for incremental refactoring, but the repository is deliberately starting with guardrails that are easy to maintain and hard to ignore.

## Related architecture documents

- `docs/architecture/main-process-refactor.md`
- `docs/architecture/ipc-contracts.md`
- `docs/architecture/dependency-injection-stock-slice.md`
- `docs/architecture/database-architecture.md`
- `docs/architecture/decisions/modular-main-process.md`
- `docs/architecture/decisions/shared-ipc-contracts.md`
- `docs/architecture/decisions/service-interfaces-over-window-globals.md`
- `docs/architecture/decisions/main-process-sqlite-service.md`
