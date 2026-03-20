# Adaptive help hints and contextual guidance

## Purpose

This note describes how OpenFinAL now treats help hints as first-class adaptive assets that are:

- registered in the adaptive content registry;
- exported through the adaptive graph sync payload;
- selected against learner state and the current UI/tool context; and
- rendered inline so hints stay useful without becoming disruptive.

## What changed

OpenFinAL already modeled help hints as adaptive content assets. This implementation adds a dedicated selection layer so hints can be surfaced intentionally instead of being treated as generic recommendations.

The main additions are:

1. `selectAdaptiveHelpHints(...)` in `open-fin-al/src/domain/adaptive-learning/helpHintSelectionService.ts`
2. authored `contextualGuidance` metadata on help-hint assets
3. inline rendering in the learning catalog through `AdaptiveHelpHintPanel`

## Selection model

The help-hint selector combines five signal groups.

### 1. Learner knowledge fit

Each hint keeps its existing `knowledgeLevel`.

The selector compares learner knowledge to hint knowledge and:

- rewards aligned hints;
- allows slightly below/above hints if other context is strong; and
- suppresses poor-fit hints naturally through low scores or governance.

### 2. Current feature and tool context

Hints can declare `contextualGuidance.contextIds`, for example:

- `feature-learning-modules-catalog`
- `tool-learning-modules-search`
- `tool-trade-order-entry`

The selector also checks:

- `hintForAssetId`
- `relationships.relatedFeatureIds`
- tutorial/help/accessibility relationships

This means a hint can match the current experience either because it was authored directly for that UI area or because the adaptive graph already relates it to the active feature path.

### 3. Graph relevance relationships

The selector accepts graph recommendations and boosts hints when:

- the hint itself is recommended by the learner graph; or
- a currently relevant feature/tutorial recommendation points to that hint through `helpAssetIds` or related tutorial edges.

This keeps hint surfacing aligned with the same graph-backed relevance model used elsewhere in adaptive learning.

### 4. Optional exposure and suppression rules

Hints can now carry optional `contextualGuidance` rules:

- `exposureRules`: conditions that must be true before the hint is shown;
- `suppressionRules`: conditions that suppress the hint when satisfied;
- `maxDisplayCount`: an optional exposure cap; and
- `displayPriority`: an authored tie-breaker for similarly relevant hints.

The rules reuse `AdaptivePolicyCondition` so they stay serializable and consistent with the existing policy engine.

### 5. Non-intrusive governance

Hints are filtered out when:

- governance resolves them to `hidden`;
- the learner has already hidden/dismissed them;
- authored suppression rules match; or
- their exposure budget has been exhausted.

The selector returns only the strongest inline candidates and defaults to `limit: 1`, which keeps the system reusable without turning help into a blocking modal workflow.

## Runtime flow

```text
Help hint metadata
  -> adaptive content registry
  -> graph export / relationships
  -> selectAdaptiveHelpHints(...)
  -> learning-catalog runtime
  -> AdaptiveHelpHintPanel
```

In the current implementation, the Learn page builds a contextual help-hint slot for the learning-catalog search/filter area. That slot uses:

- learner profile state;
- registered features and help hints;
- graph recommendations when available; and
- the current context IDs for the catalog search tools.

## Authoring future hints

Future help hints should be authored the same way as other adaptive learning assets.

### Required authoring steps

1. Register the hint with `registerAdaptiveLearningContent(...)`.
2. Set `kind: 'help-hint'`.
3. Attach the hint to the appropriate feature using:
   - `hintForAssetId`
   - `relationships.relatedFeatureIds`
   - `relationships.tutorialAssetIds` and/or `relationships.helpAssetIds` when relevant
4. Add `contextualGuidance.contextIds` for the intended UI context.
5. Add optional `exposureRules`, `suppressionRules`, `displayPriority`, and `maxDisplayCount` only when needed.

### Practical authoring guidance

- Prefer one narrow context per hint surface, even if the hint can be related to multiple assets.
- Use graph relationships to connect the hint to nearby tutorials and features, rather than duplicating hint logic in UI components.
- Use `suppressionRules` for “the learner no longer needs this” conditions, such as completing a related tutorial.
- Use `maxDisplayCount` to keep frequently visited screens from repeatedly surfacing the same hint.
- Keep descriptions concise because the current renderer is designed for inline help, not a long-form tutorial.

## Current examples

- `help-learning-modules-filters`
  - targets the learning-catalog search/filter context;
  - is suppressed after the search tutorial is completed; and
  - has a small display budget to avoid repetition.

- `help-trade-workbench-order-entry`
  - targets trade workbench order-entry contexts;
  - requires stronger learner readiness; and
  - suppresses once the guided first-order tutorial is complete.

- `help-keyboard-navigation-global`
  - remains reusable as a low-priority accessibility hint across multiple contexts.

## Why this architecture is reusable

This design keeps adaptive help hints reusable because:

- hint selection lives in a domain service instead of UI-specific branching;
- metadata remains registry-backed and graph-exportable;
- rule evaluation reuses existing adaptive policy conditions; and
- UI surfaces can provide their own context IDs without redefining selection logic.

That makes it straightforward to add future hint surfaces in the trade workbench, portfolio area, or AI assistant while keeping one shared adaptive help-hint model.
