# Adaptive graph sync

## Overview

The adaptive graph sync pipeline now treats the adaptive registries as the canonical source of graph-ready metadata and imports that metadata into Neo4j through a dedicated sync contract.

The pipeline is split across layers so graph concerns stay out of domain registration logic:

1. **Domain registries** keep feature and learning-content metadata in memory.
2. **Application sync builders** bootstrap those registries and map registry entries into graph sync payloads.
3. **Adaptive graph repository/service** transports the payload over the Electron bridge.
4. **Neo4j runtime** upserts nodes and relationships into the adaptive graph.

## Sync flow

### Registered asset catalog sync

`buildAdaptiveGraphCatalogSyncPayload()` collects entries from both registries after calling the existing bootstrap manifests:

- adaptive features/tools
- learning modules
- tutorials
- help hints

Each registry entry is mapped into a graph asset payload that includes:

- stable asset identity (`id`, `key`, `kind`)
- descriptive metadata (`title`, `description`, `category`)
- recommendation metadata (`knowledgeLevel`, `tags`, `investmentGoals`, `riskAlignment`)
- governance flags
- source provenance (`source`, `registeredAt`)
- learning-specific metadata such as modalities, duration, tutorial targets, hint targets, and recommended next steps

`createAdaptiveGraphImportService()` then exposes:

- `syncRegisteredAssets()` for catalog-only synchronization
- `syncLearnerGraph()` for learner-profile synchronization
- `syncRegisteredAssetsForLearner()` to push the catalog first and then the learner snapshot with the same timestamp

### Neo4j import behavior

`syncAdaptiveGraphCatalog()` performs an idempotent upsert for every provided asset:

- `MERGE`s `AdaptiveAsset` nodes by `id`
- rewrites outgoing catalog relationships for the synced assets only
- preserves graph abstraction boundaries by working only on sync payloads rather than registry internals
- supports incremental usage because each sync updates only the provided asset set

The importer currently maps these relationships:

- `RELATED_TO` for asset-to-asset relevance
- `RELEVANT_TO_FEATURE` for content-to-feature topical links
- `HAS_TUTORIAL`
- `HAS_HELP_HINT`
- `HAS_ACCESSIBILITY_HINT`
- `TUTORIAL_FOR`
- `HINT_FOR`
- `NEXT_STEP`
- `REQUIRES` for prerequisite relationships
- `TAGGED_WITH`, `ALIGNS_WITH_GOAL`, and `ALIGNS_WITH_RISK` for recommendation metadata

## Idempotency and incremental updates

The sync is designed to be idempotent where practical:

- node imports use `MERGE`
- relationship imports delete and rebuild only the outgoing catalog relationships for the assets being synced
- repeated syncs with the same payload converge on the same graph state

The catalog payload also carries a `mode` field (`incremental` or `full`). The current implementation uses the same upsert strategy for both modes, which allows future callers to send just the changed assets without requiring a full reseed.

## How new registered features and assets reach Neo4j

When a developer adds a new adaptive feature or learning asset:

1. The module self-registers through `registerAdaptiveFeature()` or `registerAdaptiveLearningContent()`.
2. The corresponding bootstrap manifest imports that module.
3. `buildAdaptiveGraphCatalogSyncPayload()` sees the new registry entry automatically.
4. `createAdaptiveGraphImportService().syncRegisteredAssets()` or `.syncRegisteredAssetsForLearner()` sends the new asset metadata to the adaptive graph repository.
5. The Neo4j runtime upserts the new node and its relationships into Neo4j.

That means new registered metadata reaches Neo4j by joining the existing registry bootstrap path and then flowing through the dedicated catalog sync contract, rather than through one-off seeding scripts.
