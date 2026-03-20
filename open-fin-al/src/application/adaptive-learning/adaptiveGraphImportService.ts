import { IAdaptiveGraphRepository } from '@application/services/IAdaptiveGraphRepository';
import {
  AdaptiveGraphCatalogAssetNode,
  AdaptiveGraphCatalogSyncPayload,
  AdaptiveGraphCatalogSyncResult,
  AdaptiveGraphSyncPayload,
  AdaptiveGraphSyncResult,
  LearnerProfile,
  listAdaptiveFeatures,
  listAdaptiveLearningContent,
} from '@domain/adaptive-learning';
import { bootstrapAdaptiveFeatures } from './bootstrapAdaptiveFeatures';
import { bootstrapAdaptiveLearningContent } from './bootstrapAdaptiveLearningContent';
import { buildAdaptiveGraphSyncPayload } from './adaptiveGraphSnapshot';

function mapRegistryEntriesToGraphNodes() : AdaptiveGraphCatalogAssetNode[] {
  const entries = [
    ...listAdaptiveFeatures(),
    ...listAdaptiveLearningContent(),
  ];

  return entries.map(({ metadata, registeredAt, source }) => ({
    id: metadata.id,
    key: metadata.key,
    kind: metadata.kind,
    title: metadata.title,
    description: metadata.description,
    category: metadata.category,
    knowledgeLevel: metadata.knowledgeLevel,
    defaultAvailability: metadata.defaultAvailability,
    isUserFacing: metadata.isUserFacing,
    tags: [...metadata.tags],
    investmentGoals: [...metadata.investmentGoals],
    riskAlignment: [...metadata.riskAlignment],
    prerequisites: metadata.prerequisites.map((prerequisite) => ({ ...prerequisite })),
    governance: { ...metadata.governance },
    source,
    registeredAt,
    relationships: {
      relatedAssetIds: [...metadata.relationships.relatedAssetIds],
      relatedFeatureIds: [...metadata.relationships.relatedFeatureIds],
      tutorialAssetIds: [...metadata.relationships.tutorialAssetIds],
      helpAssetIds: [...metadata.relationships.helpAssetIds],
      accessibilityAssetIds: [...metadata.relationships.accessibilityAssetIds],
    },
    relatedFeatureIds: [...metadata.relationships.relatedFeatureIds],
    supportedModalities: 'supportedModalities' in metadata ? [...metadata.supportedModalities] : undefined,
    unlockValue: 'unlockValue' in metadata ? metadata.unlockValue : undefined,
    tutorialForAssetId: 'tutorialForAssetId' in metadata ? metadata.tutorialForAssetId : undefined,
    hintForAssetId: 'hintForAssetId' in metadata ? metadata.hintForAssetId : undefined,
    estimatedDurationMinutes: 'estimatedDurationMinutes' in metadata ? metadata.estimatedDurationMinutes : undefined,
    recommendedNextSteps: 'recommendedNextSteps' in metadata
      ? metadata.recommendedNextSteps?.map((step) => ({ ...step }))
      : undefined,
  })).sort((left, right) => left.title.localeCompare(right.title));
}

export function buildAdaptiveGraphCatalogSyncPayload(
  syncedAt: string = new Date().toISOString(),
  mode: 'incremental' | 'full' = 'incremental',
): AdaptiveGraphCatalogSyncPayload {
  bootstrapAdaptiveFeatures();
  bootstrapAdaptiveLearningContent();

  return {
    assetNodes: mapRegistryEntriesToGraphNodes(),
    syncedAt,
    mode,
  };
}

export function createAdaptiveGraphImportService({
  adaptiveGraphRepository,
  clock = () => new Date().toISOString(),
}: {
  adaptiveGraphRepository: IAdaptiveGraphRepository;
  clock?: () => string;
}) {
  return {
    async syncRegisteredAssets(mode: 'incremental' | 'full' = 'incremental'): Promise<AdaptiveGraphCatalogSyncResult> {
      return adaptiveGraphRepository.syncAdaptiveGraphCatalog(buildAdaptiveGraphCatalogSyncPayload(clock(), mode));
    },
    async syncLearnerGraph(learnerProfile: LearnerProfile): Promise<AdaptiveGraphSyncResult> {
      const syncedAt = clock();
      return adaptiveGraphRepository.syncAdaptiveLearningGraph(buildAdaptiveGraphSyncPayload(learnerProfile, syncedAt));
    },
    async syncRegisteredAssetsForLearner(
      learnerProfile: LearnerProfile,
      mode: 'incremental' | 'full' = 'incremental',
    ): Promise<{ catalog: AdaptiveGraphCatalogSyncResult; learner: AdaptiveGraphSyncResult }> {
      const syncedAt = clock();
      const catalogPayload = buildAdaptiveGraphCatalogSyncPayload(syncedAt, mode);
      const learnerPayload: AdaptiveGraphSyncPayload = buildAdaptiveGraphSyncPayload(learnerProfile, syncedAt);

      const catalog = await adaptiveGraphRepository.syncAdaptiveGraphCatalog(catalogPayload);
      const learner = await adaptiveGraphRepository.syncAdaptiveLearningGraph(learnerPayload);

      return { catalog, learner };
    },
  };
}
