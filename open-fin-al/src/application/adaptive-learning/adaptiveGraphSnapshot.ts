import {
  AdaptiveGraphSyncPayload,
  LearnerProfile,
  createAdaptiveGraphLearnerProfileNode,
} from '@domain/adaptive-learning';
import { getAdaptiveCatalogAssets } from './adaptiveCatalog';

export function buildAdaptiveGraphSyncPayload(
  learnerProfile: LearnerProfile,
  syncedAt: string = new Date().toISOString(),
): AdaptiveGraphSyncPayload {
  const { features, learningAssets } = getAdaptiveCatalogAssets();

  return {
    learnerProfile: createAdaptiveGraphLearnerProfileNode(learnerProfile),
    assetNodes: [...features, ...learningAssets].map((asset) => ({
      id: asset.id,
      kind: asset.kind,
      title: asset.title,
      category: asset.category,
      knowledgeLevel: asset.knowledgeLevel,
      defaultAvailability: asset.defaultAvailability,
      isUserFacing: asset.isUserFacing,
      tags: [...asset.tags],
      investmentGoals: [...asset.investmentGoals],
      riskAlignment: [...asset.riskAlignment],
      prerequisites: [...asset.prerequisites],
      relationships: {
        relatedAssetIds: [...asset.relationships.relatedAssetIds],
        relatedFeatureIds: [...asset.relationships.relatedFeatureIds],
        tutorialAssetIds: [...asset.relationships.tutorialAssetIds],
        helpAssetIds: [...asset.relationships.helpAssetIds],
        accessibilityAssetIds: [...asset.relationships.accessibilityAssetIds],
      },
      supportedModalities: 'supportedModalities' in asset ? [...asset.supportedModalities] : undefined,
      unlockValue: 'unlockValue' in asset ? asset.unlockValue : undefined,
      recommendedNextSteps: 'recommendedNextSteps' in asset ? asset.recommendedNextSteps?.map((step) => ({ ...step })) : undefined,
    })),
    syncedAt,
  };
}
