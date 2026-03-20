# Adaptive learning foundation

## Purpose

This note defines the initial adaptive-learning architecture contracts for OpenFinAL. The intent is to make adaptive learning a **shared platform capability** rather than a one-off recommendation engine.

The contracts in `open-fin-al/src/domain/adaptive-learning/**` model:

- learner characteristics and progress;
- adaptive assets across features, learning modules, tutorials, and help hints;
- feature-governance outcomes such as **visible**, **hidden**, **locked**, and **deemphasized**;
- policy-driven recommendation, highlighting, and "learn this later to unlock" guidance.

## Why a shared asset model

Adaptive learning in OpenFinAL must govern more than educational content. The product requirement is that the system can reduce overload by controlling what platform capabilities appear for a learner at a given moment.

For that reason, the design uses a single conceptual model for all adaptive assets:

- `AdaptiveFeatureMetadata`
- `LearningModuleMetadata`
- `TutorialMetadata`
- `HelpHintMetadata`

These all extend the same base metadata contract and therefore share:

- `knowledgeLevel`
- `investmentGoals`
- `riskAlignment`
- `prerequisites`
- `governance`
- `relatedAssetIds`

This makes it possible to reason about a stock screener, a tutorial walkthrough, and a help hint with the same policy engine.

## Domain relationships

```text
LearnerProfile
  -> completedAssets / progressMarkers
  -> informs AdaptivePolicy evaluation
  -> informs Prerequisite evaluation

AdaptiveAssetMetadata
  -> has prerequisites
  -> has governance defaults
  -> may relate to other assets through relatedAssetIds

AdaptivePolicy
  -> selects one or more adaptive assets
  -> evaluates serializable learner conditions
  -> produces a VisibilityDecision

VisibilityDecision
  -> governs how the asset should be surfaced right now
  -> separates availability from recommendation/highlighting signals
```

## First-class feature governance

Feature governance is modeled directly, not as an incidental UI concern.

The contracts separate two ideas:

1. **Availability state** via `FeatureAvailabilityState`
   - `visible`
   - `hidden`
   - `locked`
   - `deemphasized`
2. **Guidance signals** via `VisibilityDecision`
   - `recommended`
   - `highlighted`
   - `highlightForLearningLater`

This lets downstream UI and orchestration layers express nuanced behavior, for example:

- show a feature normally;
- hide it entirely;
- keep it visible but locked behind prerequisites;
- keep it present but visually deemphasized;
- recommend or highlight it because the learner is ready;
- highlight a prerequisite learning path to unlock it later.

## Serializable, graph-friendly contracts

The model is intentionally **graph-friendly** without depending on Neo4j APIs or labels.

Graph storage can be introduced later because the contracts already use explicit identifiers and relationships:

- `LearnerProfile.learnerId`
- `AdaptiveAssetMetadata.id`
- `relatedAssetIds`
- asset-completion prerequisites referencing `assetId`
- policy selectors and conditions referencing assets, kinds, categories, tags, and progress markers

That means a future persistence layer can map these contracts to nodes and edges without changing domain concepts or forcing the domain layer to import database client libraries.

## Intended dependency direction

The adaptive-learning contracts should remain inside the domain layer and stay framework-agnostic.

```text
View / UI
  -> interactors or application services
    -> adaptive-learning domain contracts + policy engine
      -> persistence adapters / graph repositories / IPC-backed services later
```

### Dependency rules

- `src/domain/adaptive-learning/**` must not depend on React, Electron, `window.*`, or database APIs.
- UI code should consume `VisibilityDecision` outputs rather than inventing separate availability enums.
- Persistence code should adapt these contracts to storage, not embed storage-specific types into the contracts.
- Recommendation logic should compose `AdaptivePolicy` records instead of hard-coding learner checks in UI components.

## Incremental implementation guidance

This foundation is deliberately pragmatic:

- The current policy engine supports a focused set of serializable conditions.
- `Prerequisite` and `AdaptivePolicyCondition` are extensible unions, so new cases can be added incrementally.
- The current model does not assume a final repository, service, or UI architecture for adaptive learning.
- Future prompts can add repositories, graph mappers, event tracking, and UI presentation while reusing these contracts.

## How this supports later prompts

These contracts create stable seams for upcoming work:

1. **Adaptive repositories** can persist learner profiles, asset metadata, and policies without redesigning the model.
2. **Feature gating services** can compute `VisibilityDecision` objects for dashboards, analysis tools, and onboarding flows.
3. **Recommendation services** can generate ranked `RecommendationCandidate` results using the same asset metadata.
4. **Learning progression flows** can connect prerequisites, completion markers, and unlock states.
5. **Graph-backed exploration** can be added later because relationships are already modeled by IDs and selectors rather than UI-only flags.
