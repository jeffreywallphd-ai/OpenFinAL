import { buildAdaptiveGraphSyncPayload } from '@application/adaptive-learning/adaptiveGraphSnapshot';
import {
  AdaptiveProfileCompleteness,
  getAdaptiveCatalogAssets,
  getAdaptiveProfileCompleteness,
  normalizeAdaptiveGraphRecommendations,
  normalizeLearnerProfile,
} from '@application/adaptive-learning/adaptiveCatalog';
import { buildGuidedTutorialRuntime, GuidedTutorialRuntime } from '@application/adaptive-learning/guidedTutorials';
import { IAdaptiveGraphRepository } from '@application/services/IAdaptiveGraphRepository';
import { ILearnerProfileStore } from '@application/services/ILearnerProfileStore';
import {
  AdaptiveGraphAssetRecommendation,
  AdaptiveHelpHintSelectionCandidate,
  AdaptiveLearningRecommendation,
  AdaptiveLearningRecommendationResult,
  LearnerProfile,
  buildAdaptiveLearningRecommendations,
  selectAdaptiveHelpHints,
} from '@domain/adaptive-learning';
import { ElectronAdaptiveGraphRepository } from '@infrastructure/electron/ElectronAdaptiveGraphRepository';
import { ElectronLearnerProfileStore } from '@infrastructure/electron/ElectronLearnerProfileStore';

export interface AdaptiveLearningCatalogBanner {
  title: string;
  message: string;
  tone: 'info' | 'success' | 'warning';
}

export interface AdaptiveLearningCatalogRuntime {
  hasLearnerProfile: boolean;
  profileCompleteness: AdaptiveProfileCompleteness;
  graphSynced: boolean;
  learnerProfile: LearnerProfile;
  guidedTutorial: GuidedTutorialRuntime | null;
  graphRecommendations: AdaptiveGraphAssetRecommendation[];
  banner: AdaptiveLearningCatalogBanner;
  recommendationResult: AdaptiveLearningRecommendationResult;
  contextualHelpHint: AdaptiveHelpHintSelectionCandidate | null;
}

export interface AdaptiveLearningRecommendationCard {
  assetId: string;
  title: string;
  kind: AdaptiveLearningRecommendation['asset']['kind'];
  score: number;
  summary: string;
  rationale: string[];
  prerequisites: Array<{
    label: string;
    satisfied: boolean;
  }>;
  relatedFeatures: Array<{
    assetId: string;
    title: string;
    availabilityState: string;
  }>;
  tutorials: Array<{
    assetId: string;
    title: string;
  }>;
  helpHints: Array<{
    assetId: string;
    title: string;
  }>;
  unlockOpportunities: Array<{
    assetId?: string;
    title: string;
    reason: string;
    unlockValue?: number;
  }>;
  featureUnlocks: Array<{
    assetId: string;
    title: string;
    availabilityState: string;
    whyItMatters: string;
  }>;
  graphReasons: string[];
  availabilityState: string;
}

export interface AdaptiveLearningCatalogViewModel {
  hasLearnerProfile: boolean;
  profileCompleteness: AdaptiveProfileCompleteness;
  graphSynced: boolean;
  learnerProfile: LearnerProfile;
  guidedTutorial: GuidedTutorialRuntime | null;
  graphRecommendations: AdaptiveGraphAssetRecommendation[];
  banner: AdaptiveLearningCatalogBanner;
  recommendationResult: AdaptiveLearningRecommendationResult;
  contextualHelpHint: AdaptiveContextualHelpHintViewModel | null;
  cards: AdaptiveLearningRecommendationCard[];
}

export interface AdaptiveContextualHelpHintViewModel {
  assetId: string;
  title: string;
  description: string;
  body: string;
  reasons: string[];
  graphReasons: string[];
  availabilityState: string;
}

function buildCatalogContextualHelpHint(
  profile: LearnerProfile,
  features: ReturnType<typeof getAdaptiveCatalogAssets>['features'],
  learningAssets: ReturnType<typeof getAdaptiveCatalogAssets>['learningAssets'],
  graphRecommendations: AdaptiveGraphAssetRecommendation[],
): AdaptiveHelpHintSelectionCandidate | null {
  const helpHints = learningAssets.filter((asset) => asset.kind === 'help-hint');

  return (
    selectAdaptiveHelpHints({
      profile,
      features,
      helpHints,
      graphRecommendations,
      context: {
        contextId: 'feature-learning-modules-catalog',
        featureId: 'feature-learning-modules-catalog',
        toolId: 'tool-learning-modules-search',
        tags: ['learning', 'search', 'filters'],
        relatedAssetIds: ['tutorial-learning-modules-search'],
      },
    })[0] ?? null
  );
}

function buildCatalogGuidedTutorial(
  profile: LearnerProfile,
  recommendationResult: AdaptiveLearningRecommendationResult,
  learningAssets: ReturnType<typeof getAdaptiveCatalogAssets>['learningAssets'],
  features: ReturnType<typeof getAdaptiveCatalogAssets>['features'],
  graphRecommendations: AdaptiveGraphAssetRecommendation[],
): GuidedTutorialRuntime | null {
  const tutorial = learningAssets.find((asset): asset is Extract<(typeof learningAssets)[number], { kind: 'tutorial' }> => asset.id === 'tutorial-learning-modules-search' && asset.kind === 'tutorial');
  const feature = features.find((asset) => asset.id === 'feature-learning-modules-catalog');

  if (!tutorial || !feature) {
    return null;
  }

  return buildGuidedTutorialRuntime({
    profile,
    tutorial,
    tutorialDecision: recommendationResult.decisionsByAssetId[tutorial.id],
    feature,
    featureDecision: recommendationResult.decisionsByAssetId[feature.id],
    featureContextId: feature.id,
    graphRecommendations,
  });
}

function buildBanner(
  profileCompleteness: AdaptiveProfileCompleteness,
  graphSynced: boolean,
  recommendationResult: AdaptiveLearningRecommendationResult,
): AdaptiveLearningCatalogBanner {
  if (profileCompleteness === 'missing') {
    return {
      title: 'Start with the learning foundations',
      message:
        'These starter recommendations use catalog defaults. Completing the learner profile enables graph-backed ranking and stronger feature unlock guidance.',
      tone: 'info',
    };
  }

  if (profileCompleteness === 'partial') {
    return {
      title: 'Finish the learner profile for stronger guidance',
      message:
        'Adaptive learning is using safe defaults because the saved profile is incomplete. Add knowledge level, risk preference, and goals to unlock more precise graph sync and recommendation ranking.',
      tone: 'warning',
    };
  }

  if (recommendationResult.featureGovernance.lockedFeatureIds.length > 0) {
    return {
      title: 'Learn to unlock product features',
      message:
        'The recommendation engine is prioritizing learning assets that help explain or unlock currently locked features before advanced tools compete for attention.',
      tone: 'warning',
    };
  }

  return {
    title: graphSynced ? 'Graph-backed learning recommendations' : 'Adaptive learning recommendations',
    message: graphSynced
      ? 'These recommendations combine learner profile fit, adaptive graph signals, and current feature governance states.'
      : 'These recommendations combine learner profile fit and local feature governance while the graph remains unavailable.',
    tone: 'success',
  };
}

function describePrerequisite(prerequisite: AdaptiveLearningRecommendation['asset']['prerequisites'][number]): string {
  return prerequisite.description;
}

export function buildAdaptiveLearningCatalogViewModel(runtime: AdaptiveLearningCatalogRuntime): AdaptiveLearningCatalogViewModel {
  const { features, learningAssets } = getAdaptiveCatalogAssets();
  const featuresById = features.reduce<Record<string, (typeof features)[number]>>((accumulator, feature) => {
    accumulator[feature.id] = feature;
    return accumulator;
  }, {});
  const learningAssetsById = learningAssets.reduce<Record<string, (typeof learningAssets)[number]>>((accumulator, asset) => {
    accumulator[asset.id] = asset;
    return accumulator;
  }, {});

  return {
    ...runtime,
    guidedTutorial: runtime.guidedTutorial,
    contextualHelpHint: runtime.contextualHelpHint
      ? {
          assetId: runtime.contextualHelpHint.asset.id,
          title: runtime.contextualHelpHint.asset.title,
          description: runtime.contextualHelpHint.asset.description,
          body: runtime.contextualHelpHint.reasons[0] ?? runtime.contextualHelpHint.asset.description,
          reasons: runtime.contextualHelpHint.reasons,
          graphReasons: runtime.contextualHelpHint.graphReasons,
          availabilityState: runtime.contextualHelpHint.governanceDecision.availabilityState,
        }
      : null,
    cards: runtime.recommendationResult.recommendations.map((recommendation) => ({
      assetId: recommendation.asset.id,
      title: recommendation.asset.title,
      kind: recommendation.asset.kind,
      score: recommendation.score,
      summary: recommendation.explanation.summary,
      rationale: recommendation.explanation.reasons.slice(0, 3).map((reason) => reason.message),
      prerequisites: recommendation.governanceDecision.explanation.debug.prerequisiteStatuses.map((status) => ({
        label: describePrerequisite(status.prerequisite),
        satisfied: status.satisfied,
      })),
      relatedFeatures: recommendation.asset.relationships.relatedFeatureIds
        .map((featureId) => featuresById[featureId])
        .filter(Boolean)
        .map((feature) => ({
          assetId: feature.id,
          title: feature.title,
          availabilityState: runtime.recommendationResult.decisionsByAssetId[feature.id]?.availabilityState ?? 'visible',
        })),
      tutorials: recommendation.asset.relationships.tutorialAssetIds
        .map((assetId) => learningAssetsById[assetId])
        .filter(Boolean)
        .map((asset) => ({
          assetId: asset.id,
          title: asset.title,
        })),
      helpHints: recommendation.asset.relationships.helpAssetIds
        .map((assetId) => learningAssetsById[assetId])
        .filter(Boolean)
        .map((asset) => ({
          assetId: asset.id,
          title: asset.title,
        })),
      unlockOpportunities: [
        ...recommendation.relatedFeatureUnlocks.map((unlock) => ({
          assetId: unlock.assetId,
          title: unlock.title,
          reason: unlock.whyItMatters,
          unlockValue: unlock.unlockValue,
        })),
        ...(recommendation.asset.recommendedNextSteps ?? []).map((nextStep) => ({
          assetId: nextStep.assetId,
          title: nextStep.title,
          reason: nextStep.reason,
          unlockValue: nextStep.unlockValue,
        })),
      ],
      featureUnlocks: recommendation.relatedFeatureUnlocks.map((unlock) => ({
        assetId: unlock.assetId,
        title: unlock.title,
        availabilityState: unlock.availabilityState,
        whyItMatters: unlock.whyItMatters,
      })),
      graphReasons: recommendation.graphReasons,
      availabilityState: recommendation.governanceDecision.availabilityState,
    })),
  };
}

export function buildAdaptiveLearningCatalogRuntime({
  profile,
  hasLearnerProfile,
  graphRecommendations = [],
}: {
  profile: LearnerProfile;
  hasLearnerProfile: boolean;
  graphRecommendations?: AdaptiveGraphAssetRecommendation[];
}): AdaptiveLearningCatalogRuntime {
  const normalizedProfile = normalizeLearnerProfile(profile, profile.learnerId);
  const profileCompleteness = getAdaptiveProfileCompleteness(normalizedProfile, hasLearnerProfile);
  const { features, learningAssets, assetLookup } = getAdaptiveCatalogAssets();
  const normalizedGraphRecommendations = normalizeAdaptiveGraphRecommendations(graphRecommendations, assetLookup).recommendations;
  const recommendationResult = buildAdaptiveLearningRecommendations({
    features,
    learningAssets,
    profile: normalizedProfile,
    graphRecommendations: normalizedGraphRecommendations,
    limit: 3,
  });
  const contextualHelpHint = buildCatalogContextualHelpHint(normalizedProfile, features, learningAssets, normalizedGraphRecommendations);
  const guidedTutorial = buildCatalogGuidedTutorial(normalizedProfile, recommendationResult, learningAssets, features, normalizedGraphRecommendations);

  return {
    hasLearnerProfile,
    profileCompleteness,
    graphSynced: normalizedGraphRecommendations.length > 0,
    learnerProfile: normalizedProfile,
    graphRecommendations: normalizedGraphRecommendations,
    guidedTutorial,
    banner: buildBanner(profileCompleteness, normalizedGraphRecommendations.length > 0, recommendationResult),
    recommendationResult,
    contextualHelpHint,
  };
}

export async function loadAdaptiveLearningCatalogRuntime(
  userId: number | null | undefined,
  {
    learnerProfileStore = new ElectronLearnerProfileStore(),
    adaptiveGraphRepository = new ElectronAdaptiveGraphRepository(),
  }: {
    learnerProfileStore?: ILearnerProfileStore;
    adaptiveGraphRepository?: IAdaptiveGraphRepository;
  } = {},
): Promise<AdaptiveLearningCatalogRuntime> {
  const safeUserId = userId ?? 0;
  const savedProfile = safeUserId > 0 ? await learnerProfileStore.loadByUserId(safeUserId) : null;
  const profile = normalizeLearnerProfile(savedProfile, `user-${safeUserId || 'guest'}`);
  let graphRecommendations: AdaptiveGraphAssetRecommendation[] = [];
  let graphSynced = false;

  if (savedProfile && getAdaptiveProfileCompleteness(profile, true) === 'complete') {
    try {
      await adaptiveGraphRepository.syncAdaptiveLearningGraph(buildAdaptiveGraphSyncPayload(profile));
      const snapshot = await adaptiveGraphRepository.getLearnerSnapshot(profile.learnerId);
      graphRecommendations = snapshot?.recommendations ?? [];
      graphSynced = true;
    } catch (_error) {
      graphSynced = false;
    }
  }

  return {
    ...buildAdaptiveLearningCatalogRuntime({
      profile,
      hasLearnerProfile: Boolean(savedProfile),
      graphRecommendations,
    }),
    graphSynced,
  };
}
