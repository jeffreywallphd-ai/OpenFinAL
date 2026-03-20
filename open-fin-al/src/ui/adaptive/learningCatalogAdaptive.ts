import { buildAdaptiveGraphSyncPayload } from '@application/adaptive-learning/adaptiveGraphSnapshot';
import { bootstrapAdaptiveFeatures } from '@application/adaptive-learning/bootstrapAdaptiveFeatures';
import { bootstrapAdaptiveLearningContent } from '@application/adaptive-learning/bootstrapAdaptiveLearningContent';
import { createDefaultLearnerProfile } from '@application/adaptive-learning/learnerProfile';
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
  listAdaptiveFeatures,
  listAdaptiveLearningContent,
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

function getCatalogAssets() {
  bootstrapAdaptiveFeatures();
  bootstrapAdaptiveLearningContent();

  return {
    features: listAdaptiveFeatures().map((entry) => entry.metadata),
    learningAssets: listAdaptiveLearningContent().map((entry) => entry.metadata),
  };
}

function buildCatalogContextualHelpHint(
  profile: LearnerProfile,
  features: ReturnType<typeof getCatalogAssets>['features'],
  learningAssets: ReturnType<typeof getCatalogAssets>['learningAssets'],
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
  learningAssets: ReturnType<typeof getCatalogAssets>['learningAssets'],
  features: ReturnType<typeof getCatalogAssets>['features'],
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
  hasLearnerProfile: boolean,
  graphSynced: boolean,
  recommendationResult: AdaptiveLearningRecommendationResult,
): AdaptiveLearningCatalogBanner {
  if (!hasLearnerProfile) {
    return {
      title: 'Start with the learning foundations',
      message:
        'These starter recommendations use catalog defaults. Completing the learner profile enables graph-backed ranking and stronger feature unlock guidance.',
      tone: 'info',
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

export function buildAdaptiveLearningCatalogViewModel(runtime: AdaptiveLearningCatalogRuntime): AdaptiveLearningCatalogViewModel {
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
  const { features, learningAssets } = getCatalogAssets();
  const recommendationResult = buildAdaptiveLearningRecommendations({
    features,
    learningAssets,
    profile,
    graphRecommendations,
    limit: 3,
  });
  const contextualHelpHint = buildCatalogContextualHelpHint(profile, features, learningAssets, graphRecommendations);
  const guidedTutorial = buildCatalogGuidedTutorial(profile, recommendationResult, learningAssets, features, graphRecommendations);

  return {
    hasLearnerProfile,
    graphSynced: graphRecommendations.length > 0,
    learnerProfile: profile,
    graphRecommendations,
    guidedTutorial,
    banner: buildBanner(hasLearnerProfile, graphRecommendations.length > 0, recommendationResult),
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
  const profile = savedProfile ?? createDefaultLearnerProfile(`user-${safeUserId || 'guest'}`);
  let graphRecommendations: AdaptiveGraphAssetRecommendation[] = [];
  let graphSynced = false;

  if (savedProfile) {
    try {
      await adaptiveGraphRepository.syncAdaptiveLearningGraph(buildAdaptiveGraphSyncPayload(savedProfile));
      const snapshot = await adaptiveGraphRepository.getLearnerSnapshot(savedProfile.learnerId);
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
