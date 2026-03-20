# Adaptive policy and feature governance

## Purpose

The adaptive policy engine is the first deterministic governance layer that makes the “all features can turn on and off” requirement operational.

It evaluates each adaptive asset against the learner profile, adaptive metadata, and asset-to-asset relationships, then emits explainable decisions that a UI can use without re-implementing business logic.

This engine governs both:

- user-facing tools/features such as the portfolio dashboard, news, and trading workflows, and
- learning assets such as modules, tutorials, and help hints.

## Inputs

The engine works from three sources of truth:

1. **Learner profile**
   - knowledge level
   - investment goals
   - risk preference
   - completed assets
   - progress markers
   - unlocked asset ids
   - hidden/dismissed asset ids
2. **Adaptive asset metadata**
   - asset kind/category
   - knowledge target
   - goal alignment metadata
   - risk alignment metadata
   - prerequisites
   - governance defaults
   - feature/content criticality
3. **Graph-friendly relationships**
   - related asset ids
   - related feature ids
   - tutorials, help assets, and accessibility assets
   - prerequisite asset references

The current implementation reads those relationships from the adaptive registries. Because the contracts are graph-friendly, the same decision logic can later consume graph snapshots or graph query results without reworking the decision model.

## Decision outputs

Each evaluated asset returns a `VisibilityDecision` with:

- `availabilityState`
  - `visible`
  - `hidden`
  - `locked`
  - `deemphasized`
- emphasis signals
  - `recommended`
  - `highlighted`
  - `suggestedForLaterUnlocking`
  - `highlightForLearningLater`
- prerequisite/debug state
  - `unmetPrerequisites`
  - `supportingAssetIds`
  - `applicablePolicyIds`
- explainability payload
  - human-readable `reasons`
  - `explanation.summary`
  - `explanation.reasons[]` with source + reason code + structured details
  - `explanation.debug` with fit/alignment calculations and relationship inputs

This keeps the first version explainable enough for both UI display and debugging.

## Deterministic evaluation flow

For every asset, the engine applies the same ordered rule flow:

1. Start from the asset’s governance default availability.
2. Evaluate all prerequisites and mark unmet required prerequisites.
3. Apply learner-state overrides:
   - dismissed assets can remain hidden,
   - explicitly unlocked assets can bypass the lock state.
4. Evaluate metadata fit:
   - knowledge-level fit,
   - investment-goal alignment,
   - risk-preference alignment,
   - governance criticality (`core`, `standard`, `optional`).
5. Apply relationship-aware support:
   - attach prerequisite/supporting learning assets,
   - attach related tutorials/help when the learner needs a later unlock path.
6. Apply matching explicit policies in priority order.
7. Suppress recommendations/highlights when governance forbids them.
8. Emit a final explanation summary and structured debug payload.

Because the rule order is fixed and the inputs are serializable, the engine is deterministic and testable.

## Governance rules in the first version

### 1. Prerequisite governance

If required prerequisites are unmet and the asset allows locking, the asset becomes `locked` and is marked as suggested for later unlocking.

This supports decisions like:

- keep a trading tutorial present but locked until the risk module is completed,
- point the learner to the missing prerequisite module instead of letting them dead-end.

### 2. Knowledge fit governance

If the learner is below the asset’s target knowledge level:

- `optional` assets can be hidden,
- `standard` or `core` assets are generally deemphasized unless prerequisites already force a lock.

This avoids exposing advanced workflows too early while keeping critical platform surfaces discoverable.

### 3. Investment-goal alignment governance

The engine checks overlap between the learner’s stated goals and the asset’s intended goals.

- no alignment means the asset should not be promoted,
- optional assets can be deemphasized when they do not align,
- aligned assets remain eligible for recommendation/highlighting.

### 4. Risk-preference alignment governance

The engine compares learner risk preference to asset risk alignment.

- a mismatch deemphasizes or hides non-critical assets,
- aligned assets remain promotable,
- unknown learner risk stays neutral instead of making a risky inference.

### 5. Criticality/default governance

Criticality makes default policies operational:

- `core`: keep essential navigation and foundation assets in scope when fit is acceptable,
- `standard`: treat as normal product surfaces,
- `optional`: easiest to hide or deemphasize when the learner is a poor fit.

This is the core overload-reduction lever for “all features can turn on and off” without treating every asset equally.

## How relationships reduce overload

The engine does not only decide whether to show something. It also decides what should be shown **instead** or **alongside** it.

Examples:

- If a feature is locked by a prerequisite module, the decision includes the module id in `supportingAssetIds`.
- If a tutorial should wait, related help content can be attached as a lighter-weight next step.
- If an optional feature is hidden/deemphasized, the engine can keep foundational content visible and recommended.

This reduces overload by replacing a blunt “show everything” model with a staged path:

1. keep core/foundation assets visible,
2. reduce emphasis on mismatched assets,
3. lock workflows that would confuse or mislead the learner,
4. point the learner to the smallest next step that explains how to unlock later.

## Why this version is intentionally rules-based

The first engine is not probabilistic or opaque.

That is intentional because the current system needs:

- deterministic test coverage,
- explainable UI messages,
- easy debugging when a feature is unexpectedly hidden or locked,
- stable contracts before any future graph ranking or model-assisted personalization.

Later work can add richer policy authoring, graph-derived signals, or ranking layers on top of this deterministic base.

## Current implementation footprint

The implementation lives primarily in:

- `open-fin-al/src/domain/adaptive-learning/contracts.ts`
- `open-fin-al/src/domain/adaptive-learning/policyEngine.ts`
- adaptive feature/content registration modules that now declare governance criticality metadata
- focused domain tests under `open-fin-al/src/tests/domain/adaptive-learning/`

## Overload-reduction summary

The policy engine reduces overload by making governance explicit:

- **visible** for assets that match the learner and are safe to use now,
- **deemphasized** for assets that should stay available but not compete for attention,
- **locked** for assets that need prerequisite learning first,
- **hidden** for assets that are optional, dismissed, or strongly misaligned,
- **recommended** for the best-fit next actions,
- **suggested for later unlocking** when the learner needs a staged path instead of immediate access.

That means the learner sees fewer mismatched capabilities, more foundational guidance, and a clearer explanation of what to do next.
