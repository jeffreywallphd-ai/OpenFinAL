# Adaptive learning recommender

## Purpose

The adaptive learning recommender is the first ranking layer built on top of the existing adaptive graph and deterministic policy engine.

It answers a practical product question:

- given the learner’s profile,
- the adaptive catalog relationships,
- current prerequisite state,
- graph-backed relevance signals, and
- feature governance decisions,

what learning asset should appear next, and why?

The result is an explainable recommendation list for learning modules, tutorials, and help hints that stays coherent with visible, locked, hidden, and deemphasized product features.

## Architecture placement

```text
LearnerProfileStore / GraphRepository
  -> adaptive graph snapshot + graph recommendations
  -> adaptive policy engine decisions for all assets
  -> adaptive learning recommender ranking service
  -> UI view model for the Learning Modules area
```

This keeps ranking separate from core governance:

1. **Policy engine** decides whether assets/features are visible, locked, hidden, or deemphasized.
2. **Recommender** ranks the learning assets that remain in scope and explains which features they support.
3. **UI** renders a small recommendation set without re-implementing ranking logic.

## Recommendation inputs

The service combines five signal groups.

### 1. Learner profile alignment

- knowledge-level fit
- investment-goal overlap
- risk-preference alignment
- interested-tag overlap

This keeps recommendations grounded in the learner’s stated needs instead of generic popularity.

### 2. Graph relationships

The adaptive graph contributes:

- direct graph recommendation score (`relevanceScore`)
- graph-provided rationale text
- relationship context such as prerequisite, tutorial, and help connections

The first version treats graph output as a weighted signal, not an opaque replacement for deterministic policy decisions.

### 3. Prerequisite readiness

The recommender checks policy-engine outputs for:

- unmet prerequisites
- supporting asset ids
- lock state

This allows a learning asset to rank well even when it is a “learn this first” recommendation for a later unlock path.

### 4. Knowledge progression

The service uses:

- knowledge distance from the learner’s current level
- asset `unlockValue`
- declared `recommendedNextSteps`

That creates a progression-oriented score instead of treating every aligned asset as equally useful.

### 5. Related feature unlock value

Each learning recommendation can attach related features and summarize their current governance state.

Higher value is assigned when a learning asset supports a feature that is:

- **locked**: highest unlock value,
- **deemphasized**: meaningful value,
- **visible**: reinforcement value,
- **hidden**: low current value.

## Output model

The recommender returns an `AdaptiveLearningRecommendationResult` containing:

- `generatedAt`
- ranked `recommendations[]`
- `decisionsByAssetId`
- `featureGovernance`

Each recommendation contains:

- the selected learning asset,
- total `score`,
- the governing `VisibilityDecision`,
- `graphReasons[]`,
- `relatedFeatureUnlocks[]`,
- an `explanation` payload.

The explanation payload includes:

- `summary`
- weighted `reasons[]` by signal category
- `scoreBreakdown`

This keeps the first recommendation engine explainable enough for UI display, tests, and debugging.

## Governance coherence rules

The recommender is intentionally constrained by feature governance.

### Visible features

When related features are visible, the recommendation explains how learning reinforces a tool the learner can already see.

### Locked features

When related features are locked, the recommendation explains the unlock path and gives that learning asset a strong feature-unlock score.

### Deemphasized features

When related features are deemphasized, the recommendation shows how learning can increase readiness before the feature is promoted.

### Hidden features

Hidden features stay in the governance summary, but they contribute only low unlock value.

This prevents the UI from strongly recommending learning purely to access a feature that governance says should stay out of scope for now.

## UI integration

The first UI integration lives in the **Learning Modules** area.

The learning catalog now renders:

1. an adaptive banner,
2. a governance snapshot for visible/locked/deemphasized/hidden features,
3. a small ranked recommendation set,
4. rationale bullets,
5. related feature unlock explanations,
6. graph signal bullets when available.

This gives the learner a single learning-oriented place where recommendations and feature-readiness guidance appear together.

## Why this version is practical

This recommender is intentionally simple and deterministic enough to ship now:

- ranking logic is local and testable,
- rationale is returned with every recommendation,
- graph signals are used without making behavior opaque,
- feature governance remains the source of truth for availability,
- UI receives a small, readable recommendation set.

## Future extensions

Likely follow-up improvements include:

- richer scoring calibration from learner outcomes,
- stronger graph traversal for multi-hop prerequisites,
- persistence of recommendation impressions/clicks/completions,
- separate ranking policies by workspace,
- graph-derived cohort patterns once enough usage data exists.
