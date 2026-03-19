# Architecture decision: share typed IPC contracts between preload and main

- **Status:** Accepted
- **Date:** 2026-03-19

## Context

Historically, IPC channels are easy to drift: preload code can serialize one payload shape while the main process expects another, and string channel names can be duplicated across the codebase.

OpenFinAL already has a contract layer under `src/IPC/**` that centralizes channel names, serialization, and light validation.

## Decision

Use the shared contract pattern as the default for new IPC endpoints:

- channel names live in `src/IPC/channels.js`
- payload serialization and validation live in `src/IPC/contracts/index.js`
- renderer-facing typings live in `src/IPC/contracts/index.d.ts` and `src/IPC/window.d.ts`
- preload uses `invokeContract()` / `sendContract()`
- main uses `registerHandle()` / `registerListener()`

## Consequences

### Positive

- New IPC channels have one canonical name and one payload definition.
- Preload and main behavior stay aligned.
- Runtime validation happens at the boundary where untrusted payloads enter the main process.

### Trade-offs

- Adding an IPC endpoint requires updating multiple files in the shared contract layer.
- Validation is intentionally lightweight today, so some richer schema guarantees are still deferred.

## Notes for contributors

Do not add raw string channel names directly to renderer code for new features. Add or extend the contract first, then consume that contract from preload and main.
