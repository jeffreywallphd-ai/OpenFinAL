# Adaptive Guided Tutorials

## Overview

The adaptive guided tutorial framework adds a reusable tutorial runtime that can attach authored walkthroughs to product features, decide when they should be surfaced, and persist completion back into learner state for later recommendations and feature unlocking.

The first production integration targets the **Learning Modules catalog** and walks the learner through:

1. searching for a topic,
2. filtering by category, and
3. reviewing result cards before opening a module.

## Architecture

### 1. Authoring and runtime model

Tutorial authoring lives in `open-fin-al/src/application/adaptive-learning/guidedTutorials.ts`.

Each tutorial definition includes:

- `tutorialId` and `featureId` so the tutorial is tied to a registered adaptive tutorial asset and a feature.
- `contextIds` so the same framework can scope a tutorial to a specific feature or tool surface.
- `steps[]` for sequenced progression.
- per-step `guidance` text.
- per-step `anchor` metadata for UI targeting and highlighting.
- optional `scriptHook` metadata for future narration/audio pipelines.
- `completion` rules that describe which learner progress markers and unlocks should be written back when the tutorial finishes.

`buildGuidedTutorialRuntime(...)` combines tutorial authoring with adaptive metadata and learner state to produce a reusable runtime object.

### 2. Adaptive availability and triggering

Tutorial runtime construction combines four signal groups:

- **Learner profile**: interested tags, knowledge level, prior completion state.
- **Feature context**: the current feature context must match the authored context ids.
- **Graph relationships**: graph recommendations for the feature, tutorial, or related assets raise tutorial relevance.
- **Adaptive policy decisions**: tutorial and feature governance decisions from the adaptive recommendation engine influence whether the tutorial is hidden, locked, available, or recommended.

This keeps tutorial surfacing aligned with the same adaptive system already governing features, learning modules, and help hints.

### 3. Completion feedback loop

`applyGuidedTutorialCompletion(...)` updates learner state by:

- marking the tutorial asset as completed,
- writing a dedicated progress marker,
- unlocking related assets and the parent feature where configured.

That updated learner profile is then persisted by `GuidedTutorialInteractor`, which allows later adaptive evaluations to:

- suppress repeat tutorial prompts,
- recommend follow-up content,
- unlock related feature guidance,
- use tutorial completion as part of later policy and graph-based decisions.

### 4. UI integration

`AdaptiveGuidedTutorial` is a reusable UI shell that:

- renders tutorial status and rationale,
- manages step progression,
- highlights the currently anchored UI element via `data-guided-tutorial-anchor`,
- exposes step guidance and script/audio hook text,
- notifies the caller when the tutorial completes.

The first integration is in `open-fin-al/src/View/Learn.jsx`, where the tutorial is connected to three anchors:

- `learning-modules-search-input`
- `learning-modules-filter-select`
- `learning-modules-results`

## Authoring new tutorials

To add another guided tutorial for a future tool:

1. Register a new adaptive tutorial asset in the learning content catalog.
2. Add a guided tutorial definition in `guidedTutorials.ts` with:
   - feature id,
   - context ids,
   - steps,
   - anchor ids,
   - optional script/audio hooks,
   - completion effects.
3. Ensure the target UI provides matching `data-guided-tutorial-anchor` values.
4. Build a runtime for the target feature by combining:
   - learner profile,
   - recommendation result decisions,
   - graph recommendations,
   - the relevant feature context id.
5. Render `AdaptiveGuidedTutorial` and persist completion through an interactor or feature-specific action.

## Why this is reusable

The framework is reusable because the authoring definition is separated from:

- adaptive metadata registration,
- runtime eligibility evaluation,
- session progression,
- persistence of completion state,
- and the UI presentation shell.

That means future tools can adopt the same framework by swapping only tutorial definitions, feature context, and UI anchors.
