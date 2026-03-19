# Architecture decision: prefer service interfaces over direct window globals in application code

- **Status:** Accepted
- **Date:** 2026-03-19

## Context

Large parts of the renderer still reach into preload globals such as `window.config`, `window.vault`, and `window.yahooFinance` directly. That makes application logic harder to test and couples use cases to Electron delivery details.

The stock slice introduced a narrower seam with service interfaces under `src/application/services/**` and Electron-backed implementations under `src/infrastructure/electron/**`.

## Decision

When adding or refactoring non-trivial renderer-side application logic:

1. define a small interface in `src/application/services/**`
2. implement the Electron-specific version in `src/infrastructure/electron/**`
3. inject that dependency into the interactor or gateway

Direct `window.*` access remains acceptable for legacy code and trivial UI glue, but it is no longer the preferred pattern for new business/application logic.

## Consequences

### Positive

- Interactors and factories become easier to unit test.
- Electron-specific code is isolated in adapter classes.
- The architecture makes a future renderer composition root more feasible.

### Trade-offs

- Constructor wiring becomes more explicit.
- Some slices will temporarily mix old and new patterns until they are refactored.

## Notes for contributors

If you are about to add a new `window.someService` call inside an interactor or non-trivial gateway, stop and consider whether the dependency belongs behind an application service interface instead.
