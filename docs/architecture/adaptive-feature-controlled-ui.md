# Adaptive feature-controlled UI

## What this change implements

This change wires the **Trade page / trade workbench** into the adaptive-learning stack as the first real feature-controlled UI slice.

The slice now combines four adaptive inputs:

1. **Learner profile persistence**
   - The renderer loads the saved learner profile for the signed-in user when one exists.
   - If no learner profile exists, the UI falls back to a usable default state instead of locking the workspace.

2. **Adaptive catalog metadata**
   - The slice reads the registered adaptive assets for:
     - `feature-trade-workbench`
     - `module-risk-basics`
     - `tutorial-trade-workbench-first-order`
     - `help-trade-workbench-order-entry`

3. **Adaptive policy engine**
   - The policy engine maps the learner profile to visibility / locked / deemphasized / recommended decisions.
   - Those decisions are then translated into UI-safe tool states for the trade page.

4. **Adaptive graph recommendations**
   - When a saved learner profile exists, the UI syncs the learner state into the adaptive graph repository.
   - The slice then reads graph recommendations and uses them to highlight the most relevant next learning assets inside the trade workflow.

## Why the Trade page was chosen first

The Trade page is a strong first slice because it already contains multiple meaningful tools in one workspace:

- chart review,
- order entry,
- SEC filing shortcuts,
- AI fundamental analysis,
- related guided learning assets.

That made it possible to demonstrate all required adaptive behaviors without refactoring the whole app.

## Renderer flow

1. The Trade page calls `useAdaptiveTradeWorkbenchGovernance(userId)`.
2. The hook loads the persisted learner profile if present.
3. If a profile exists:
   - the hook syncs it into the adaptive graph repository,
   - reads the learner snapshot / recommendations,
   - evaluates the adaptive policy engine locally using the registered adaptive assets.
4. The slice builder converts asset-level decisions into reusable UI states for real tools on the page.
5. Reusable UI components render those states consistently.

## Adaptive behaviors now active on the Trade page

### 1. Show / hide

- Adaptive sections can be fully hidden when the underlying tool state is hidden.
- The learning-path panel only renders learning assets that remain visible after governance.

### 2. Locked / unlocked

- The **Place a trade** action now maps to trade-workbench readiness.
- When the learner still needs the risk-basics module or the guided first-order tutorial path, the UI shows an unlock-later state and disables the button.

### 3. Deemphasis of advanced features

- **AI fundamental analysis** is deemphasized for learners who are not yet advanced enough for that tool.
- **SEC filing shortcuts** are deemphasized for early-stage learners or when the broader trade workflow is deemphasized.

### 4. Learn-first / unlock-later messaging

- Locked actions surface guidance like “Learn first” and “Unlock later”.
- Supporting assets from the policy engine are surfaced as human-readable titles so the learner can see what to study next.

### 5. Recommended-next highlighting

- The slice highlights the next module / tutorial / hint cards when the policy engine or learner graph recommends them.
- Graph-backed reasons are shown directly in the adaptive learning path panel.

## Reusable building blocks added

### `src/ui/adaptive/tradeWorkbenchAdaptive.ts`

A reusable mapping layer that:

- loads the adaptive asset metadata needed by the slice,
- translates policy-engine output into UI-safe adaptive tool states,
- merges graph recommendations into those states,
- provides a fallback no-profile mode.

### `src/ui/adaptive/useAdaptiveTradeWorkbenchGovernance.ts`

A reusable hook that:

- loads learner state,
- performs graph sync / snapshot lookup when available,
- returns a ready-to-render adaptive slice.

### `src/ui/adaptive/AdaptiveFeatureSection.jsx`

Reusable presentation wrapper for:

- recommended tools,
- locked tools,
- deemphasized tools,
- compact adaptive subsections.

### `src/ui/adaptive/AdaptiveLearningPath.jsx`

Reusable adaptive recommendation rail for related learning assets.

### `src/ui/adaptive/AdaptiveTradeWorkbenchBanner.jsx`

Reusable banner for top-of-slice guidance and graph/fallback status.

## Fallback behavior when no learner profile exists

The app must remain usable before personalization starts.

For that reason, the Trade page fallback mode intentionally:

- keeps chart review available,
- keeps order entry available,
- keeps advanced tools visible but deemphasized,
- recommends a risk-learning path,
- explains that completing the learner profile enables stronger personalization.

This avoids the bad default where an “unknown” profile would make the first adaptive experience feel broken or overly restrictive.

## What should be integrated next

The next highest-value UI areas are:

1. **Portfolio dashboard**
   - Govern deposits, allocation views, and performance insights.
   - Highlight beginner-friendly portfolio walkthroughs before advanced analysis.

2. **Learning catalog**
   - Use the same adaptive section wrappers to highlight best-fit modules and hide low-value noise.

3. **Sidebar / navigation-level feature entry points**
   - Move feature visibility and deemphasis up to entry points so the learner sees a coherent app-wide progression.

4. **News / research workspace**
   - Govern advanced research tools, article summarization, and SEC/news cross-links based on learner readiness.

5. **Forecast / comparison tools**
   - These are likely advanced and would benefit from adaptive deemphasis plus stronger learn-first messaging.

## Testing strategy added with this slice

Targeted tests now validate:

- no-profile fallback mapping,
- locked + deemphasized trade states for beginner learners,
- graph recommendation highlighting for recommended next tools.
