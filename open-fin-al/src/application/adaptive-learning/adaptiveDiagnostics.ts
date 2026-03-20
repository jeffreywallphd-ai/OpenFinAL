import {
  AdaptiveAssetKind,
  AdaptiveAssetMetadata,
  AdaptiveGraphAssetRecommendation,
  AdaptiveLearningRecommendation,
  AdaptiveLearningRecommendationResult,
  AdaptivePolicy,
  FeatureAvailabilityState,
  LearnerProfile,
  listAdaptiveFeatures,
  listAdaptiveLearningContent,
  buildAdaptiveLearningRecommendations,
} from '@domain/adaptive-learning';
import {
  AdaptiveProfileCompleteness,
  getAdaptiveCatalogAssets,
  getAdaptiveProfileCompleteness,
  normalizeAdaptiveGraphRecommendations,
  normalizeLearnerProfile,
} from './adaptiveCatalog';

export type AdaptiveGraphSyncReason =
  | 'graph-not-requested'
  | 'missing-profile'
  | 'profile-incomplete'
  | 'graph-recommendations-provided'
  | 'graph-sync-succeeded'
  | 'graph-sync-failed';

export interface AdaptiveGraphSyncDiagnostics {
  attempted: boolean;
  synced: boolean;
  reason: AdaptiveGraphSyncReason;
  learnerId: string;
  profileCompleteness: AdaptiveProfileCompleteness;
  recommendationCount: number;
  discardedRecommendationAssetIds: string[];
  syncedAt?: string;
  backend?: string;
  errorMessage?: string;
}

export interface AdaptiveRegistryAssetDiagnostic {
  assetId: string;
  key: string;
  title: string;
  kind: AdaptiveAssetKind;
  category: string;
  source: string;
  registeredAt: string;
  defaultAvailabilityState: FeatureAvailabilityState;
  eligibleForRecommendation: boolean;
  eligibleForHighlighting: boolean;
  prerequisiteCount: number;
  relatedAssetCount: number;
  relatedFeatureCount: number;
  tutorialCount: number;
  helpHintCount: number;
}

export interface AdaptiveRegistryDiagnostics {
  generatedAt: string;
  totalAssetCount: number;
  featureCount: number;
  learningAssetCount: number;
  assetsByKind: Record<AdaptiveAssetKind, number>;
  assets: AdaptiveRegistryAssetDiagnostic[];
}

export interface AdaptiveLearnerProfileSnapshot {
  learnerId: string;
  hasLearnerProfile: boolean;
  profileCompleteness: AdaptiveProfileCompleteness;
  knowledgeLevel: LearnerProfile['knowledgeLevel'];
  riskPreference: LearnerProfile['riskPreference'];
  investmentGoals: string[];
  interestedTags: string[];
  experienceMarkers: string[];
  completedAssetIds: string[];
  unlockedAssetIds: string[];
  hiddenAssetIds: string[];
  progressMarkers: LearnerProfile['progressMarkers'];
  updatedAt?: string;
}

export interface AdaptiveDecisionDiagnostic {
  assetId: string;
  title: string;
  kind: AdaptiveAssetKind;
  category: string;
  availabilityState: FeatureAvailabilityState;
  visible: boolean;
  hidden: boolean;
  locked: boolean;
  deemphasized: boolean;
  recommended: boolean;
  highlighted: boolean;
  explanationSummary: string;
  reasonMessages: string[];
  whyVisible: string[];
  whyHidden: string[];
  whyLocked: string[];
  whyRecommended: string[];
  whyDeemphasized: string[];
  unmetPrerequisites: string[];
  applicablePolicyIds: string[];
  supportingAssetIds: string[];
  graphReasons: string[];
  relatedAssetIdsConsidered: string[];
}

export interface AdaptiveRecommendationRationaleDiagnostic {
  assetId: string;
  title: string;
  score: number;
  availabilityState: FeatureAvailabilityState;
  summary: string;
  topReasons: string[];
  graphReasons: string[];
  relatedFeatureUnlocks: Array<{
    assetId: string;
    title: string;
    availabilityState: FeatureAvailabilityState;
    whyItMatters: string;
  }>;
  scoreBreakdown: AdaptiveLearningRecommendation['explanation']['scoreBreakdown'];
}

export interface AdaptivePolicyDecisionSummaryDiagnostic {
  visibleAssetIds: string[];
  hiddenAssetIds: string[];
  lockedAssetIds: string[];
  deemphasizedAssetIds: string[];
  recommendedAssetIds: string[];
  highlightedAssetIds: string[];
  suggestedForLaterUnlockingAssetIds: string[];
}

export interface AdaptiveObservabilitySnapshot {
  generatedAt: string;
  registry: AdaptiveRegistryDiagnostics;
  learnerProfile: AdaptiveLearnerProfileSnapshot;
  graphSync: AdaptiveGraphSyncDiagnostics;
  policyDecisions: {
    summary: AdaptivePolicyDecisionSummaryDiagnostic;
    byAssetId: Record<string, AdaptiveDecisionDiagnostic>;
  };
  recommendations: AdaptiveRecommendationRationaleDiagnostic[];
}

function createEmptyKindCounts(): Record<AdaptiveAssetKind, number> {
  return {
    feature: 0,
    'learning-module': 0,
    tutorial: 0,
    'help-hint': 0,
  };
}

function createRegistryDiagnostics(generatedAt: string): AdaptiveRegistryDiagnostics {
  const featureEntries = listAdaptiveFeatures();
  const learningEntries = listAdaptiveLearningContent();
  const allEntries = [...featureEntries, ...learningEntries].sort((left, right) => left.metadata.title.localeCompare(right.metadata.title));
  const assetsByKind = allEntries.reduce<Record<AdaptiveAssetKind, number>>((accumulator, entry) => {
    accumulator[entry.metadata.kind] += 1;
    return accumulator;
  }, createEmptyKindCounts());

  return {
    generatedAt,
    totalAssetCount: allEntries.length,
    featureCount: featureEntries.length,
    learningAssetCount: learningEntries.length,
    assetsByKind,
    assets: allEntries.map((entry) => ({
      assetId: entry.metadata.id,
      key: entry.metadata.key,
      title: entry.metadata.title,
      kind: entry.metadata.kind,
      category: entry.metadata.category,
      source: entry.source,
      registeredAt: entry.registeredAt,
      defaultAvailabilityState: entry.metadata.governance.defaultAvailabilityState,
      eligibleForRecommendation: entry.metadata.governance.eligibleForRecommendation,
      eligibleForHighlighting: entry.metadata.governance.eligibleForHighlighting,
      prerequisiteCount: entry.metadata.prerequisites.length,
      relatedAssetCount: entry.metadata.relationships.relatedAssetIds.length,
      relatedFeatureCount: entry.metadata.relationships.relatedFeatureIds.length,
      tutorialCount: entry.metadata.relationships.tutorialAssetIds.length,
      helpHintCount: entry.metadata.relationships.helpAssetIds.length,
    })),
  };
}

function createLearnerProfileSnapshot(
  profile: LearnerProfile,
  hasLearnerProfile: boolean,
  profileCompleteness: AdaptiveProfileCompleteness,
): AdaptiveLearnerProfileSnapshot {
  return {
    learnerId: profile.learnerId,
    hasLearnerProfile,
    profileCompleteness,
    knowledgeLevel: profile.knowledgeLevel,
    riskPreference: profile.riskPreference,
    investmentGoals: [...profile.investmentGoals],
    interestedTags: [...profile.interestedTags],
    experienceMarkers: [...(profile.experienceMarkers ?? [])],
    completedAssetIds: profile.completedAssets.map((asset) => asset.assetId),
    unlockedAssetIds: [...profile.unlockedAssetIds],
    hiddenAssetIds: [...profile.hiddenAssetIds],
    progressMarkers: profile.progressMarkers.map((marker) => ({ ...marker })),
    updatedAt: profile.updatedAt,
  };
}

function describeAvailabilityReason(
  decision: AdaptiveLearningRecommendationResult['decisionsByAssetId'][string],
  recommendation: AdaptiveLearningRecommendation | undefined,
): Pick<AdaptiveDecisionDiagnostic, 'whyVisible' | 'whyHidden' | 'whyLocked' | 'whyRecommended' | 'whyDeemphasized'> {
  const reasonMessages = decision.explanation.reasons ?? [];

  const whyVisible =
    decision.availabilityState !== 'hidden'
      ? reasonMessages
          .filter((reason) => ['default-availability', 'knowledge-fit', 'goal-alignment', 'risk-alignment', 'criticality-governance', 'policy-match'].includes(reason.code))
          .map((reason) => reason.message)
      : [];
  const whyHidden =
    decision.availabilityState === 'hidden'
      ? reasonMessages
          .filter((reason) => ['learner-hidden', 'knowledge-gap', 'risk-alignment', 'policy-match', 'policy-suppressed'].includes(reason.code))
          .map((reason) => reason.message)
      : [];
  const whyLocked =
    decision.availabilityState === 'locked'
      ? reasonMessages
          .filter((reason) => ['prerequisite-unmet', 'relationship-support', 'policy-match'].includes(reason.code))
          .map((reason) => reason.message)
      : [];
  const whyDeemphasized =
    decision.availabilityState === 'deemphasized'
      ? reasonMessages
          .filter((reason) => ['knowledge-gap', 'goal-alignment', 'risk-alignment', 'policy-match'].includes(reason.code))
          .map((reason) => reason.message)
      : [];
  const whyRecommended = recommendation
    ? [
        ...recommendation.explanation.reasons.slice(0, 3).map((reason) => reason.message),
        ...reasonMessages
          .filter((reason) => ['criticality-governance', 'policy-match'].includes(reason.code))
          .map((reason) => reason.message),
      ]
    : decision.recommended
      ? reasonMessages
          .filter((reason) => ['criticality-governance', 'policy-match'].includes(reason.code))
          .map((reason) => reason.message)
      : [];

  return {
    whyVisible: [...new Set(whyVisible)],
    whyHidden: [...new Set(whyHidden)],
    whyLocked: [...new Set(whyLocked)],
    whyRecommended: [...new Set(whyRecommended)],
    whyDeemphasized: [...new Set(whyDeemphasized)],
  };
}

function createDecisionDiagnostic(
  asset: AdaptiveAssetMetadata,
  recommendationResult: AdaptiveLearningRecommendationResult,
  recommendationLookup: Record<string, AdaptiveLearningRecommendation>,
  graphRecommendationLookup: Record<string, AdaptiveGraphAssetRecommendation>,
): AdaptiveDecisionDiagnostic {
  const decision = recommendationResult.decisionsByAssetId[asset.id];
  const recommendation = recommendationLookup[asset.id];
  const availabilityReasons = describeAvailabilityReason(decision, recommendation);

  return {
    assetId: asset.id,
    title: asset.title,
    kind: asset.kind,
    category: asset.category,
    availabilityState: decision.availabilityState,
    visible: decision.availabilityState !== 'hidden',
    hidden: decision.availabilityState === 'hidden',
    locked: decision.availabilityState === 'locked',
    deemphasized: decision.availabilityState === 'deemphasized',
    recommended: decision.recommended || Boolean(recommendation),
    highlighted: decision.highlighted || Boolean(graphRecommendationLookup[asset.id]),
    explanationSummary: decision.explanation.summary,
    reasonMessages: [...decision.reasons],
    unmetPrerequisites: decision.unmetPrerequisites.map((prerequisite) => prerequisite.description),
    applicablePolicyIds: [...decision.applicablePolicyIds],
    supportingAssetIds: [...decision.supportingAssetIds],
    graphReasons: graphRecommendationLookup[asset.id]?.reasons ?? [],
    relatedAssetIdsConsidered: [...decision.explanation.debug.relatedAssetIdsConsidered],
    ...availabilityReasons,
  };
}

function createRecommendationDiagnostic(
  recommendation: AdaptiveLearningRecommendation,
): AdaptiveRecommendationRationaleDiagnostic {
  return {
    assetId: recommendation.asset.id,
    title: recommendation.asset.title,
    score: recommendation.score,
    availabilityState: recommendation.governanceDecision.availabilityState,
    summary: recommendation.explanation.summary,
    topReasons: recommendation.explanation.reasons.slice(0, 3).map((reason) => reason.message),
    graphReasons: [...recommendation.graphReasons],
    relatedFeatureUnlocks: recommendation.relatedFeatureUnlocks.map((unlock) => ({
      assetId: unlock.assetId,
      title: unlock.title,
      availabilityState: unlock.availabilityState,
      whyItMatters: unlock.whyItMatters,
    })),
    scoreBreakdown: { ...recommendation.explanation.scoreBreakdown },
  };
}

export function createAdaptiveGraphSyncDiagnostics({
  learnerId,
  hasLearnerProfile,
  profileCompleteness,
  synced,
  recommendationCount = 0,
  discardedRecommendationAssetIds = [],
  attempted,
  errorMessage,
  syncedAt,
  backend,
}: {
  learnerId: string;
  hasLearnerProfile: boolean;
  profileCompleteness: AdaptiveProfileCompleteness;
  synced: boolean;
  recommendationCount?: number;
  discardedRecommendationAssetIds?: string[];
  attempted?: boolean;
  errorMessage?: string;
  syncedAt?: string;
  backend?: string;
}): AdaptiveGraphSyncDiagnostics {
  const effectiveAttempted =
    attempted ?? (synced || (hasLearnerProfile && profileCompleteness === 'complete'));

  let reason: AdaptiveGraphSyncReason;
  if (synced) {
    reason = effectiveAttempted ? 'graph-sync-succeeded' : 'graph-recommendations-provided';
  } else if (!hasLearnerProfile) {
    reason = 'missing-profile';
  } else if (profileCompleteness !== 'complete') {
    reason = 'profile-incomplete';
  } else if (effectiveAttempted) {
    reason = errorMessage ? 'graph-sync-failed' : 'graph-not-requested';
  } else if (recommendationCount > 0) {
    reason = 'graph-recommendations-provided';
  } else {
    reason = 'graph-not-requested';
  }

  return {
    attempted: effectiveAttempted,
    synced,
    reason,
    learnerId,
    profileCompleteness,
    recommendationCount,
    discardedRecommendationAssetIds: [...discardedRecommendationAssetIds],
    syncedAt,
    backend,
    errorMessage,
  };
}

export function buildAdaptiveObservabilitySnapshot({
  profile,
  hasLearnerProfile,
  graphRecommendations = [],
  policies = [],
  graphSync,
  generatedAt = new Date().toISOString(),
  recommendationLimit = 5,
}: {
  profile: Partial<LearnerProfile> | LearnerProfile;
  hasLearnerProfile: boolean;
  graphRecommendations?: AdaptiveGraphAssetRecommendation[];
  policies?: AdaptivePolicy[];
  graphSync?: Partial<AdaptiveGraphSyncDiagnostics>;
  generatedAt?: string;
  recommendationLimit?: number;
}): AdaptiveObservabilitySnapshot {
  const normalizedProfile = normalizeLearnerProfile(profile, profile.learnerId ?? 'developer-preview');
  const profileCompleteness = getAdaptiveProfileCompleteness(normalizedProfile, hasLearnerProfile);
  const { features, learningAssets, assetLookup } = getAdaptiveCatalogAssets();
  const graphNormalization = normalizeAdaptiveGraphRecommendations(graphRecommendations, assetLookup);
  const recommendationResult = buildAdaptiveLearningRecommendations({
    features,
    learningAssets,
    profile: normalizedProfile,
    graphRecommendations: graphNormalization.recommendations,
    policies,
    limit: recommendationLimit,
    generatedAt,
  });
  const graphRecommendationLookup = graphNormalization.recommendations.reduce<Record<string, AdaptiveGraphAssetRecommendation>>((accumulator, recommendation) => {
    accumulator[recommendation.assetId] = recommendation;
    return accumulator;
  }, {});
  const recommendationLookup = recommendationResult.recommendations.reduce<Record<string, AdaptiveLearningRecommendation>>((accumulator, recommendation) => {
    accumulator[recommendation.asset.id] = recommendation;
    return accumulator;
  }, {});
  const allAssets = [...features, ...learningAssets].sort((left, right) => left.title.localeCompare(right.title));
  const decisionsByAssetId = allAssets.reduce<Record<string, AdaptiveDecisionDiagnostic>>((accumulator, asset) => {
    accumulator[asset.id] = createDecisionDiagnostic(asset, recommendationResult, recommendationLookup, graphRecommendationLookup);
    return accumulator;
  }, {});

  return {
    generatedAt,
    registry: createRegistryDiagnostics(generatedAt),
    learnerProfile: createLearnerProfileSnapshot(normalizedProfile, hasLearnerProfile, profileCompleteness),
    graphSync: {
      ...createAdaptiveGraphSyncDiagnostics({
        learnerId: normalizedProfile.learnerId,
        hasLearnerProfile,
        profileCompleteness,
        synced: graphNormalization.recommendations.length > 0,
        recommendationCount: graphNormalization.recommendations.length,
        discardedRecommendationAssetIds: graphNormalization.discardedAssetIds,
      }),
      ...graphSync,
    },
    policyDecisions: {
      summary: {
        visibleAssetIds: Object.values(decisionsByAssetId).filter((decision) => decision.availabilityState === 'visible').map((decision) => decision.assetId),
        hiddenAssetIds: Object.values(decisionsByAssetId).filter((decision) => decision.availabilityState === 'hidden').map((decision) => decision.assetId),
        lockedAssetIds: Object.values(decisionsByAssetId).filter((decision) => decision.availabilityState === 'locked').map((decision) => decision.assetId),
        deemphasizedAssetIds: Object.values(decisionsByAssetId).filter((decision) => decision.availabilityState === 'deemphasized').map((decision) => decision.assetId),
        recommendedAssetIds: Object.values(decisionsByAssetId).filter((decision) => decision.recommended).map((decision) => decision.assetId),
        highlightedAssetIds: Object.values(decisionsByAssetId).filter((decision) => decision.highlighted).map((decision) => decision.assetId),
        suggestedForLaterUnlockingAssetIds: Object.values(decisionsByAssetId)
          .filter((decision) => decision.whyLocked.length > 0)
          .map((decision) => decision.assetId),
      },
      byAssetId: decisionsByAssetId,
    },
    recommendations: recommendationResult.recommendations.map((recommendation) => createRecommendationDiagnostic(recommendation)),
  };
}

export function inspectAdaptiveDecision(snapshot: AdaptiveObservabilitySnapshot, assetId: string): AdaptiveDecisionDiagnostic | undefined {
  return snapshot.policyDecisions.byAssetId[assetId];
}

export function emitAdaptiveObservabilitySnapshot(
  label: string,
  snapshot: AdaptiveObservabilitySnapshot,
  {
    enabled = false,
    logger = console.debug,
  }: {
    enabled?: boolean;
    logger?: (message?: unknown, ...optionalParams: unknown[]) => void;
  } = {},
): AdaptiveObservabilitySnapshot {
  if (!enabled) {
    return snapshot;
  }

  logger(`[adaptive-observability] ${label}`, snapshot);
  return snapshot;
}
