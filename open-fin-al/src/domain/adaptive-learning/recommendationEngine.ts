import {
  AdaptiveAssetMetadata,
  AdaptiveFeatureGovernanceSummary,
  AdaptiveFeatureMetadata,
  AdaptiveLearningContentMetadata,
  AdaptiveLearningRecommendation,
  AdaptiveLearningRecommendationResult,
  AdaptivePolicy,
  AlignmentStrength,
  FeatureAvailabilityState,
  KnowledgeFit,
  LearnerProfile,
  RiskAlignmentStatus,
  VisibilityDecision
} from './contracts';
import { AdaptiveGraphAssetRecommendation } from './graph';
import { compareKnowledgeLevels, evaluateAdaptivePolicyEngine } from './policyEngine';

export interface BuildAdaptiveLearningRecommendationsOptions {
  learningAssets: AdaptiveLearningContentMetadata[];
  features?: AdaptiveFeatureMetadata[];
  profile: LearnerProfile;
  graphRecommendations?: AdaptiveGraphAssetRecommendation[];
  policies?: AdaptivePolicy[];
  limit?: number;
  generatedAt?: string;
}

type RecommendationReason = AdaptiveLearningRecommendation['explanation']['reasons'][number];

function determineGoalAlignment(asset: AdaptiveAssetMetadata, profile: LearnerProfile): AlignmentStrength {
  if (asset.investmentGoals.length === 0) {
    return 'strong';
  }

  const overlapCount = asset.investmentGoals.filter((goal) => profile.investmentGoals.includes(goal)).length;

  if (overlapCount === 0) {
    return 'none';
  }

  return overlapCount >= Math.min(2, asset.investmentGoals.length) ? 'strong' : 'partial';
}

function determineRiskAlignment(asset: AdaptiveAssetMetadata, profile: LearnerProfile): RiskAlignmentStatus {
  if (profile.riskPreference === 'unknown' || asset.riskAlignment.length === 0) {
    return 'unknown';
  }

  return asset.riskAlignment.includes(profile.riskPreference) ? 'aligned' : 'none';
}

function determineKnowledgeFit(asset: AdaptiveAssetMetadata, profile: LearnerProfile): KnowledgeFit {
  const delta = compareKnowledgeLevels(profile.knowledgeLevel, asset.knowledgeLevel);

  if (delta < 0) {
    return 'below-target';
  }

  if (delta > 1) {
    return 'above-target';
  }

  return 'aligned';
}

function getGovernanceScore(state: FeatureAvailabilityState): number {
  switch (state) {
    case 'visible':
      return 12;
    case 'deemphasized':
      return 6;
    case 'locked':
      return 2;
    case 'hidden':
    default:
      return -24;
  }
}

function pushReason(reasons: RecommendationReason[], reason: RecommendationReason): void {
  reasons.push(reason);
}

function createFeatureGovernanceSummary(featureDecisions: VisibilityDecision[]): AdaptiveFeatureGovernanceSummary {
  return {
    visibleFeatureIds: featureDecisions.filter((decision) => decision.availabilityState === 'visible').map((decision) => decision.assetId),
    hiddenFeatureIds: featureDecisions.filter((decision) => decision.availabilityState === 'hidden').map((decision) => decision.assetId),
    lockedFeatureIds: featureDecisions.filter((decision) => decision.availabilityState === 'locked').map((decision) => decision.assetId),
    deemphasizedFeatureIds: featureDecisions
      .filter((decision) => decision.availabilityState === 'deemphasized')
      .map((decision) => decision.assetId),
  };
}

function createExplanationSummary(
  asset: AdaptiveLearningContentMetadata,
  decision: VisibilityDecision,
  reasons: RecommendationReason[],
  relatedFeatureUnlocks: AdaptiveLearningRecommendation['relatedFeatureUnlocks'],
): string {
  const topSignals = reasons
    .slice()
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 2)
    .map((reason) => reason.message.replace(/\.$/, '').toLowerCase());
  const unlockSummary = relatedFeatureUnlocks.length
    ? ` It supports ${relatedFeatureUnlocks.length} related feature unlock${relatedFeatureUnlocks.length > 1 ? 's' : ''}.`
    : '';

  if (!topSignals.length) {
    return `${asset.title} remains ${decision.availabilityState} under adaptive governance.${unlockSummary}`.trim();
  }

  return `${asset.title} was recommended because ${topSignals.join(' and ')}.${unlockSummary}`.trim();
}

export function buildAdaptiveLearningRecommendations({
  learningAssets,
  features = [],
  profile,
  graphRecommendations = [],
  policies = [],
  limit = 3,
  generatedAt = new Date().toISOString(),
}: BuildAdaptiveLearningRecommendationsOptions): AdaptiveLearningRecommendationResult {
  const allAssets = [...features, ...learningAssets];
  const evaluation = evaluateAdaptivePolicyEngine(allAssets, profile, policies);
  const decisionsByAssetId = evaluation.decisionsByAssetId;
  const graphRecommendationLookup = graphRecommendations.reduce<Record<string, AdaptiveGraphAssetRecommendation>>((accumulator, recommendation) => {
    accumulator[recommendation.assetId] = recommendation;
    return accumulator;
  }, {});
  const featureLookup = features.reduce<Record<string, AdaptiveFeatureMetadata>>((accumulator, feature) => {
    accumulator[feature.id] = feature;
    return accumulator;
  }, {});

  const recommendations = learningAssets
    .map((asset) => {
      const decision = decisionsByAssetId[asset.id];
      const graphRecommendation = graphRecommendationLookup[asset.id];
      const reasons: RecommendationReason[] = [];

      const knowledgeFit = determineKnowledgeFit(asset, profile);
      const goalAlignment = determineGoalAlignment(asset, profile);
      const riskAlignment = determineRiskAlignment(asset, profile);
      const tagOverlap = asset.tags.filter((tag) => profile.interestedTags.includes(tag));

      const learnerProfileAlignment =
        (knowledgeFit === 'aligned' ? 18 : knowledgeFit === 'above-target' ? 10 : 4) +
        (goalAlignment === 'strong' ? 10 : goalAlignment === 'partial' ? 6 : 0) +
        (riskAlignment === 'aligned' ? 7 : riskAlignment === 'unknown' ? 3 : 0) +
        Math.min(tagOverlap.length, 3) * 3;

      if (knowledgeFit === 'aligned' || goalAlignment !== 'none' || tagOverlap.length > 0) {
        pushReason(reasons, {
          signal: 'learner-profile-alignment',
          weight: learnerProfileAlignment,
          message:
            tagOverlap.length > 0
              ? `It matches the learner's profile and current interests (${tagOverlap.join(', ')}).`
              : 'It fits the learner profile by matching knowledge level and stated goals.',
          details: {
            knowledgeFit,
            goalAlignment,
            riskAlignment,
            tagOverlap,
          },
        });
      }

      const graphRelationship = Math.min(graphRecommendation?.relevanceScore ?? 0, 10) * 3;
      if (graphRecommendation) {
        pushReason(reasons, {
          signal: 'graph-relationship',
          weight: graphRelationship,
          message: graphRecommendation.reasons[0] ?? 'The adaptive graph placed this asset near the learner’s current path.',
          details: {
            relevanceScore: graphRecommendation.relevanceScore,
            prerequisiteAssetIds: graphRecommendation.prerequisiteAssetIds,
          },
        });
      }

      const prerequisiteReadiness =
        decision.unmetPrerequisites.length === 0 ? 14 : Math.max(-12, 6 - decision.unmetPrerequisites.length * 6);
      pushReason(reasons, {
        signal: 'prerequisite-readiness',
        weight: prerequisiteReadiness,
        message:
          decision.unmetPrerequisites.length === 0
            ? 'The learner can start this recommendation immediately because the prerequisite path is ready.'
            : `This recommendation also explains the next prerequisite step (${decision.unmetPrerequisites.length} unmet).`,
        details: {
          unmetPrerequisiteCount: decision.unmetPrerequisites.length,
          supportingAssetIds: decision.supportingAssetIds,
        },
      });

      const knowledgeDistance = Math.abs(compareKnowledgeLevels(profile.knowledgeLevel, asset.knowledgeLevel));
      const knowledgeProgression = Math.max(0, 12 - knowledgeDistance * 4) + Math.round((asset.unlockValue ?? 0) * 10);
      pushReason(reasons, {
        signal: 'knowledge-progression',
        weight: knowledgeProgression,
        message:
          asset.recommendedNextSteps?.length
            ? 'It advances the learner along an explicit next-step progression path.'
            : 'It supports a manageable next step in the learner’s knowledge progression.',
        details: {
          knowledgeDistance,
          unlockValue: asset.unlockValue ?? 0,
          recommendedNextStepIds: (asset.recommendedNextSteps ?? []).map((step) => step.assetId ?? step.title),
        },
      });

      const relatedFeatureUnlocks = asset.relationships.relatedFeatureIds
        .map((featureId) => {
          const feature = featureLookup[featureId];
          const featureDecision = decisionsByAssetId[featureId];

          if (!feature || !featureDecision) {
            return null;
          }

          const unlockValue =
            featureDecision.availabilityState === 'locked'
              ? 10
              : featureDecision.availabilityState === 'deemphasized'
                ? 7
                : featureDecision.availabilityState === 'visible'
                  ? 4
                  : 1;

          return {
            assetId: featureId,
            title: feature.title,
            availabilityState: featureDecision.availabilityState,
            unlockValue,
            whyItMatters:
              featureDecision.availabilityState === 'locked'
                ? 'Completing this learning asset supports a currently locked feature.'
                : featureDecision.availabilityState === 'deemphasized'
                  ? 'Completing this learning asset can raise confidence for a currently deemphasized feature.'
                  : featureDecision.availabilityState === 'visible'
                    ? 'This learning asset reinforces a feature that is already visible in the product.'
                    : 'This feature is currently hidden, so the learning asset stays low priority until fit improves.',
          };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value))
        .sort((left, right) => right.unlockValue - left.unlockValue);

      const featureUnlockValue = relatedFeatureUnlocks.reduce((total, item) => total + item.unlockValue, 0);
      if (relatedFeatureUnlocks.length > 0) {
        pushReason(reasons, {
          signal: 'feature-unlock-value',
          weight: featureUnlockValue,
          message:
            relatedFeatureUnlocks[0].availabilityState === 'locked'
              ? `It unlocks progress toward ${relatedFeatureUnlocks[0].title}, which is currently locked.`
              : `It stays connected to ${relatedFeatureUnlocks[0].title} so learning and feature access move together.`,
          details: {
            relatedFeatureIds: relatedFeatureUnlocks.map((item) => item.assetId),
            availabilityStates: relatedFeatureUnlocks.map((item) => item.availabilityState),
          },
        });
      }

      const governanceCoherence = getGovernanceScore(decision.availabilityState);
      pushReason(reasons, {
        signal: 'feature-governance',
        weight: governanceCoherence,
        message:
          decision.availabilityState === 'hidden'
            ? 'Governance keeps this asset hidden right now, so it is not surfaced as an active recommendation.'
            : decision.availabilityState === 'locked'
              ? 'Governance keeps this asset visible as a learn-later step rather than hiding it.'
              : `Governance keeps this asset ${decision.availabilityState}, so the recommendation remains coherent with current UI access.`,
        details: {
          availabilityState: decision.availabilityState,
        },
      });

      const scoreBreakdown = {
        learnerProfileAlignment,
        graphRelationship,
        prerequisiteReadiness,
        knowledgeProgression,
        featureUnlockValue,
        governanceCoherence,
        total:
          learnerProfileAlignment +
          graphRelationship +
          prerequisiteReadiness +
          knowledgeProgression +
          featureUnlockValue +
          governanceCoherence,
      };

      return {
        asset,
        score: scoreBreakdown.total,
        governanceDecision: decision,
        graphReasons: graphRecommendation?.reasons ?? [],
        relatedFeatureUnlocks,
        explanation: {
          summary: createExplanationSummary(asset, decision, reasons, relatedFeatureUnlocks),
          reasons: reasons.sort((left, right) => right.weight - left.weight),
          scoreBreakdown,
        },
      } satisfies AdaptiveLearningRecommendation;
    })
    .filter((recommendation) => recommendation.governanceDecision.availabilityState !== 'hidden')
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.asset.title.localeCompare(right.asset.title);
    })
    .slice(0, Math.max(limit, 0));

  return {
    generatedAt,
    recommendations,
    decisionsByAssetId,
    featureGovernance: createFeatureGovernanceSummary(
      features
        .map((feature) => decisionsByAssetId[feature.id])
        .filter((decision): decision is VisibilityDecision => Boolean(decision)),
    ),
  };
}
