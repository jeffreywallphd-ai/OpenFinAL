import {
  AdaptiveFeatureMetadata,
  AdaptiveHelpHintContext,
  AdaptivePolicy,
  HelpHintMetadata,
  LearnerProfile,
  VisibilityDecision,
} from './contracts';
import { AdaptiveGraphAssetRecommendation } from './graph';
import { compareKnowledgeLevels, evaluateAdaptivePolicyEngine, evaluatePolicyCondition } from './policyEngine';

export interface AdaptiveHelpHintSelectionCandidate {
  asset: HelpHintMetadata;
  score: number;
  reasons: string[];
  graphReasons: string[];
  contextMatches: string[];
  governanceDecision: VisibilityDecision;
}

export interface SelectAdaptiveHelpHintsOptions {
  helpHints: HelpHintMetadata[];
  features?: AdaptiveFeatureMetadata[];
  profile: LearnerProfile;
  context: AdaptiveHelpHintContext;
  graphRecommendations?: AdaptiveGraphAssetRecommendation[];
  policies?: AdaptivePolicy[];
  dismissedHintIds?: string[];
  exposureCountsByHintId?: Record<string, number>;
  limit?: number;
}

function intersect(values: string[] = [], candidates: string[] = []): string[] {
  const candidateSet = new Set(candidates);
  return values.filter((value) => candidateSet.has(value));
}

function createContextIds(context: AdaptiveHelpHintContext): string[] {
  return [context.contextId, context.featureId, context.toolId].filter((value): value is string => Boolean(value));
}

function getHintRelationshipIds(hint: HelpHintMetadata): string[] {
  return [
    ...hint.relationships.relatedAssetIds,
    ...hint.relationships.relatedFeatureIds,
    ...hint.relationships.tutorialAssetIds,
    ...hint.relationships.helpAssetIds,
    ...hint.relationships.accessibilityAssetIds,
  ];
}

function getContextMatches(hint: HelpHintMetadata, context: AdaptiveHelpHintContext): string[] {
  const contextIds = createContextIds(context);
  const configuredContextIds = hint.contextualGuidance?.contextIds ?? [];
  const relatedIds = getHintRelationshipIds(hint);

  return [
    ...configuredContextIds.filter((contextId) => contextIds.includes(contextId)),
    ...(context.featureId && hint.hintForAssetId === context.featureId ? [context.featureId] : []),
    ...relatedIds.filter((relatedId) => contextIds.includes(relatedId)),
    ...intersect(relatedIds, context.relatedAssetIds ?? []),
  ].filter((value, index, values) => values.indexOf(value) === index);
}

function getKnowledgeScore(hint: HelpHintMetadata, profile: LearnerProfile): number {
  const delta = compareKnowledgeLevels(profile.knowledgeLevel, hint.knowledgeLevel);

  if (delta < 0) {
    return -12;
  }

  if (delta > 1) {
    return 4;
  }

  return 12;
}

function getGraphSupport(
  hint: HelpHintMetadata,
  graphRecommendations: AdaptiveGraphAssetRecommendation[],
  context: AdaptiveHelpHintContext,
): { score: number; reasons: string[] } {
  const hintRecommendation = graphRecommendations.find((recommendation) => recommendation.assetId === hint.id);

  if (hintRecommendation) {
    return {
      score: Math.min(hintRecommendation.relevanceScore, 10) * 3,
      reasons: hintRecommendation.reasons,
    };
  }

  const supportingRecommendation = graphRecommendations.find((recommendation) => {
    const sameFeature = context.featureId ? recommendation.assetId === context.featureId : false;
    const helpLinkMatch = recommendation.helpAssetIds.includes(hint.id);
    const tutorialLinkMatch = recommendation.tutorialAssetIds.some((assetId: string) =>
      hint.relationships.tutorialAssetIds.includes(assetId),
    );

    return sameFeature || helpLinkMatch || tutorialLinkMatch;
  });

  if (!supportingRecommendation) {
    return { score: 0, reasons: [] };
  }

  return {
    score: Math.max(6, Math.min(supportingRecommendation.relevanceScore, 10) * 2),
    reasons: supportingRecommendation.reasons,
  };
}

function passesExposureRules(hint: HelpHintMetadata, profile: LearnerProfile): boolean {
  return (hint.contextualGuidance?.exposureRules ?? []).every((rule) => evaluatePolicyCondition(profile, rule));
}

function hitsSuppressionRules(hint: HelpHintMetadata, profile: LearnerProfile): boolean {
  return (hint.contextualGuidance?.suppressionRules ?? []).some((rule) => evaluatePolicyCondition(profile, rule));
}

export function selectAdaptiveHelpHints({
  helpHints,
  features = [],
  profile,
  context,
  graphRecommendations = [],
  policies = [],
  dismissedHintIds = [],
  exposureCountsByHintId = {},
  limit = 1,
}: SelectAdaptiveHelpHintsOptions): AdaptiveHelpHintSelectionCandidate[] {
  const evaluation = evaluateAdaptivePolicyEngine([...features, ...helpHints], profile, policies);

  return helpHints
    .map((hint) => {
      const governanceDecision = evaluation.decisionsByAssetId[hint.id];
      const contextMatches = getContextMatches(hint, context);
      const matchingTags = intersect(hint.tags, context.tags ?? []);
      const graphSupport = getGraphSupport(hint, graphRecommendations, context);
      const displayCount = exposureCountsByHintId[hint.id] ?? 0;
      const maxDisplayCount = hint.contextualGuidance?.maxDisplayCount;
      const hiddenByLearner = profile.hiddenAssetIds.includes(hint.id) || dismissedHintIds.includes(hint.id);
      const suppressedByRules = hitsSuppressionRules(hint, profile);
      const failsExposureRules = !passesExposureRules(hint, profile);
      const exhaustedExposureBudget = typeof maxDisplayCount === 'number' && displayCount >= maxDisplayCount;

      if (
        governanceDecision.availabilityState === 'hidden' ||
        hiddenByLearner ||
        suppressedByRules ||
        failsExposureRules ||
        exhaustedExposureBudget
      ) {
        return null;
      }

      const score =
        contextMatches.length * 20 +
        matchingTags.length * 4 +
        getKnowledgeScore(hint, profile) +
        graphSupport.score +
        (hint.contextualGuidance?.displayPriority ?? 0);

      if (score <= 0) {
        return null;
      }

      const reasons = [
        contextMatches.length
          ? `Matched the current context through ${contextMatches.join(', ')}.`
          : 'Matched the current context through related adaptive graph relationships.',
        matchingTags.length ? `Relevant tags overlap with the current tool (${matchingTags.join(', ')}).` : '',
        graphSupport.reasons[0] ? `Graph support: ${graphSupport.reasons[0]}` : '',
        governanceDecision.availabilityState === 'deemphasized'
          ? 'Governance kept this hint low emphasis, so it is surfaced inline instead of as a blocking prompt.'
          : 'Governance allows this hint to stay visible in the current learner state.',
      ].filter(Boolean);

      return {
        asset: hint,
        score,
        reasons,
        graphReasons: graphSupport.reasons,
        contextMatches,
        governanceDecision,
      } satisfies AdaptiveHelpHintSelectionCandidate;
    })
    .filter((candidate): candidate is AdaptiveHelpHintSelectionCandidate => Boolean(candidate))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.asset.title.localeCompare(right.asset.title);
    })
    .slice(0, limit);
}
