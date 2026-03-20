import {
  AdaptiveAssetMetadata,
  AdaptiveGraphAssetRecommendation,
  AdaptiveFeatureMetadata,
  AdaptiveLearningContentMetadata,
  LearnerProfile,
  listAdaptiveFeatures,
  listAdaptiveLearningContent,
} from '@domain/adaptive-learning';
import { bootstrapAdaptiveFeatures } from './bootstrapAdaptiveFeatures';
import { bootstrapAdaptiveLearningContent } from './bootstrapAdaptiveLearningContent';
import { createDefaultLearnerProfile } from './learnerProfile';

export type AdaptiveProfileCompleteness = 'missing' | 'partial' | 'complete';

export interface AdaptiveCatalogAssets {
  features: AdaptiveFeatureMetadata[];
  learningAssets: AdaptiveLearningContentMetadata[];
  assetLookup: Record<string, AdaptiveAssetMetadata>;
}

export interface AdaptiveGraphRecommendationNormalizationResult {
  recommendations: AdaptiveGraphAssetRecommendation[];
  discardedAssetIds: string[];
}

function uniqueValues<TValue extends string>(values: TValue[] = []): TValue[] {
  return [...new Set(values.filter(Boolean))] as TValue[];
}

export function normalizeLearnerProfile(
  profile: Partial<LearnerProfile> | null | undefined,
  learnerId: string,
): LearnerProfile {
  const fallback = createDefaultLearnerProfile(learnerId);

  if (!profile) {
    return fallback;
  }

  return {
    ...fallback,
    ...profile,
    learnerId: profile.learnerId ?? learnerId,
    investmentGoals: uniqueValues(profile.investmentGoals ?? []),
    interestedTags: uniqueValues(profile.interestedTags ?? []),
    experienceMarkers: uniqueValues(profile.experienceMarkers ?? []),
    completedAssets: [...(profile.completedAssets ?? [])],
    progressMarkers: [...(profile.progressMarkers ?? [])],
    unlockedAssetIds: uniqueValues(profile.unlockedAssetIds ?? []),
    hiddenAssetIds: uniqueValues(profile.hiddenAssetIds ?? []),
  };
}

export function getAdaptiveProfileCompleteness(
  profile: LearnerProfile,
  hasLearnerProfile: boolean,
): AdaptiveProfileCompleteness {
  if (!hasLearnerProfile) {
    return 'missing';
  }

  const hasKnowledgeLevel = profile.knowledgeLevel !== 'unknown';
  const hasGoals = profile.investmentGoals.length > 0;
  const hasRiskPreference = profile.riskPreference !== 'unknown';

  return hasKnowledgeLevel && hasGoals && hasRiskPreference ? 'complete' : 'partial';
}

export function getAdaptiveCatalogAssets(): AdaptiveCatalogAssets {
  bootstrapAdaptiveFeatures();
  bootstrapAdaptiveLearningContent();

  const features = listAdaptiveFeatures().map((entry) => entry.metadata);
  const learningAssets = listAdaptiveLearningContent().map((entry) => entry.metadata);
  const assetLookup = [...features, ...learningAssets].reduce<Record<string, AdaptiveAssetMetadata>>((accumulator, asset) => {
    accumulator[asset.id] = asset;
    return accumulator;
  }, {});

  return {
    features,
    learningAssets,
    assetLookup,
  };
}

export function normalizeAdaptiveGraphRecommendations(
  recommendations: AdaptiveGraphAssetRecommendation[] = [],
  assetLookup: Record<string, AdaptiveAssetMetadata>,
): AdaptiveGraphRecommendationNormalizationResult {
  const deduped = new Map<string, AdaptiveGraphAssetRecommendation>();
  const discardedAssetIds: string[] = [];

  for (const recommendation of recommendations) {
    const asset = assetLookup[recommendation.assetId];

    if (!asset) {
      discardedAssetIds.push(recommendation.assetId);
      continue;
    }

    deduped.set(recommendation.assetId, {
      ...recommendation,
      kind: asset.kind,
      title: asset.title,
      category: asset.category,
      knowledgeLevel: asset.knowledgeLevel,
      relevanceScore: Math.max(0, recommendation.relevanceScore ?? 0),
      reasons: recommendation.reasons?.length
        ? uniqueValues(recommendation.reasons)
        : [`Graph metadata supports ${asset.title} as part of the learner's next step.`],
      tutorialAssetIds: uniqueValues(recommendation.tutorialAssetIds ?? []),
      helpAssetIds: uniqueValues(recommendation.helpAssetIds ?? []),
      prerequisiteAssetIds: uniqueValues(recommendation.prerequisiteAssetIds ?? []),
      completed: Boolean(recommendation.completed),
    });
  }

  return {
    recommendations: [...deduped.values()],
    discardedAssetIds: uniqueValues(discardedAssetIds),
  };
}
