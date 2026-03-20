import {
  AdaptiveGraphAssetQuery,
  AdaptiveGraphAssetRecommendation,
  AdaptiveGraphCatalogSyncPayload,
  AdaptiveGraphCatalogSyncResult,
  AdaptiveGraphLearnerSnapshot,
  AdaptiveGraphSyncPayload,
  AdaptiveGraphSyncResult,
} from '@domain/adaptive-learning';

export interface IAdaptiveGraphRepository {
  syncAdaptiveGraphCatalog(payload: AdaptiveGraphCatalogSyncPayload): Promise<AdaptiveGraphCatalogSyncResult>;
  syncAdaptiveLearningGraph(payload: AdaptiveGraphSyncPayload): Promise<AdaptiveGraphSyncResult>;
  getLearnerSnapshot(learnerId: string): Promise<AdaptiveGraphLearnerSnapshot | null>;
  findRelevantAssets(query: AdaptiveGraphAssetQuery): Promise<AdaptiveGraphAssetRecommendation[]>;
}
