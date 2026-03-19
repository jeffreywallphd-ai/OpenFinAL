# IPC contracts

OpenFinAL uses a shared IPC contract layer so the preload bridge and the main-process registrations stay synchronized.

## Goals

- Keep every Electron IPC channel name in one place.
- Make preload bridges use structured request payloads instead of ad hoc positional arguments.
- Let main-process handlers reuse the same contract definitions and light runtime guards.
- Preserve the existing renderer globals (`window.config`, `window.vault`, `window.database`, `window.yahooFinance`, `window.transformers`, `window.puppetApi`, `window.file`, `window.urlWindow`, and `window.electronApp`) while making the bridge implementation safer.

## Files

- `src/IPC/channels.js`: canonical channel-name registry.
- `src/IPC/contracts/index.js`: contract definitions, preload/main helpers, and runtime guards.
- `src/IPC/contracts/index.d.ts`: shared TypeScript request/response and bridge types.
- `src/IPC/window.d.ts`: ambient `window` typing for preload-exposed APIs.

## Pattern

Each IPC endpoint is represented by a contract object with four pieces of information:

1. `channel`: the Electron IPC channel string.
2. `type`: `invoke` or `send`.
3. `serialize(...args)`: how preload turns the public bridge call into a payload.
4. `validate(payload)`: how main normalizes and validates the payload before calling the real service.

### Preload usage

Use `invokeContract(ipcRenderer, contract, ...args)` for request/response handlers and `sendContract(ipcRenderer, contract, ...args)` for fire-and-forget events.

```js
const { invokeContract, ipcContracts, sendContract } = require('./IPC/contracts');

contextBridge.exposeInMainWorld('vault', {
  getSecret: (key) => invokeContract(ipcRenderer, ipcContracts.vault.getSecret, key),
});

contextBridge.exposeInMainWorld('urlWindow', {
  openUrlWindow: (url) => sendContract(ipcRenderer, ipcContracts.urlWindow.open, url),
});
```

### Main-process usage

Use `registerHandle(ipcMain, contract, handler)` and `registerListener(ipcMain, contract, handler)`.

```js
const { ipcContracts, registerHandle } = require('../../IPC/contracts');

registerHandle(ipcMain, ipcContracts.vault.getSecret, ({ key }) => secretService.getSecret(key));
```

The wrapper runs the contract's `validate()` function before your handler receives the request.

## Current contract groups

- `config`: username, user path, asset path, config existence/load/save.
- `files`: text and binary file reads.
- `vault`: secret reads/writes and certificate refresh.
- `database`: sqlite existence/init/query/get/insert/update/delete/select-data.
- `yahooFinance`: chart, search, historical data.
- `transformers`: text generation.
- `puppeteer`: page text extraction.
- `urlWindow`: hidden body extraction and open-window event.

## Adding a new IPC handler

1. Add the channel constant to `src/IPC/channels.js`.
2. Add a contract entry in `src/IPC/contracts/index.js` with `serialize()` and `validate()`.
3. If renderer TypeScript should know about it, extend `src/IPC/contracts/index.d.ts` and `src/IPC/window.d.ts`.
4. Use the new contract from `src/preload.js`.
5. Register the main-process handler with `registerHandle()` or `registerListener()`.
6. Add or update targeted tests for the new guard/contract behavior.

## Validation philosophy

The current implementation uses light guards only:

- required strings must be non-empty;
- object payloads must actually be objects;
- SQL parameter lists and `select-data` inputs must be arrays when present.

If stronger runtime validation is introduced later, keep it inside the contract layer so preload and main continue to share the same contract definition.
