import { buildAdaptiveGraphSyncPayload } from '@application/adaptive-learning/adaptiveGraphSnapshot';
import {
  AdaptiveProfileCompleteness,
  getAdaptiveCatalogAssets,
  getAdaptiveProfileCompleteness,
  normalizeAdaptiveGraphRecommendations,
  normalizeLearnerProfile,
} from '@application/adaptive-learning/adaptiveCatalog';
import { IAdaptiveGraphRepository } from '@application/services/IAdaptiveGraphRepository';
import { ILearnerProfileStore } from '@application/services/ILearnerProfileStore';
import { ElectronLearnerProfileStore } from '@infrastructure/electron/ElectronLearnerProfileStore';
import { ElectronAdaptiveGraphRepository } from '@infrastructure/electron/ElectronAdaptiveGraphRepository';
import {
  AdaptiveAssetMetadata,
  AdaptiveGraphAssetRecommendation,
  FeatureAvailabilityState,
  LearnerProfile,
  VisibilityDecision,
  evaluateAdaptivePolicyEngine,
  getAdaptiveFeatureById,
  getAdaptiveLearningContentById,
} from '@domain/adaptive-learning';

const TRADE_WORKBENCH_FEATURE_ID = 'feature-trade-workbench';
const TRADE_TUTORIAL_ID = 'tutorial-trade-workbench-first-order';
const TRADE_HELP_HINT_ID = 'help-trade-workbench-order-entry';
const RISK_MODULE_ID = 'module-risk-basics';

export interface AdaptiveUiState {
  assetId: string;
  title: string;
  availabilityState: FeatureAvailabilityState | 'default';
  visible: boolean;
  locked: boolean;
  deemphasized: boolean;
  recommended: boolean;
  highlighted: boolean;
  message: string;
  reasons: string[];
  supportingAssetIds: string[];
  supportingAssetTitles: string[];
  recommendationReasons: string[];
  source: 'policy' | 'fallback';
}

export interface AdaptiveUiBanner {
  title: string;
  message: string;
  tone: 'info' | 'success' | 'warning';
}

export interface AdaptiveTradeWorkbenchSlice {
  hasLearnerProfile: boolean;
  profileCompleteness: AdaptiveProfileCompleteness;
  learnerProfile: LearnerProfile;
  graphRecommendations: AdaptiveGraphAssetRecommendation[];
  banner: AdaptiveUiBanner;
  tools: {
    chartReview: AdaptiveUiState;
    placeTrade: AdaptiveUiState;
    secFilings: AdaptiveUiState;
    aiFundamentalAnalysis: AdaptiveUiState;
  };
  learningAssets: AdaptiveUiState[];
}

export interface AdaptiveTradeWorkbenchRuntime {
  slice: AdaptiveTradeWorkbenchSlice;
  graphSynced: boolean;
}

interface BuildTradeWorkbenchAdaptiveSliceOptions {
  profile: LearnerProfile;
  hasLearnerProfile: boolean;
  graphRecommendations?: AdaptiveGraphAssetRecommendation[];
}

function getTradeWorkbenchAssets(): Record<string, AdaptiveAssetMetadata> {
  return getAdaptiveCatalogAssets().assetLookup;
}

function createFallbackState(
  asset: AdaptiveAssetMetadata,
  overrides: Partial<AdaptiveUiState> = {},
): AdaptiveUiState {
  return {
    assetId: asset.id,
    title: asset.title,
    availabilityState: 'default',
    visible: true,
    locked: false,
    deemphasized: false,
    recommended: false,
    highlighted: false,
    message: 'Complete the learner profile to personalize this tool.',
    reasons: [],
    supportingAssetIds: [],
    supportingAssetTitles: [],
    recommendationReasons: [],
    source: 'fallback',
    ...overrides,
  };
}

function buildMessage(
  asset: AdaptiveAssetMetadata,
  decision: VisibilityDecision,
  recommendation?: AdaptiveGraphAssetRecommendation,
): string {
  if (decision.availabilityState === 'locked') {
    const supportText = decision.supportingAssetIds.length > 0 ? ' Learn first with the related guidance below.' : '';
    return `${asset.title} is locked for now.${supportText}`;
  }

  if (decision.availabilityState === 'deemphasized') {
    return `${asset.title} is available, but it is deemphasized until the learner is a stronger fit.`;
  }

  if (recommendation) {
    return recommendation.reasons[0] ?? `${asset.title} is recommended next based on the learner graph.`;
  }

  if (decision.highlighted || decision.recommended) {
    return `${asset.title} is a good next step for the learner right now.`;
  }

  return decision.explanation.summary;
}

export function mapAdaptiveDecisionToUiState(
  asset: AdaptiveAssetMetadata,
  decision: VisibilityDecision,
  assetLookup: Record<string, AdaptiveAssetMetadata>,
  recommendation?: AdaptiveGraphAssetRecommendation,
  overrides: Partial<AdaptiveUiState> = {},
): AdaptiveUiState {
  const supportingAssetTitles = decision.supportingAssetIds
    .map((assetId) => assetLookup[assetId]?.title)
    .filter((value): value is string => Boolean(value));

  return {
    assetId: asset.id,
    title: asset.title,
    availabilityState: decision.availabilityState,
    visible: decision.availabilityState !== 'hidden',
    locked: decision.availabilityState === 'locked',
    deemphasized: decision.availabilityState === 'deemphasized',
    recommended: decision.recommended || Boolean(recommendation),
    highlighted: decision.highlighted || Boolean(recommendation),
    message: buildMessage(asset, decision, recommendation),
    reasons: [...decision.reasons],
    supportingAssetIds: [...decision.supportingAssetIds],
    supportingAssetTitles,
    recommendationReasons: recommendation?.reasons ?? [],
    source: 'policy',
    ...overrides,
  };
}

function buildBanner(
  profileCompleteness: AdaptiveProfileCompleteness,
  tradeState: AdaptiveUiState,
  riskModuleState: AdaptiveUiState,
): AdaptiveUiBanner {
  if (profileCompleteness === 'missing') {
    return {
      title: 'Start with sensible defaults',
      message:
        'The trade workbench stays usable without a learner profile. Complete the learner profile to unlock personalized recommendations, emphasis, and learn-first guidance.',
      tone: 'info',
    };
  }

  if (profileCompleteness === 'partial') {
    return {
      title: 'Complete the learner profile before heavy trading',
      message:
        'This workspace is using conservative defaults because the saved learner profile is incomplete. Add knowledge level, goals, and risk preference before stronger trade personalization or graph sync is applied.',
      tone: 'warning',
    };
  }

  if (tradeState.locked || riskModuleState.recommended) {
    return {
      title: 'Learn first, then trade',
      message:
        'This learner is being guided toward the risk basics module and first-order tutorial before heavier trade actions are emphasized.',
      tone: 'warning',
    };
  }

  if (tradeState.recommended || tradeState.highlighted) {
    return {
      title: 'Trade workflow is ready',
      message: 'The learner profile and graph both indicate this trade workflow is a strong next step.',
      tone: 'success',
    };
  }

  return {
    title: 'Adaptive guidance is active',
    message: 'This workspace is using learner state to tune which trade tools are emphasized and which learning steps appear first.',
    tone: 'info',
  };
}

export function buildTradeWorkbenchAdaptiveSlice({
  profile,
  hasLearnerProfile,
  graphRecommendations = [],
}: BuildTradeWorkbenchAdaptiveSliceOptions): AdaptiveTradeWorkbenchSlice {
  const normalizedProfile = normalizeLearnerProfile(profile, profile.learnerId);
  const profileCompleteness = getAdaptiveProfileCompleteness(normalizedProfile, hasLearnerProfile);
  const assetLookup = getTradeWorkbenchAssets();
  const normalizedGraphRecommendations = normalizeAdaptiveGraphRecommendations(graphRecommendations, assetLookup).recommendations;
  const recommendationLookup = normalizedGraphRecommendations.reduce<Record<string, AdaptiveGraphAssetRecommendation>>((accumulator, recommendation) => {
    accumulator[recommendation.assetId] = recommendation;
    return accumulator;
  }, {});

  const tradeFeature = assetLookup[TRADE_WORKBENCH_FEATURE_ID] ?? getAdaptiveFeatureById(TRADE_WORKBENCH_FEATURE_ID)?.metadata;
  const tradeTutorial = assetLookup[TRADE_TUTORIAL_ID] ?? getAdaptiveLearningContentById(TRADE_TUTORIAL_ID)?.metadata;
  const tradeHint = assetLookup[TRADE_HELP_HINT_ID] ?? getAdaptiveLearningContentById(TRADE_HELP_HINT_ID)?.metadata;
  const riskModule = assetLookup[RISK_MODULE_ID] ?? getAdaptiveLearningContentById(RISK_MODULE_ID)?.metadata;

  if (!tradeFeature || !tradeTutorial || !tradeHint || !riskModule) {
    throw new Error('Trade workbench adaptive assets were not registered correctly.');
  }

  if (profileCompleteness !== 'complete') {
    const chartReview = createFallbackState(tradeFeature, {
      message: 'Charts stay available by default so the trade page remains usable before personalization begins.',
      highlighted: true,
    });
    const placeTrade = createFallbackState(tradeTutorial, {
      assetId: 'tool-trade-order-entry',
      title: 'Place a trade',
      message: 'Order entry stays available, but the learner profile can later add learn-first guidance before trading.',
    });
    const secFilings = createFallbackState(tradeFeature, {
      assetId: 'tool-sec-filings',
      title: 'SEC filings',
      deemphasized: true,
      message: 'SEC filings are shown with lighter emphasis until the learner profile can confirm research readiness.',
    });
    const aiFundamentalAnalysis = createFallbackState(tradeFeature, {
      assetId: 'tool-ai-fundamental-analysis',
      title: 'AI fundamental analysis',
      deemphasized: true,
      message: 'AI analysis is visible but deemphasized until the learner profile can confirm this advanced tool is a good fit.',
    });
    const riskModuleState = createFallbackState(riskModule, {
      recommended: true,
      highlighted: true,
      message: 'Recommended next: learn core risk ideas before relying on more advanced trade tools.',
    });
    const tutorialState = createFallbackState(tradeTutorial, {
      recommended: true,
      message: 'Recommended next: walk through the guided first-order tutorial before using the full trade workflow heavily.',
    });
    const hintState = createFallbackState(tradeHint, {
      message: 'Keep the order-entry hint nearby for just-in-time reminders while learning the workflow.',
    });

    return {
      hasLearnerProfile,
      profileCompleteness,
      learnerProfile: normalizedProfile,
      graphRecommendations: normalizedGraphRecommendations,
      banner: buildBanner(profileCompleteness, placeTrade, riskModuleState),
      tools: {
        chartReview,
        placeTrade,
        secFilings,
        aiFundamentalAnalysis,
      },
      learningAssets: [riskModuleState, tutorialState, hintState],
    };
  }

  const assets = Object.values(assetLookup);
  const evaluation = evaluateAdaptivePolicyEngine(assets, normalizedProfile);
  const tradeDecision = evaluation.decisionsByAssetId[TRADE_WORKBENCH_FEATURE_ID];
  const tradeTutorialDecision = evaluation.decisionsByAssetId[TRADE_TUTORIAL_ID];
  const tradeHintDecision = evaluation.decisionsByAssetId[TRADE_HELP_HINT_ID];
  const riskModuleDecision = evaluation.decisionsByAssetId[RISK_MODULE_ID];

  const chartReview = mapAdaptiveDecisionToUiState(
    tradeFeature,
    tradeDecision,
    assetLookup,
    recommendationLookup[TRADE_WORKBENCH_FEATURE_ID],
    {
      assetId: 'tool-trade-chart-review',
      title: 'Chart review',
      message:
        tradeDecision.availabilityState === 'deemphasized'
          ? 'Chart review is still available, but the rest of the trading workflow is being deemphasized until the learner is a stronger fit.'
          : buildMessage(tradeFeature, tradeDecision, recommendationLookup[TRADE_WORKBENCH_FEATURE_ID]),
    },
  );

  const placeTrade = mapAdaptiveDecisionToUiState(
    tradeTutorial,
    tradeTutorialDecision,
    assetLookup,
    recommendationLookup[TRADE_TUTORIAL_ID],
    {
      assetId: 'tool-trade-order-entry',
      title: 'Place a trade',
      visible: tradeDecision.availabilityState !== 'hidden',
      locked: tradeDecision.availabilityState === 'locked' || tradeTutorialDecision.availabilityState === 'locked',
      deemphasized:
        tradeDecision.availabilityState === 'deemphasized' || tradeTutorialDecision.availabilityState === 'deemphasized',
      availabilityState:
        tradeDecision.availabilityState === 'locked' ? 'locked' : tradeTutorialDecision.availabilityState,
      message:
        tradeTutorialDecision.availabilityState === 'locked'
          ? `Unlock later: ${tradeTutorialDecision.supportingAssetIds
            .map((assetId) => assetLookup[assetId]?.title)
            .filter(Boolean)
            .join(' • ') || 'Complete the related learning assets first.'}`
          : tradeDecision.availabilityState === 'deemphasized'
            ? 'Live order entry stays available, but it is intentionally deemphasized while the learner is still building trade readiness.'
            : 'Order entry is unlocked and in scope for this learner right now.',
    },
  );

  const secFilings = mapAdaptiveDecisionToUiState(
    tradeFeature,
    tradeDecision,
    assetLookup,
    recommendationLookup[TRADE_WORKBENCH_FEATURE_ID],
    {
      assetId: 'tool-sec-filings',
      title: 'SEC filings',
      deemphasized: tradeDecision.availabilityState === 'deemphasized' || normalizedProfile.knowledgeLevel === 'beginner',
      message:
        tradeDecision.availabilityState === 'deemphasized' || normalizedProfile.knowledgeLevel === 'beginner'
          ? 'SEC filing review is still available, but it is deemphasized until the learner is more ready for deeper research work.'
          : 'SEC filing shortcuts are available because the learner is ready for deeper company research.',
    },
  );

  const aiFundamentalAnalysis = mapAdaptiveDecisionToUiState(
    tradeFeature,
    tradeDecision,
    assetLookup,
    recommendationLookup[TRADE_WORKBENCH_FEATURE_ID],
    {
      assetId: 'tool-ai-fundamental-analysis',
      title: 'AI fundamental analysis',
      visible: tradeDecision.availabilityState !== 'hidden',
      deemphasized: tradeDecision.availabilityState === 'deemphasized' || normalizedProfile.knowledgeLevel !== 'advanced',
      message:
        tradeDecision.availabilityState === 'deemphasized' || normalizedProfile.knowledgeLevel !== 'advanced'
          ? 'AI fundamental analysis is available but deemphasized as a more advanced tool for this learner state.'
          : 'AI fundamental analysis is fully in scope for this learner profile.',
    },
  );

  const riskModuleState = mapAdaptiveDecisionToUiState(
    riskModule,
    riskModuleDecision,
    assetLookup,
    recommendationLookup[RISK_MODULE_ID],
  );
  const tutorialState = mapAdaptiveDecisionToUiState(
    tradeTutorial,
    tradeTutorialDecision,
    assetLookup,
    recommendationLookup[TRADE_TUTORIAL_ID],
  );
  const hintState = mapAdaptiveDecisionToUiState(
    tradeHint,
    tradeHintDecision,
    assetLookup,
    recommendationLookup[TRADE_HELP_HINT_ID],
  );

  return {
    hasLearnerProfile,
    profileCompleteness,
    learnerProfile: normalizedProfile,
    graphRecommendations: normalizedGraphRecommendations,
    banner: buildBanner(profileCompleteness, placeTrade, riskModuleState),
    tools: {
      chartReview,
      placeTrade,
      secFilings,
      aiFundamentalAnalysis,
    },
    learningAssets: [riskModuleState, tutorialState, hintState]
      .filter((state) => state.visible)
      .sort((left, right) => {
        const leftScore = Number(Boolean(left.recommendationReasons.length)) * 4 + Number(left.highlighted || left.recommended);
        const rightScore = Number(Boolean(right.recommendationReasons.length)) * 4 + Number(right.highlighted || right.recommended);
        return rightScore - leftScore;
      }),
  };
}

export async function loadTradeWorkbenchAdaptiveRuntime(
  userId: number | null | undefined,
  {
    learnerProfileStore = new ElectronLearnerProfileStore(),
    adaptiveGraphRepository = new ElectronAdaptiveGraphRepository(),
  }: {
    learnerProfileStore?: ILearnerProfileStore;
    adaptiveGraphRepository?: IAdaptiveGraphRepository;
  } = {},
): Promise<AdaptiveTradeWorkbenchRuntime> {
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
    slice: buildTradeWorkbenchAdaptiveSlice({
      profile,
      hasLearnerProfile: Boolean(savedProfile),
      graphRecommendations,
    }),
    graphSynced,
  };
}
