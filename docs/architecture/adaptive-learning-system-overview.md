# Adaptive Learning System Overview

This document summarizes the adaptive-learning architecture after the integration cleanup pass.

## Goals of the stack

The adaptive-learning system is intended to:

- model features, tools, learning modules, tutorials, and hints with one metadata vocabulary
- personalize visibility and emphasis without hard-coding rules inside components
- sync learner and catalog metadata into a graph backend
- remain sustainable for contributors by isolating Neo4j-specific concerns
- fail safely when profile or graph data is incomplete

## End-to-end flow

```text
registration descriptors
  -> bootstrap manifests
  -> domain registries
  -> normalized adaptive catalog
  -> policy / recommendation / hint / tutorial services
  -> UI view models
  -> graph sync payloads
  -> repository abstraction
  -> Neo4j runtime
```

## Main architectural slices

### 1. Registration and metadata authorship

Adaptive metadata is authored in application-layer registration descriptors:

- `open-fin-al/src/application/adaptive-learning/features/*.ts`
- `open-fin-al/src/application/adaptive-learning/content/**/*.ts`

Each descriptor is a plain metadata object plus a stable `source` string.

The manifests:

- `open-fin-al/src/application/adaptive-learning/bootstrapAdaptiveFeatures.ts`
- `open-fin-al/src/application/adaptive-learning/bootstrapAdaptiveLearningContent.ts`

collect those descriptors and register them into the domain registries.

### 2. Domain registries and contracts

The domain layer provides the stable contracts and registries that the rest of the system depends on:

- `contracts.ts`
- `assetRegistry.ts`
- `featureRegistry.ts`
- `learningContentRegistry.ts`

This is the canonical abstraction for:

- asset ids and kinds
- learner profile shape
- governance/prerequisites
- relationships between learning/support assets and tools

### 3. Policy, recommendation, hint, and tutorial services

The domain/application services are responsible for interpreting metadata:

- `policyEngine.ts`
  - visibility/governance decisions
- `recommendationEngine.ts`
  - recommendation ranking for learning assets
- `helpHintSelectionService.ts`
  - contextual hint ranking and suppression
- `guidedTutorials.ts`
  - tutorial runtime definitions and lifecycle

These services operate on abstract contracts, not Neo4j records.

### 4. Catalog normalization and fallback behavior

`open-fin-al/src/application/adaptive-learning/adaptiveCatalog.ts` now centralizes several integration responsibilities:

- bootstrapping feature/content registries
- building a normalized catalog lookup
- normalizing learner profiles
- classifying profile completeness as `missing`, `partial`, or `complete`
- sanitizing graph recommendations against registered assets

This is important because it gives the stack one place to handle incomplete data safely.

### 5. UI adaptation layer

The UI does not talk directly to registries, policies, or Neo4j runtime code. Instead it uses runtime/view-model builders such as:

- `open-fin-al/src/ui/adaptive/learningCatalogAdaptive.ts`
- `open-fin-al/src/ui/adaptive/tradeWorkbenchAdaptive.ts`

Those files:

- load/normalize learner state
- optionally load graph data
- fall back to local defaults when the profile is partial or the graph is unavailable
- convert decisions/recommendations into banner/card/tool state objects for React components

### 6. Graph sync abstraction

The graph abstraction is intentionally layered:

#### Abstract

- `open-fin-al/src/domain/adaptive-learning/graph.ts`
- `open-fin-al/src/application/services/IAdaptiveGraphRepository.ts`
- `open-fin-al/src/application/adaptive-learning/adaptiveGraphSnapshot.ts`
- `open-fin-al/src/application/adaptive-learning/adaptiveGraphImportService.ts`

These define the payloads and orchestration independent of any specific graph database.

#### Neo4j-specific

- `open-fin-al/src/infrastructure/electron/ElectronAdaptiveGraphRepository.ts`
- `open-fin-al/src/main/services/adaptiveGraph/createNeo4jAdaptiveGraphRuntime.js`
- related IPC/preload/service files

These implement the actual persistence and query behavior for Neo4j.

## What changed in the cleanup pass

### Naming and registration normalization

The stack now uses a more consistent registration pattern:

- descriptors are created with `defineAdaptiveFeatureRegistration(...)` or `defineAdaptiveLearningContentRegistration(...)`
- manifests explicitly register descriptors through `registerAdaptiveFeatureDefinitions(...)` and `registerAdaptiveLearningContentDefinitions(...)`
- runtime code reads through `getAdaptiveCatalogAssets()` instead of rebuilding parallel bootstrapping logic in multiple places

This removes reliance on registration side effects and makes contributor workflows more explicit.

### Incomplete-data handling

The cleanup also improves resilience when data is incomplete:

- learner profiles are normalized before use
- saved-but-incomplete profiles are treated differently from complete profiles
- graph sync only runs when profile data is complete enough to support meaningful personalization
- graph recommendations are filtered to registered assets before the UI consumes them
- empty or partial graph data falls back to local policy/recommendation logic

## Separation of concerns

### What belongs in abstract layers

Keep these concerns abstract:

- asset metadata
- prerequisites
- policy/governance intent
- learner-profile normalization
- recommendation reasoning
- graph payload shapes
- repository interfaces

### What belongs in Neo4j-specific infrastructure

Keep these concerns Neo4j-specific:

- Cypher queries
- schema constraints/indexes
- session/transaction lifecycle
- Neo4j record mapping
- operational logging tied to the Neo4j runtime

If a concept is meaningful even without Neo4j, it probably belongs above the infrastructure layer.

## Current capabilities

The integrated stack currently supports:

- central registration for adaptive features and learning assets
- policy-driven visibility decisions
- learning recommendations that combine profile fit, governance, and graph support
- contextual help-hint selection
- guided tutorial runtime construction
- graph sync payload generation from canonical metadata
- Neo4j-backed catalog/learner sync behind a repository boundary
- UI surfacing for learning catalog and trade workbench recommendations
- conservative fallbacks when profile or graph data is incomplete

## Major remaining gaps

The current architecture is intentionally scoped and still leaves room for future work:

- more adaptive surfaces beyond the current representative learning/trading slice
- richer adaptive policies authored outside code
- background sync orchestration and conflict handling
- stronger authoring/validation for unresolved asset references
- broader graph-backed recommendation coverage across the product
- contributor automation for metadata linting or schema validation

These are reasonable next steps, but they are outside the scope of this cleanup pass.
