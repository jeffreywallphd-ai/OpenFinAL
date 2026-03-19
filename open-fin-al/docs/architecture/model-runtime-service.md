# Model runtime service

## Goal

The Electron main process now depends on a pluggable model runtime boundary instead of directly owning Transformers.js pipeline setup and execution details.

This keeps the renderer-facing IPC contract stable while making it easier to swap inference backends over time.

## Current structure

### Stable service boundary

`src/main/services/modelRuntime/IModelRuntimeService.js` documents the runtime contract used by the main process.

`src/main/services/modelRuntime/createModelRuntimeService.js` is the small facade exposed to IPC registration modules. Today it provides:

- `runTextGeneration(model, prompt, params)`

The IPC handler continues to call the same renderer-facing method, but it now talks to a generic model runtime service instead of a Transformers-specific implementation.

### Transformers-backed implementation

`src/main/services/modelRuntime/createTransformersTextGenerationRuntime.js` contains the current local inference implementation.

Responsibilities owned by this runtime adapter:

- configure the Transformers environment
- create text-generation pipelines
- cache initialized pipelines by model name
- reuse in-flight initialization promises so concurrent requests for the same model do not create duplicate pipelines
- execute prompt generation once the pipeline is ready

## Wiring

The composition root in `src/main/index.js` now assembles the runtime in two steps:

1. create a task-specific runtime implementation (`createTransformersTextGenerationRuntime()`)
2. pass that implementation into the generic service facade (`createModelRuntimeService(...)`)

That means Electron startup logic knows *which* backend is being used, but it no longer owns *how* that backend initializes models or performs inference.

## Caching behavior

The previous implementation kept only one active pipeline at a time.

The new runtime keeps a cache per model name:

- repeated requests for the same model reuse the existing pipeline
- switching to another model does not discard the first model's initialized pipeline
- concurrent requests for one model share a single in-flight pipeline creation promise

This preserves reuse and improves the behavior for alternating or concurrent model requests.

## Adding a future remote backend

A remote backend can plug in by implementing the same text-generation runtime contract:

- expose `generateText({ model, prompt, params })`
- optionally maintain its own cache for auth tokens, HTTP clients, or remote session handles
- inject that runtime into `createModelRuntimeService({ textGenerationRuntime })`

Example shape:

```js
const remoteRuntime = {
  async generateText({ model, prompt, params }) {
    return remoteClient.generate({ model, prompt, ...params });
  },
};

const modelRuntimeService = createModelRuntimeService({
  textGenerationRuntime: remoteRuntime,
});
```

Because IPC registration already depends on the generic service, the renderer and preload layers would not need to change for a backend swap.

## Extending to task-specific pipelines

If the app later needs summarization, embeddings, classification, or other task-specific runtimes, follow the same pattern:

1. add a small task runtime contract
2. implement one or more backend adapters for that task
3. expose only the task methods needed by the IPC handler or service consumer

That keeps backend-specific concerns localized and prevents main-process orchestration from becoming coupled to any one inference library.
