# Adaptive Learning Module Area

## Purpose

The learning module area is now treated as a core adaptive-learning surface instead of a standalone catalog. The incremental refactor keeps the existing SQLite-backed module list and PowerPoint/HTML delivery paths, while layering adaptive metadata, recommendation signals, and feature-governance context on top.

## Goals covered in this increment

- Make module metadata first-class for rendering.
- Connect the learning-module area to the learner profile, adaptive graph, policy engine, recommender, guided tutorials, and contextual hints.
- Surface recommended modules, prerequisites, related features/tools, unlock opportunities, and tutorial/help entry points.
- Preserve existing rich content delivery flows, including the PowerPoint preview runtime and legacy `LearningModulePage` HTML slides.

## Architecture

### 1. Adaptive metadata remains the source of truth

Adaptive learning content metadata continues to live in the adaptive-learning domain. Learning modules now include `presentation` hints that map adaptive module metadata to legacy catalog records.

Current examples:

- `module-investing-basics` maps to legacy records such as `Introduction to Investing`, `Introduction to Stocks`, and `Introduction to Bonds`.
- `module-risk-basics` maps to the `Risk Free Investments` record.

This keeps matching explicit and incremental instead of attempting a full migration of every existing module into new authored metadata at once.

### 2. Module-area integration service

`open-fin-al/src/application/adaptive-learning/learningModuleArea.ts` is the new integration seam for the module area.

Responsibilities:

- bootstrap adaptive features and learning content
- match persisted SQLite learning modules to adaptive metadata
- reuse adaptive recommendation results when available
- translate prerequisites, related features, tutorials, help hints, graph reasons, and unlock opportunities into render-friendly view models
- classify content delivery as:
  - `pptx-preview`
  - `legacy-html-pages`
  - `unknown`

This keeps the renderer thin and gives the module area a stable metadata-to-rendering pipeline.

### 3. UI rendering model

The learning area now has two adaptive rendering layers:

1. **Adaptive recommendation cards** at the top of the page.
   - sourced from the adaptive recommender
   - show prerequisites, related tools/features, unlock opportunities, tutorials, and hints

2. **Metadata-enriched catalog cards** in the module list.
   - sourced from SQLite module records plus adaptive metadata matching
   - show delivery-pipeline status and adaptive relationships for each integrated module

The module details view also consumes the enriched card payload so the metadata story remains consistent when learners open a specific module.

## Rich content and PowerPoint/HTML flow

This change intentionally does **not** rewrite the PowerPoint-to-HTML or legacy slide conversion stack.

Instead, the module area now treats those flows as delivery backends:

- modules with `fileName` continue to use the existing PowerPoint preview runtime
- modules with `LearningModulePage` rows are treated as legacy HTML-slide modules
- modules without either can still participate in adaptive governance and metadata before richer authored content is added

This preserves backward compatibility while giving the adaptive layer enough structure to reason about content format and authoring maturity.

## Data flow

1. `Learn.jsx` loads persisted module rows from SQLite.
2. `useAdaptiveLearningCatalogRecommendations` loads learner-profile-aware adaptive recommendations.
3. `buildAdaptiveLearningModuleCards(...)` combines persisted records with:
   - learner profile
   - adaptive recommendation result
   - graph recommendations
   - adaptive metadata registry
4. The UI renders:
   - recommended modules
   - prerequisites and readiness
   - related features/tools
   - unlock opportunities
   - tutorial and help-hint entry points
   - delivery pipeline metadata

## Why this is incremental

- Existing data model stays intact.
- Existing module launch behavior stays intact.
- Only a subset of legacy modules is explicitly mapped to adaptive metadata right now.
- Matching is explicit and easy to extend as more modules receive authored metadata.

## Validation added

Targeted tests cover:

- metadata enrichment of persisted module rows
- adaptive recommendation + graph integration for module cards
- content-source classification for PPTX and legacy HTML slide modules
- richer adaptive recommendation view-model output

## What remains for future module-authoring improvements

1. Author adaptive metadata for the rest of the legacy catalog instead of relying on fallback/unmapped records.
2. Add authoring-time metadata for concepts, assessments, and mastery checkpoints.
3. Add deeper graph links from modules to domain concepts and feature capabilities.
4. Replace explicit record-id mapping with durable authored identifiers shared across SQLite and Neo4j.
5. Add a richer module-delivery abstraction so PPTX, HTML slide stacks, quizzes, and future authored formats share one runtime contract.
6. Add author tooling for module metadata editing, previewing, and validation.
