# Future workspace migration plan

## Goal

Prepare OpenFinAL for a future workspace-style architecture without forcing a disruptive monorepo split today.

## What changed now

This preparatory refactor introduces a small, concrete slice of the future package boundaries inside the existing app:

- `open-fin-al/src/domain/stock`
  - stock domain entities that can remain framework-agnostic and become a future `packages/domain` seed.
- `open-fin-al/src/application`
  - the existing application layer remains in place and continues to host stock mapping/use-case DTO logic.
- `open-fin-al/src/infrastructure`
  - the existing infrastructure layer remains in place for Electron-backed implementations.
- `open-fin-al/src/ui/stock`
  - stock-specific renderer components moved behind a clearer UI boundary.
- `open-fin-al/src/shared/ipc`
  - preload/main shared IPC contracts and channels grouped into a boundary that could later become shared cross-process code.

This is intentionally a **pattern-establishing** refactor, not a full migration.

## Why this is low risk

- Only a focused stock feature slice was moved.
- Existing behavior and public flows are preserved.
- The legacy `Entity`, `Interactor`, `Gateway`, `View`, and `main` structure remains intact for the rest of the app.
- Import updates were kept local to the moved files and their direct dependents.

## Suggested future workspace target

A later migration can evolve the repository toward:

- `apps/desktop`
- `packages/domain`
- `packages/application`
- `packages/infrastructure`
- `packages/ui`
- `packages/shared-types`

## Phased plan

### Phase 0: Today's preparatory state

Keep a single app repository layout, but continue introducing internal boundaries under `open-fin-al/src`:

- `domain/` for framework-agnostic business models and domain rules.
- `application/` for use-case orchestration, DTOs, and mapping logic.
- `infrastructure/` for Electron/platform adapters and provider implementations.
- `ui/` for renderer components and feature-level presentation code.
- `shared/` for process-shared contracts and types.

### Phase 1: Expand by feature slices

Gradually migrate additional areas one feature at a time instead of moving the full tree all at once.

Recommended next candidates:

1. Additional pure entities from `Entity/` into `domain/`.
2. UI-only feature folders from `View/` into `ui/`.
3. Cross-process or cross-layer contracts from `IPC/` into `shared/`.
4. More Electron-backed implementations into `infrastructure/`.

During this phase:

- Prefer moving files only when a feature is already being touched.
- Add barrel exports where helpful.
- Preserve stable entry points to avoid breaking broad import surfaces all at once.

### Phase 2: Separate package-ready APIs

Before creating workspaces, make package seams explicit:

- Ensure `domain/` does not depend on `ui/`, `main/`, or Electron APIs.
- Keep `application/` free from renderer and Electron dependencies.
- Keep `shared/` limited to contracts, schemas, and common types.
- Reduce deep relative imports by standardizing alias usage and narrow public entry points.

At the end of this phase, each boundary should look like a package even while still living inside one app.

### Phase 3: Introduce workspaces without large code rewrites

Create:

- `apps/desktop` for the Electron application shell, renderer bootstrapping, and app-specific composition.
- `packages/domain` for domain entities and business rules.
- `packages/application` for use-case logic and DTOs.
- `packages/infrastructure` for provider adapters and Electron/platform implementations.
- `packages/ui` for reusable UI feature modules and shared components.
- `packages/shared-types` for IPC contracts, request/response schemas, and cross-boundary types.

Suggested migration mechanics:

- Move one internal boundary at a time.
- Start with `shared` and `domain`, which usually have the fewest runtime assumptions.
- Use temporary compatibility re-exports from old paths while imports are updated incrementally.
- Keep tests green after each boundary extraction.

### Phase 4: Narrow app composition responsibilities

After workspaces exist, `apps/desktop` should mostly:

- compose use cases,
- wire infrastructure implementations,
- host Electron main/preload/renderer entry points,
- and render UI packages.

The app should avoid becoming the long-term home for reusable business logic.

## What should wait for a later migration

The following should **not** be moved in bulk during this preparatory step:

- the full `Entity/` tree,
- the full `View/` tree,
- all gateway/interactor files,
- database and asset folders,
- build and packaging configuration.

Those areas are better migrated incrementally when their feature boundaries are clearer and when workspace tooling is introduced.

## Practical migration checklist

When moving another slice later:

1. Pick one feature or one boundary.
2. Move only files with a clear ownership story.
3. Update direct imports.
4. Add or update tests.
5. Run architecture lint and test suites.
6. Only then move to the next slice.

This keeps the repository shippable while steadily making a future workspace split easier.
