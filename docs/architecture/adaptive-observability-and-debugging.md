# Adaptive observability and debugging

This document describes the lightweight observability added for the adaptive-learning stack so developers can answer a practical question quickly:

> Why is this feature or learning asset visible, hidden, locked, deemphasized, or recommended?

The goal is **developer-facing diagnostics without turning the production UI into a debug console**.

## What was added

A new helper module lives at:

- `open-fin-al/src/application/adaptive-learning/adaptiveDiagnostics.ts`

It builds an **adaptive observability snapshot** that combines five areas teams usually need during debugging:

1. **Feature registry contents**
   - counts by asset kind
   - per-asset source and registration timestamp
   - governance defaults and relationship counts

2. **Learner profile snapshot**
   - normalized learner state
   - profile completeness classification (`missing`, `partial`, `complete`)
   - completed, hidden, and unlocked asset IDs
   - progress markers and profile metadata that affect adaptive decisions

3. **Graph sync status**
   - whether a sync was attempted
   - whether graph-backed recommendations were actually available
   - why sync was skipped or failed
   - discarded recommendation IDs when graph output referenced unregistered assets

4. **Policy decisions**
   - per-asset governance state
   - structured explanations for visibility, hidden, locked, and deemphasized states
   - applicable policy IDs, unmet prerequisites, and supporting assets

5. **Recommendation rationales**
   - ranked recommendation summaries
   - top reasons and score breakdowns
   - graph reasons
   - related feature unlocks

## Developer workflow

The main entry point is:

- `buildAdaptiveObservabilitySnapshot(...)`

Typical usage:

```ts
import {
  buildAdaptiveObservabilitySnapshot,
  inspectAdaptiveDecision,
  emitAdaptiveObservabilitySnapshot,
} from '@application/adaptive-learning/adaptiveDiagnostics';

const snapshot = buildAdaptiveObservabilitySnapshot({
  profile,
  hasLearnerProfile: true,
  graphRecommendations,
  graphSync: {
    attempted: true,
    synced: true,
    backend: 'neo4j',
  },
});

const tradeDecision = inspectAdaptiveDecision(snapshot, 'feature-trade-workbench');

emitAdaptiveObservabilitySnapshot('trade-workbench', snapshot, {
  enabled: process.env.OPENFINAL_ADAPTIVE_DEBUG === '1',
});
```

## How to inspect a feature state

Each asset gets a decision diagnostic with purpose-built fields:

- `whyVisible`
- `whyHidden`
- `whyLocked`
- `whyDeemphasized`
- `whyRecommended`

This makes the common maintenance cases easier:

### Why is a feature visible?
Check:

- `decision.whyVisible`
- `decision.explanationSummary`
- `decision.applicablePolicyIds`

### Why is a feature hidden?
Check:

- `decision.whyHidden`
- `decision.reasonMessages`
- `decision.graphReasons`

Typical causes:

- learner dismissed the asset
- optional advanced asset exceeded learner readiness
- risk alignment conflicted with governance

### Why is a feature locked?
Check:

- `decision.whyLocked`
- `decision.unmetPrerequisites`
- `decision.supportingAssetIds`

This is especially useful when a product feature depends on a tutorial or risk module before becoming fully available.

### Why is something recommended?
Check:

- `decision.whyRecommended`
- top-level recommendation entry in `snapshot.recommendations`
- `scoreBreakdown`
- `relatedFeatureUnlocks`

This separates **policy eligibility** from **recommendation ranking**, which avoids guessing whether a recommendation came from governance, graph signals, or learner-profile fit.

## Safety and production behavior

The diagnostics are intentionally kept behind developer-oriented tooling:

- no production UI panels were added for raw internals
- logging is opt-in through `emitAdaptiveObservabilitySnapshot(..., { enabled: true })`
- learner snapshots are structured for debugging and do **not** dump free-form profile text into the UI by default
- graph output is normalized so unknown asset IDs are discarded and explicitly reported instead of surfacing broken recommendations

This preserves explainability for developers while avoiding careless exposure of sensitive or noisy implementation details in end-user screens.

## Why this reduces maintenance burden

This tooling reduces future adaptive-learning maintenance cost in several ways:

1. **Faster root-cause analysis**
   - Developers no longer need to manually correlate registry metadata, learner state, graph recommendations, and policy output across multiple modules.

2. **Safer feature expansion**
   - When a new adaptive feature is registered, the registry snapshot immediately shows whether it was registered correctly and whether its governance metadata is coherent.

3. **Lower risk during graph integration changes**
   - Unknown graph asset IDs are surfaced as discarded diagnostics instead of causing silent mismatches or UI confusion.

4. **Clear recommendation explainability**
   - Recommendation score breakdowns and top reasons help teams tune ranking logic without treating the recommender as a black box.

5. **Consistent debugging vocabulary**
   - Teams can now talk about `whyLocked`, `whyHidden`, `graphSync.reason`, and `topReasons` rather than reverse-engineering behavior from scattered logs.

## Testing approach

Focused tests cover:

- registry summary generation
- learner snapshot normalization
- graph sync reason classification
- feature state inspection for hidden and locked assets
- recommendation rationale extraction
- opt-in diagnostic logging behavior

These tests are intentionally narrow so future adaptive features can reuse the diagnostics without needing large UI integration tests first.
