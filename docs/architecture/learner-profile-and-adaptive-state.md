# Learner profile and adaptive state

## Purpose

The first learner-profile capture flow gives OpenFinAL a stable, persisted profile that can be used for three adaptive jobs immediately:

1. **feature visibility decisions** such as deemphasizing or delaying advanced workflows,
2. **learning recommendations** such as suggesting modules and tutorials aligned to stated goals, and
3. **contextual help/tutorial logic** such as surfacing just-in-time guidance when a learner reports low confidence or low prior experience.

## End-to-end flow

The new flow follows the existing renderer-to-Electron architecture without coupling React views directly to persistence details.

```text
LearnerProfilePage (React view)
  -> LearnerProfileInteractor
    -> learner profile application mapping + validation
      -> ILearnerProfileStore
        -> ElectronLearnerProfileStore
          -> window.database preload bridge
            -> main-process SQLite handlers
              -> LearnerProfile table
```

### UI capture

The learner profile page captures:

- current financial knowledge level,
- investment goals,
- risk preference,
- optional confidence score,
- optional self-assessment text,
- optional experience markers,
- optional self-reported progress counts, and
- optional interest tags for future recommendations/help targeting.

The UI is intentionally simple: radio groups, checkbox groups, selects, and a single free-text field.

### Application/interactor flow

`LearnerProfileInteractor` is the renderer-facing workflow boundary.

Its responsibilities are:

- loading the current learner profile for the signed-in user,
- creating a default empty profile when one does not exist,
- validating survey input before persistence,
- mapping user-facing survey input into the canonical `LearnerProfile` shape, and
- delegating persistence to `ILearnerProfileStore`.

The mapping layer records both user-entered attributes and adaptive state scaffolding such as:

- `interestedTags`,
- `experienceMarkers`,
- `progressMarkers`,
- `completedAssets`,
- `unlockedAssetIds`, and
- `hiddenAssetIds`.

This means the same profile object can later support policy evaluation and graph sync without changing the UI contract again.

### Persistence integration

Persistence uses a dedicated `LearnerProfile` SQLite table.

The table stores a **canonical adaptive profile row** for each user:

- scalar columns for the highest-signal fields (`knowledgeLevel`, `riskPreference`, `confidenceScore`, `selfAssessment`, `profileVersion`, `updatedAt`), and
- JSON columns for list/graph-friendly adaptive state (`investmentGoals`, `interestedTags`, `experienceMarkers`, `progressMarkers`, `completedAssets`, `unlockedAssetIds`, `hiddenAssetIds`).

This design fits the current app architecture because it works with the existing `window.database` bridge and main-process SQLite handler flow while staying flexible for later graph export.

## Why this profile shape is enough for adaptive behavior

### Feature visibility

The persisted profile already includes fields needed by the current adaptive policy engine and expected future policies:

- `knowledgeLevel`
- `investmentGoals`
- `riskPreference`
- `progressMarkers`
- `completedAssets`
- `unlockedAssetIds`
- `hiddenAssetIds`

These support rules like:

- hide or deemphasize advanced tools for beginners,
- unlock a workflow after prerequisites are met,
- keep a dismissed asset hidden,
- recommend learning before exposing a higher-risk tool.

### Recommendations

Recommendations can use:

- `investmentGoals` to align to learner intent,
- `interestedTags` to rank content/features by topic affinity,
- `knowledgeLevel` to avoid mismatched complexity,
- `riskPreference` to avoid misaligned suggestions,
- `experienceMarkers` and `progressMarkers` to detect readiness.

### Contextual help/tutorial logic

Help and tutorial logic can use:

- `confidenceScore` for low-confidence support triggers,
- `selfAssessment` for qualitative UX follow-up or future summarization,
- `experienceMarkers` to decide when to show onboarding hints,
- `progressMarkers` to avoid repeating tutorials after the learner advances.

## Later adaptive graph sync

Later graph sync should not scrape UI state directly. Instead, it can read the persisted learner-profile row and project it into graph nodes/edges such as:

- **Learner node**: user identity + profile version + last-updated timestamp,
- **Goal edges**: learner -> investment goals,
- **Interest edges**: learner -> tags/features/content domains,
- **Progress edges**: learner -> progress-marker nodes,
- **Completion edges**: learner -> completed adaptive assets,
- **Preference properties**: knowledge level, risk preference, confidence score,
- **State edges**: learner -> hidden/unlocked assets.

Because the stored row already separates scalar preferences from JSON-based collections, later sync can either:

1. export the row directly into a graph adapter, or
2. rehydrate it through the existing mapper and emit graph entities from the canonical `LearnerProfile` object.

The second option is preferred because it keeps sync logic aligned with the same validation and defaulting rules used by the UI flow.

## Validation focus added with this change

Targeted tests cover:

- survey validation,
- survey-to-domain mapping,
- domain-to-persistence and persistence-to-domain mapping,
- SQLite store loading and upsert behavior, and
- interactor behavior for both invalid and valid save paths.
