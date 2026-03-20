# Adaptive Feature Registry

## Purpose

The adaptive feature registry creates a single source of truth for user-facing features, tools, and related adaptive learning assets. It exists so the product can eventually decide which features should be shown, hidden, deemphasized, or locked for a learner without scattering that knowledge across UI components.

This prompt intentionally stops at metadata and registration. It does **not** implement adaptive UI behavior yet.

## What the registry stores

Each adaptive feature now follows a shared metadata contract in `src/domain/adaptive-learning/contracts.ts`.

The contract captures:

- stable feature id and key
- title and description
- feature kind and category
- required knowledge level
- related investment goals
- related risk preferences
- prerequisites
- tags/topics
- default availability
- whether the feature is user-facing
- relationships to tutorials, help assets, accessibility assets, and related features
- governance flags used later by adaptive policies

## Central registry

`src/domain/adaptive-learning/featureRegistry.ts` provides a reusable in-memory registry with these responsibilities:

- register metadata from feature modules
- prevent accidental duplicate ids
- look up a feature by id
- list all registered features
- filter by adaptive selectors
- export graph-ready nodes for future graph synchronization

The graph export is intentionally simple and serializable so later prompts can map the registry into graph nodes and edges without re-reading UI code.

## Registration pattern

Representative user-facing features are defined in colocated registration modules under:

- `src/application/adaptive-learning/features/portfolioFeature.ts`
- `src/application/adaptive-learning/features/tradeWorkbenchFeature.ts`
- `src/application/adaptive-learning/features/investmentNewsFeature.ts`
- `src/application/adaptive-learning/features/learningModulesFeature.ts`
- `src/application/adaptive-learning/features/aiChatAssistantFeature.ts`

Each module now exports a registration descriptor created with `defineAdaptiveFeatureRegistration(...)`. The manifest file `src/application/adaptive-learning/bootstrapAdaptiveFeatures.ts` gathers those descriptors and calls `bootstrapAdaptiveFeatures()` so one bootstrap step hydrates the registry without relying on import-time side effects.

The application entry point imports the bootstrap manifest in `src/renderer.js` so the registry is populated early and can be queried centrally.

## Current representative slice

The current implementation registers a small, real slice of user-facing capabilities:

- Portfolio dashboard
- Trade workbench
- Investment news search
- Learning modules catalog
- AI chat assistant

This is enough to validate the pattern without changing live UI behavior.

## How future features should be added

When a new user-facing feature/tool/component is introduced:

1. Create a new feature registration module under `src/application/adaptive-learning/features/`.
2. Define a complete `AdaptiveFeatureMetadata` object.
3. Export a descriptor with `defineAdaptiveFeatureRegistration(metadata, '<source file>')`.
4. Add tutorial/help/accessibility relationship ids even if the referenced assets are delivered later.
5. Add the new descriptor to `src/application/adaptive-learning/bootstrapAdaptiveFeatures.ts`.
6. Add or update tests that cover lookup and any selector behavior specific to the feature.
7. If the feature should later sync to the adaptive graph, consume `exportAdaptiveFeatureGraphNodes()` rather than scraping component files.

## Why this design supports the adaptive system

This design keeps adaptive governance data:

- **shared**: one contract across features and learning assets
- **discoverable**: one central lookup point
- **serializable**: ready for policy engines and graph sync
- **incremental**: easy to apply to existing features one slice at a time
- **non-invasive**: no live feature gating is required yet
