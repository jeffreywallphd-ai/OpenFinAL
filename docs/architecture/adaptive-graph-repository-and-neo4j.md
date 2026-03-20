# Adaptive graph repository and Neo4j backend

## Purpose

This change introduces a **graph repository abstraction** for adaptive learning so the rest of OpenFinAL can depend on repository contracts and graph-shaped domain DTOs instead of depending on Neo4j APIs, Cypher, or driver objects.

The first concrete backend is **Neo4j**, which matches the project's existing plan to run a Neo4j sidecar/service for adaptive-learning graph storage.

## What is abstract vs. what is Neo4j-specific

### Abstract, reusable contracts

These files define storage/query contracts and graph-shaped adaptive-learning payloads without depending on Neo4j:

- `open-fin-al/src/domain/adaptive-learning/graph.ts`
  - graph DTOs for learner profile nodes, sync payloads, learner snapshots, and relevance query results
- `open-fin-al/src/application/services/IAdaptiveGraphRepository.ts`
  - renderer/application-facing repository interface
- `open-fin-al/src/application/adaptive-learning/adaptiveGraphSnapshot.ts`
  - maps the canonical learner profile plus bootstrapped adaptive registries into a graph sync payload
- `open-fin-al/src/infrastructure/electron/ElectronAdaptiveGraphRepository.ts`
  - renderer-side IPC adapter that implements the repository interface without embedding database-specific logic

### Neo4j-specific infrastructure

These files keep Neo4j concerns isolated to main-process infrastructure:

- `open-fin-al/src/main/services/adaptiveGraph/createNeo4jAdaptiveGraphRuntime.js`
  - owns Cypher statements, constraints, session lifecycle, and record-to-DTO mapping
- `open-fin-al/src/main/services/adaptiveGraph/createAdaptiveGraphService.js`
  - small stable service boundary used by IPC registration
- `open-fin-al/src/main/ipc/registerAdaptiveGraphHandlers.js`
  - exposes the generic adaptive-graph service over IPC
- `open-fin-al/src/shared/ipc/channels.js`
- `open-fin-al/src/shared/ipc/contracts/index.js`
- `open-fin-al/src/preload.js`
- `open-fin-al/src/main/index.js`

## Graph concepts modeled by the repository

The abstraction and first Neo4j implementation cover these adaptive-learning concepts:

- **learner profiles**
  - `LearnerProfile` node keyed by `learnerId`
- **knowledge levels**
  - `KnowledgeLevel` nodes linked by `HAS_KNOWLEDGE_LEVEL`
- **investment goals**
  - `InvestmentGoal` nodes linked by `PURSUES_GOAL`
- **risk preferences**
  - `RiskPreference` nodes linked by `HAS_RISK_PREFERENCE`
- **adaptive features/tools**
  - `AdaptiveAsset` nodes with `kind = feature`
- **learning modules**
  - `AdaptiveAsset` nodes with `kind = learning-module`
- **tutorials**
  - `AdaptiveAsset` nodes with `kind = tutorial`
- **help hints**
  - `AdaptiveAsset` nodes with `kind = help-hint`
- **prerequisites**
  - `REQUIRES` edges to assets, knowledge levels, goals, risk preferences, and progress markers
- **relevance relationships**
  - `RELATED_TO`, `HAS_TUTORIAL`, `HAS_HELP_HINT`, and score-building query logic for recommendations
- **completion/progress relationships**
  - `COMPLETED` and `HAS_PROGRESS` edges
- **learner state relationships**
  - `UNLOCKED_ASSET`, `HIDDEN_ASSET`, and `INTERESTED_IN_TAG`

## Repository workflow

### 1. Build a graph sync payload

`buildAdaptiveGraphSyncPayload(...)` uses the canonical learner-profile shape plus the bootstrapped adaptive feature/content registries.

That means the graph layer syncs from **domain-owned metadata**, not from React components or Neo4j-specific DTOs.

### 2. Call the repository interface

Application/renderer code depends on `IAdaptiveGraphRepository`.

Current Electron wiring uses `ElectronAdaptiveGraphRepository`, which sends the generic payload over IPC.

### 3. Use the main-process service boundary

The main process follows the same stable-boundary pattern used elsewhere in the app:

- IPC handler → adaptive graph service → graph runtime adapter

This keeps the service boundary stable even if the backend changes later.

### 4. Execute the first concrete backend

`createNeo4jAdaptiveGraphRuntime(...)`:

- creates Neo4j constraints
- upserts learner profile nodes and related concept nodes
- upserts adaptive assets
- recreates graph relationships for prerequisites, tutorials, hints, completion, progress, hidden state, and unlocked state
- runs recommendation queries and maps the results back into generic DTOs

## Sidecar/service boundary cleanup

This change intentionally improves the previous architecture in a few ways:

1. **Neo4j is now behind a main-process service boundary.**
   - Renderer code does not know about the Neo4j driver or Cypher.
2. **IPC is contract-based instead of ad hoc.**
   - New adaptive-graph channels mirror the repo's existing config/database/outbound patterns.
3. **The graph runtime is replaceable.**
   - `createAdaptiveGraphService(...)` depends on a generic runtime object, not directly on Neo4j.
4. **Neo4j can be disabled cleanly.**
   - If `NEO4J_ENABLED=false`, callers still get predictable no-op results instead of application crashes.

## Neo4j configuration

The first backend expects the main process to connect to a Neo4j sidecar/service with environment variables:

- `NEO4J_ENABLED` (defaults to enabled unless explicitly `false`)
- `NEO4J_URI` (defaults to `bolt://127.0.0.1:7687`)
- `NEO4J_USERNAME` or `NEO4J_USER` (defaults to `neo4j`)
- `NEO4J_PASSWORD` (defaults to `openfinal`)
- `NEO4J_DATABASE` (optional)

This preserves Neo4j as the **first concrete backend** while leaving room for future graph backends to plug into the same repository and service contract.

## Current scope and non-goals

Included now:

- graph repository contracts
- Neo4j-backed sync/query implementation
- IPC and preload wiring for the repository
- tests covering payload creation, renderer adapter behavior, and Neo4j runtime behavior

Not included yet:

- live UI adaptation or feature gating directly driven by graph reads
- secondary graph backends
- background sync scheduling or conflict-resolution workflows

## Future extension points

Potential follow-up work can now happen without redesigning the graph repository contract:

- add a second backend (for example, Memgraph or a hosted graph service)
- add richer recommendation/ranking strategies
- add sync orchestration from SQLite learner-profile persistence events
- add graph-backed UI personalization using `IAdaptiveGraphRepository`
