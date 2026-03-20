import {
  AdaptiveGraphAssetRecommendation,
  AdaptiveFeatureMetadata,
  LearnerProfile,
  TutorialMetadata,
  VisibilityDecision,
} from '@domain/adaptive-learning';

export type GuidedTutorialStatus = 'hidden' | 'locked' | 'available' | 'recommended' | 'completed';
export type GuidedTutorialTrigger = 'manual' | 'recommended' | 'automatic';
export type GuidedTutorialSessionStatus = 'idle' | 'active' | 'completed' | 'dismissed';

export interface GuidedTutorialScriptHook {
  id: string;
  kind: 'audio' | 'script';
  cue: string;
  autoPlay?: boolean;
}

export interface GuidedTutorialStepAnchor {
  anchorId: string;
  title: string;
  description?: string;
  placement?: 'top' | 'right' | 'bottom' | 'left' | 'center';
}

export interface GuidedTutorialStepDefinition {
  id: string;
  title: string;
  guidance: string;
  anchor: GuidedTutorialStepAnchor;
  scriptHook?: GuidedTutorialScriptHook;
}

export interface GuidedTutorialCompletionEffect {
  progressMarkerKey: string;
  progressValue?: number;
  unlockAssetIds?: string[];
  unlockRelatedFeature?: boolean;
  unlockRelatedAssets?: boolean;
}

export interface GuidedTutorialDefinition {
  tutorialId: string;
  featureId: string;
  contextIds: string[];
  title: string;
  description: string;
  trigger: {
    interestedTags?: string[];
    knowledgeLevels?: LearnerProfile['knowledgeLevel'][];
    autoStartWhenRecommended?: boolean;
  };
  steps: GuidedTutorialStepDefinition[];
  completion: GuidedTutorialCompletionEffect;
}

export interface GuidedTutorialRuntime {
  tutorial: TutorialMetadata;
  feature: AdaptiveFeatureMetadata;
  definition: GuidedTutorialDefinition;
  featureContextId: string;
  status: GuidedTutorialStatus;
  trigger: GuidedTutorialTrigger;
  available: boolean;
  autoStart: boolean;
  completed: boolean;
  completionMarkerKey: string;
  recommendationReasons: string[];
  graphReasons: string[];
  supportingAssetIds: string[];
  steps: GuidedTutorialStepDefinition[];
}

export interface GuidedTutorialSessionState {
  tutorialId: string;
  status: GuidedTutorialSessionStatus;
  currentStepIndex: number;
  startedAt?: string;
  completedAt?: string;
}

export const LEARNING_MODULES_SEARCH_TUTORIAL_ID = 'tutorial-learning-modules-search';
export const LEARNING_MODULES_SEARCH_COMPLETION_MARKER_KEY = 'tutorial-learning-modules-search-completed';

const guidedTutorialDefinitions: Record<string, GuidedTutorialDefinition> = {
  [LEARNING_MODULES_SEARCH_TUTORIAL_ID]: {
    tutorialId: LEARNING_MODULES_SEARCH_TUTORIAL_ID,
    featureId: 'feature-learning-modules-catalog',
    contextIds: ['feature-learning-modules-catalog', 'tool-learning-modules-search', 'tool-learning-modules-filter'],
    title: 'Learning modules quick-start',
    description: 'Step-by-step walkthrough for searching the learning catalog and using category filters.',
    trigger: {
      interestedTags: ['guided-tutorials', 'research'],
      knowledgeLevels: ['unknown', 'beginner', 'intermediate'],
      autoStartWhenRecommended: true,
    },
    completion: {
      progressMarkerKey: LEARNING_MODULES_SEARCH_COMPLETION_MARKER_KEY,
      progressValue: 1,
      unlockAssetIds: ['help-learning-modules-filters', 'module-investing-basics'],
      unlockRelatedFeature: true,
      unlockRelatedAssets: true,
    },
    steps: [
      {
        id: 'search-intro',
        title: 'Find a topic to study',
        guidance:
          'Start by typing a topic such as stocks, bonds, or risk into the search field so the catalog can narrow to the lessons that matter right now.',
        anchor: {
          anchorId: 'learning-modules-search-input',
          title: 'Search input',
          description: 'Enter keywords to focus the catalog.',
          placement: 'bottom',
        },
        scriptHook: {
          id: 'narration-search-intro',
          kind: 'audio',
          cue: 'Narrate that the learner can search by investing topic to quickly find starter material.',
        },
      },
      {
        id: 'filter-category',
        title: 'Refine by category',
        guidance:
          'Use the category filter when you know the lesson area you want, such as stocks, bonds, taxes, or risk analysis.',
        anchor: {
          anchorId: 'learning-modules-filter-select',
          title: 'Category filter',
          description: 'Narrow the catalog to one learning category.',
          placement: 'right',
        },
        scriptHook: {
          id: 'script-filter-category',
          kind: 'script',
          cue: 'Explain how filters reduce cognitive load by keeping only the most relevant lesson types visible.',
        },
      },
      {
        id: 'inspect-results',
        title: 'Open the right lesson',
        guidance:
          'Review the lesson cards, compare descriptions and time estimates, then open a module that matches your current goal and available study time.',
        anchor: {
          anchorId: 'learning-modules-results',
          title: 'Module results',
          description: 'Choose a lesson card and continue into the module viewer.',
          placement: 'top',
        },
        scriptHook: {
          id: 'narration-inspect-results',
          kind: 'audio',
          cue: 'Prompt the learner to compare titles, descriptions, and estimated time before opening a module.',
        },
      },
    ],
  },
};

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function getGuidedTutorialDefinition(tutorialId: string): GuidedTutorialDefinition | null {
  return guidedTutorialDefinitions[tutorialId] ?? null;
}

export function listGuidedTutorialDefinitions(): GuidedTutorialDefinition[] {
  return Object.values(guidedTutorialDefinitions);
}

export function buildGuidedTutorialRuntime({
  profile,
  tutorial,
  tutorialDecision,
  feature,
  featureDecision,
  featureContextId,
  graphRecommendations = [],
}: {
  profile: LearnerProfile;
  tutorial: TutorialMetadata;
  tutorialDecision: VisibilityDecision;
  feature: AdaptiveFeatureMetadata;
  featureDecision?: VisibilityDecision | null;
  featureContextId: string;
  graphRecommendations?: AdaptiveGraphAssetRecommendation[];
}): GuidedTutorialRuntime | null {
  const definition = getGuidedTutorialDefinition(tutorial.id);

  if (!definition || definition.featureId !== feature.id || !definition.contextIds.includes(featureContextId)) {
    return null;
  }

  const completed = profile.completedAssets.some((completion) => completion.assetId === tutorial.id);
  const graphReasons = graphRecommendations
    .filter((recommendation) =>
      recommendation.assetId === tutorial.id ||
      recommendation.assetId === feature.id ||
      tutorial.relationships.relatedAssetIds.includes(recommendation.assetId),
    )
    .flatMap((recommendation) => recommendation.reasons);

  const interestedTagMatch = (definition.trigger.interestedTags ?? []).some((tag) => profile.interestedTags.includes(tag));
  const knowledgeMatch = (definition.trigger.knowledgeLevels ?? []).includes(profile.knowledgeLevel);
  const tutorialRecommended = tutorialDecision.recommended || tutorialDecision.highlighted;
  const featureRecommended = Boolean(featureDecision?.recommended || featureDecision?.highlighted);
  const graphRecommended = graphReasons.length > 0;
  const status: GuidedTutorialStatus = completed
    ? 'completed'
    : tutorialDecision.availabilityState === 'hidden'
      ? 'hidden'
      : tutorialDecision.availabilityState === 'locked'
        ? 'locked'
        : tutorialRecommended || featureRecommended || interestedTagMatch || knowledgeMatch || graphRecommended
          ? 'recommended'
          : 'available';
  const trigger: GuidedTutorialTrigger = completed
    ? 'manual'
    : status === 'recommended' && definition.trigger.autoStartWhenRecommended
      ? 'automatic'
      : status === 'recommended'
        ? 'recommended'
        : 'manual';

  return {
    tutorial,
    feature,
    definition,
    featureContextId,
    status,
    trigger,
    available: status !== 'hidden' && status !== 'locked',
    autoStart: trigger === 'automatic',
    completed,
    completionMarkerKey: definition.completion.progressMarkerKey,
    recommendationReasons: uniqueValues([
      ...tutorialDecision.reasons,
      ...(featureDecision?.reasons ?? []),
      interestedTagMatch ? 'The learner profile explicitly asks for guided tutorials or research support.' : '',
      knowledgeMatch ? 'The learner knowledge level is in the tutorial’s target range for scaffolded guidance.' : '',
    ]),
    graphReasons: uniqueValues(graphReasons),
    supportingAssetIds: uniqueValues([
      ...tutorial.relationships.relatedAssetIds,
      ...tutorial.relationships.helpAssetIds,
      ...(featureDecision?.supportingAssetIds ?? []),
      ...tutorialDecision.supportingAssetIds,
    ]),
    steps: definition.steps,
  };
}

export function createGuidedTutorialSession(runtime: GuidedTutorialRuntime): GuidedTutorialSessionState {
  return {
    tutorialId: runtime.tutorial.id,
    status: runtime.completed ? 'completed' : 'idle',
    currentStepIndex: 0,
  };
}

export function startGuidedTutorialSession(
  session: GuidedTutorialSessionState,
  now: string = new Date().toISOString(),
): GuidedTutorialSessionState {
  if (session.status === 'completed') {
    return session;
  }

  return {
    ...session,
    status: 'active',
    startedAt: session.startedAt ?? now,
  };
}

export function goToNextGuidedTutorialStep(
  session: GuidedTutorialSessionState,
  runtime: GuidedTutorialRuntime,
): GuidedTutorialSessionState {
  if (session.status !== 'active') {
    return session;
  }

  const lastStepIndex = Math.max(runtime.steps.length - 1, 0);
  return {
    ...session,
    currentStepIndex: Math.min(session.currentStepIndex + 1, lastStepIndex),
  };
}

export function goToPreviousGuidedTutorialStep(session: GuidedTutorialSessionState): GuidedTutorialSessionState {
  if (session.status !== 'active') {
    return session;
  }

  return {
    ...session,
    currentStepIndex: Math.max(session.currentStepIndex - 1, 0),
  };
}

export function completeGuidedTutorialSession(
  session: GuidedTutorialSessionState,
  now: string = new Date().toISOString(),
): GuidedTutorialSessionState {
  return {
    ...session,
    status: 'completed',
    completedAt: now,
  };
}

export function dismissGuidedTutorialSession(session: GuidedTutorialSessionState): GuidedTutorialSessionState {
  if (session.status === 'completed') {
    return session;
  }

  return {
    ...session,
    status: 'dismissed',
  };
}

export function applyGuidedTutorialCompletion(
  profile: LearnerProfile,
  runtime: GuidedTutorialRuntime,
  now: string = new Date().toISOString(),
): LearnerProfile {
  const completedAssets = profile.completedAssets.some((completion) => completion.assetId === runtime.tutorial.id)
    ? profile.completedAssets.map((completion) => (
      completion.assetId === runtime.tutorial.id
        ? {
            ...completion,
            completedAt: now,
            completionType: 'completed' as const,
          }
        : completion
    ))
    : [
      ...profile.completedAssets,
      {
        assetId: runtime.tutorial.id,
        completedAt: now,
        completionType: 'completed' as const,
      },
    ];

  const progressMarkers = [
    ...(profile.progressMarkers ?? []).filter((marker) => marker.key !== runtime.definition.completion.progressMarkerKey),
    {
      key: runtime.definition.completion.progressMarkerKey,
      value: runtime.definition.completion.progressValue ?? 1,
      updatedAt: now,
    },
  ].sort((left, right) => left.key.localeCompare(right.key));

  const unlockedAssetIds = uniqueValues([
    ...profile.unlockedAssetIds,
    runtime.tutorial.id,
    ...(runtime.definition.completion.unlockAssetIds ?? []),
    ...(runtime.definition.completion.unlockRelatedFeature ? [runtime.feature.id] : []),
    ...(runtime.definition.completion.unlockRelatedAssets ? runtime.tutorial.relationships.relatedAssetIds : []),
    ...runtime.tutorial.relationships.helpAssetIds,
  ]);

  return {
    ...profile,
    completedAssets,
    progressMarkers,
    unlockedAssetIds,
    updatedAt: now,
  };
}
