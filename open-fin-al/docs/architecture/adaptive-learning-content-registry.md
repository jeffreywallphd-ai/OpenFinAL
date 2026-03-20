# Adaptive Learning Content Registry

## Purpose

The adaptive learning content registry gives learning modules, guided tutorials, and help hints the same registration discipline that the adaptive feature registry already provides for tools and workflows.

This keeps adaptive governance metadata for learning content in one place, without implementing recommendation behavior yet.

## Shared metadata contracts

The shared metadata contracts live in `src/domain/adaptive-learning/contracts.ts` and now support both tools and learning content.

For learning modules, tutorials, and help hints, the contracts capture at minimum:

- asset id and key
- title and description
- learning asset kind and category
- target knowledge level
- related investment goals
- related risk preferences
- tags/topics
- prerequisites
- supported modalities
- related feature ids
- optional unlock value
- optional recommended next-step information
- graph-ready relationships to related assets, tutorials, help hints, and accessibility hints

The added `supportedModalities`, `relatedFeatureIds`, `unlockValue`, and `recommendedNextSteps` fields keep the shape compatible with later graph sync and recommendation work while staying framework-agnostic.

## Registry and catalog layer

`src/domain/adaptive-learning/learningContentRegistry.ts` provides a registry parallel to `featureRegistry.ts`.

It is backed by the shared `src/domain/adaptive-learning/assetRegistry.ts` base class so feature and learning-content registries behave uniformly.

The learning-content registry can:

- register learning asset metadata from content modules
- prevent duplicate ids
- list all learning content assets
- look up a learning asset by id
- filter assets with the same adaptive selector contract used by features
- export graph-ready nodes for future sync work
- provide catalog helpers for modules, tutorials, and help hints independently

## Initial representative slice

A small but real slice of existing learning-related product surfaces is now registered under `src/application/adaptive-learning/content/**`:

### Learning modules

- `module-investing-basics`
- `module-risk-basics`

These map to the existing learning module catalog/details flow in:

- `src/View/Learn.jsx`
- `src/View/LearningModule/LearningModuleDetails.jsx`

### Guided tutorials

- `tutorial-learning-modules-search`
- `tutorial-trade-workbench-first-order`

These align to existing feature relationships for the learning catalog and trade workbench.

### Help hints

- `help-learning-modules-filters`
- `help-trade-workbench-order-entry`
- `help-keyboard-navigation-global`

These align with help/accessibility asset ids already referenced by adaptive feature metadata.

## Bootstrap pattern

`src/application/adaptive-learning/bootstrapAdaptiveLearningContent.ts` imports the representative content registration modules so one bootstrap call hydrates the content registry.

The renderer now boots both registries early:

1. adaptive feature registry
2. adaptive learning content registry

This means later policy and graph-sync work can query either registry without scraping React components.

## How the feature registry and learning-content registry fit together

The two registries are intentionally **parallel but separate**:

- the **feature registry** answers: “What tools/workflows can the learner use?”
- the **learning-content registry** answers: “What learning/support assets can guide the learner?”

They fit together through shared contracts and explicit relationships:

- both use the same domain enums for knowledge level, goals, risk, prerequisites, and selectors
- both export serializable graph-ready nodes
- both can point to one another through asset ids
- learning assets add `relatedFeatureIds` so recommendation or graph layers can move directly from content to tools
- features continue to reference tutorial/help ids so the UI or policy engine can attach support content without hard-coded component logic

In practice, this means a later adaptive engine can make coordinated decisions such as:

- recommend a learning module before unlocking a complex feature
- attach a help hint to a visible feature
- suggest a tutorial as the next step after a learner completes a module
- sync both feature and content nodes into one adaptive graph without re-modeling metadata

## Adding future learning content

When adding a new module, tutorial, or hint:

1. Create a registration module under `src/application/adaptive-learning/content/`.
2. Define a complete `LearningModuleMetadata`, `TutorialMetadata`, or `HelpHintMetadata` object.
3. Include `supportedModalities`, `relatedFeatureIds`, and any `recommendedNextSteps` or `unlockValue` fields that apply.
4. Call `registerAdaptiveLearningContent(metadata, { source: '<source file>' })`.
5. Import the module from `bootstrapAdaptiveLearningContent.ts`.
6. Add or update targeted registry tests.
7. Use `exportAdaptiveLearningContentGraphNodes()` for graph sync rather than scraping UI files.
