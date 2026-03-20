# Adaptive Learning Contributor Guide

This guide explains how to extend the adaptive-learning stack without reintroducing one-off wiring, UI-only metadata, or Neo4j coupling.

## Scope

The adaptive-learning stack in `open-fin-al/src` is organized around a simple rule:

- **author adaptive metadata once** in application-layer registration manifests
- **evaluate it through domain abstractions** such as the policy engine and recommendation engine
- **sync it through graph abstractions** that can target Neo4j today and other backends later
- **surface it in the UI** through view-model builders instead of component-local rules

## Layer map

### Abstract layers

These layers are backend-agnostic and should remain free of Neo4j/Cypher details:

- `open-fin-al/src/domain/adaptive-learning/contracts.ts`
  - shared asset, learner-profile, policy, and recommendation contracts
- `open-fin-al/src/domain/adaptive-learning/assetRegistry.ts`
  - reusable registry behavior
- `open-fin-al/src/domain/adaptive-learning/featureRegistry.ts`
  - feature/tool registry
- `open-fin-al/src/domain/adaptive-learning/learningContentRegistry.ts`
  - learning-module/tutorial/help-hint registry
- `open-fin-al/src/domain/adaptive-learning/policyEngine.ts`
  - visibility/governance evaluation
- `open-fin-al/src/domain/adaptive-learning/recommendationEngine.ts`
  - learning recommendation ranking
- `open-fin-al/src/domain/adaptive-learning/helpHintSelectionService.ts`
  - contextual hint selection
- `open-fin-al/src/domain/adaptive-learning/graph.ts`
  - graph-shaped DTOs and sync/query payloads
- `open-fin-al/src/application/services/IAdaptiveGraphRepository.ts`
  - graph repository abstraction used by application/UI code

### Application orchestration

These files coordinate registration, normalization, sync payloads, and UI-ready runtime assembly:

- `open-fin-al/src/application/adaptive-learning/registration.ts`
- `open-fin-al/src/application/adaptive-learning/bootstrapAdaptiveFeatures.ts`
- `open-fin-al/src/application/adaptive-learning/bootstrapAdaptiveLearningContent.ts`
- `open-fin-al/src/application/adaptive-learning/adaptiveCatalog.ts`
- `open-fin-al/src/application/adaptive-learning/adaptiveGraphSnapshot.ts`
- `open-fin-al/src/application/adaptive-learning/adaptiveGraphImportService.ts`
- `open-fin-al/src/application/adaptive-learning/guidedTutorials.ts`

### Neo4j-specific infrastructure

These files are the current Neo4j implementation details and should stay isolated from the domain/application contracts:

- `open-fin-al/src/infrastructure/electron/ElectronAdaptiveGraphRepository.ts`
  - renderer-side repository adapter over IPC
- `open-fin-al/src/main/services/adaptiveGraph/createNeo4jAdaptiveGraphRuntime.js`
  - Cypher, constraints, query mapping, runtime behavior
- `open-fin-al/src/main/services/adaptiveGraph/createAdaptiveGraphService.js`
  - stable service boundary
- `open-fin-al/src/main/ipc/registerAdaptiveGraphHandlers.js`
- `open-fin-al/src/preload.js`
- `open-fin-al/src/shared/ipc/channels.js`
- `open-fin-al/src/shared/ipc/contracts/index.js`

## 1. Registering adaptive features and tools

### Current pattern

Adaptive features are defined as registration descriptors under:

- `open-fin-al/src/application/adaptive-learning/features/*.ts`

Each file exports a descriptor created with `defineAdaptiveFeatureRegistration(...)` rather than registering through import side effects.

All descriptors are collected in:

- `open-fin-al/src/application/adaptive-learning/bootstrapAdaptiveFeatures.ts`

`bootstrapAdaptiveFeatures()` is the only function that should actually register feature metadata into the registry.

### How to add a new feature/tool

1. Create a new file in `open-fin-al/src/application/adaptive-learning/features/`.
2. Export a descriptor with:
   - stable `id`
   - stable `key`
   - `kind: 'feature'`
   - category, tags, prerequisites, governance, and relationships
3. Use the real UI/source entry point in the registration `source` string.
4. Add the descriptor to `adaptiveFeatureRegistrations` in `bootstrapAdaptiveFeatures.ts`.
5. Add or update tests that validate:
   - registry presence
   - selector/filter behavior if needed
   - graph export if the new feature participates in graph sync

### Contributor rules

- Prefer durable ids like `feature-trade-workbench` over component names.
- Keep relationships declarative; do not hard-code tutorial/help attachments in components if they can live in metadata.
- If the feature is user-facing, set `isUserFacing: true` and model its governance explicitly.

## 2. Registering learning modules, tutorials, and help hints

### Current pattern

Learning content is defined under:

- `open-fin-al/src/application/adaptive-learning/content/modules/*.ts`
- `open-fin-al/src/application/adaptive-learning/content/tutorials/*.ts`
- `open-fin-al/src/application/adaptive-learning/content/help-hints/*.ts`

Each file exports a descriptor created with `defineAdaptiveLearningContentRegistration(...)`.

All descriptors are collected in:

- `open-fin-al/src/application/adaptive-learning/bootstrapAdaptiveLearningContent.ts`

### How to add a new learning asset

1. Pick the right kind:
   - `learning-module`
   - `tutorial`
   - `help-hint`
2. Create the new registration file in the matching folder.
3. Define metadata with:
   - durable `id` and `key`
   - `category`
   - `supportedModalities`
   - `relationships.relatedFeatureIds`
   - optional `unlockValue`
   - optional `recommendedNextSteps`
   - for tutorials: `tutorialForAssetId` when applicable
   - for help hints: `hintForAssetId` and `contextualGuidance` when applicable
4. Add the descriptor to `adaptiveLearningContentRegistrations`.
5. Update tests for registry export, recommendation behavior, or hint/tutorial behavior as needed.

### Help-hint guidance

Prefer help hints for short, contextual, non-blocking guidance. Use `contextualGuidance` to express:

- valid `contextIds`
- exposure rules
- suppression rules
- display priority
- display count limits

## 3. Syncing metadata into Neo4j

### Canonical path

Registered metadata reaches the graph through this flow:

1. `bootstrapAdaptiveFeatures()` / `bootstrapAdaptiveLearningContent()` hydrate registries.
2. `getAdaptiveCatalogAssets()` builds a normalized in-memory asset catalog.
3. `buildAdaptiveGraphCatalogSyncPayload()` maps registered assets into graph-ready catalog nodes.
4. `buildAdaptiveGraphSyncPayload()` maps the learner profile plus asset metadata into learner sync payloads.
5. `createAdaptiveGraphImportService(...)` calls `IAdaptiveGraphRepository`.
6. The current repository implementation forwards to the Neo4j runtime.

### When to use each path

- Use `syncRegisteredAssets()` when metadata changed and you want catalog assets upserted.
- Use `syncLearnerGraph()` when learner state changed.
- Use `syncRegisteredAssetsForLearner()` when both metadata and learner state should share one sync timestamp.

### Contributor rules

- Do not build Neo4j payloads directly in UI code.
- Do not scrape React components to infer graph metadata.
- Keep graph payload construction in `application/adaptive-learning/*` so domain metadata stays canonical.

## 4. Adding graph relationships through abstractions

### Relationship source of truth

Most relationships should be expressed in `relationships` inside asset metadata:

- `relatedAssetIds`
- `relatedFeatureIds`
- `tutorialAssetIds`
- `helpAssetIds`
- `accessibilityAssetIds`

Prerequisites belong in `prerequisites`, not in Neo4j-only code.

### What to do when adding a new relationship

- If the relationship is product/domain meaning, add it to metadata.
- If the relationship is learner-state driven, add it to learner profile or sync payload mapping.
- Only update the Neo4j runtime when the abstract payload or relationship vocabulary already exists and needs persistence/query support.

### Decision test

Ask: “Would this relationship still matter if Neo4j were swapped out?”

- **Yes** → it belongs in domain/application abstractions.
- **No, it is only a database persistence concern** → keep it in the Neo4j runtime.

## 5. Using the policy engine to govern visibility

The policy engine is the main authority for deciding whether assets are:

- `visible`
- `locked`
- `deemphasized`
- `hidden`

### Inputs

- asset metadata
- learner profile
- prerequisites
- optional adaptive policies
- relationships/supporting assets

### Current entry points

- `evaluateAdaptivePolicyEngine(...)`
- `evaluateVisibilityDecision(...)`

### Contributor rules

- Put durable governance intent into metadata (`governance`, `prerequisites`).
- Use explicit policies when rules need to vary independently from asset ownership.
- In UI code, consume policy decisions or recommendation results; do not duplicate gating logic in JSX.

### Incomplete profile fallback

The application layer now distinguishes profile completeness:

- `missing`
- `partial`
- `complete`

For `missing` or `partial` profiles, the UI runtime builders intentionally fall back to conservative defaults instead of over-personalizing from weak data.

## 6. Surfacing recommendations in the UI

### Current UI adapters

- `open-fin-al/src/ui/adaptive/learningCatalogAdaptive.ts`
- `open-fin-al/src/ui/adaptive/tradeWorkbenchAdaptive.ts`
- `open-fin-al/src/ui/adaptive/useAdaptiveLearningCatalogRecommendations.js`
- `open-fin-al/src/ui/adaptive/useAdaptiveTradeWorkbenchGovernance.js`
- presentation components in `open-fin-al/src/ui/adaptive/*.jsx`

### Expected UI flow

1. Load/normalize learner profile.
2. Load graph data through `IAdaptiveGraphRepository` when the profile is complete enough.
3. Normalize graph recommendations against registered assets.
4. Build runtime/view-model objects from domain/application services.
5. Render banners, cards, tool states, tutorials, and help hints from that view-model.

### Contributor rules

- Keep UI components presentation-focused.
- Prefer adding fields to the view model over querying registries inside components.
- If a graph recommendation references an unknown asset, filter it out in the application layer instead of letting the UI crash or display orphaned content.

## 7. Fallback behavior expectations

The current adaptive stack intentionally degrades safely when:

- there is no learner profile
- the learner profile is only partially filled out
- the graph sync is unavailable
- the graph returns unknown/unregistered assets

### Current fallback rules

- normalized learner profiles always supply known default arrays/values
- partial profiles use conservative, non-blocking banners and tool states
- graph recommendations are filtered against registered assets
- missing graph reasons are replaced with a generic explanation
- local policy/recommendation logic continues to work even if graph results are empty

## 8. Suggested contributor checklist

Before merging an adaptive-learning change:

- [ ] metadata is registered through the manifest pattern
- [ ] ids/keys are durable and consistent with existing naming
- [ ] relationships are modeled abstractly, not in JSX/Cypher only
- [ ] policy behavior is covered by tests if governance changed
- [ ] graph sync payloads still serialize correctly
- [ ] incomplete-profile and graph-missing fallback behavior still makes sense
- [ ] contributor/architecture docs are still accurate
