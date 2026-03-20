import {
  AdaptiveGraphAssetQuery,
  AdaptiveGraphAssetRecommendation,
  AdaptiveGraphLearnerSnapshot,
  AdaptiveGraphSyncPayload,
  AdaptiveGraphSyncResult,
} from '@domain/adaptive-learning';

export interface IAdaptiveGraphRepository {
  syncAdaptiveLearningGraph(payload: AdaptiveGraphSyncPayload): Promise<AdaptiveGraphSyncResult>;
  getLearnerSnapshot(learnerId: string): Promise<AdaptiveGraphLearnerSnapshot | null>;
  findRelevantAssets(query: AdaptiveGraphAssetQuery): Promise<AdaptiveGraphAssetRecommendation[]>;
}
