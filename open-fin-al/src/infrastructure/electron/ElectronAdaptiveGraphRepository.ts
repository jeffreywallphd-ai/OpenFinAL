import {
  IAdaptiveGraphRepository,
} from '@application/services/IAdaptiveGraphRepository';
import {
  AdaptiveGraphAssetQuery,
  AdaptiveGraphAssetRecommendation,
  AdaptiveGraphCatalogSyncPayload,
  AdaptiveGraphCatalogSyncResult,
  AdaptiveGraphLearnerSnapshot,
  AdaptiveGraphSyncPayload,
  AdaptiveGraphSyncResult,
} from '@domain/adaptive-learning';

interface OpenFinALAdaptiveGraphBridge {
  syncAdaptiveGraphCatalog: (payload: AdaptiveGraphCatalogSyncPayload) => Promise<AdaptiveGraphCatalogSyncResult>;
  syncAdaptiveLearningGraph: (payload: AdaptiveGraphSyncPayload) => Promise<AdaptiveGraphSyncResult>;
  getLearnerSnapshot: (learnerId: string) => Promise<AdaptiveGraphLearnerSnapshot | null>;
  findRelevantAssets: (query: AdaptiveGraphAssetQuery) => Promise<AdaptiveGraphAssetRecommendation[]>;
}

declare const window: Window & { adaptiveGraph: OpenFinALAdaptiveGraphBridge };

export class ElectronAdaptiveGraphRepository implements IAdaptiveGraphRepository {
  async syncAdaptiveGraphCatalog(payload: AdaptiveGraphCatalogSyncPayload): Promise<AdaptiveGraphCatalogSyncResult> {
    return window.adaptiveGraph.syncAdaptiveGraphCatalog(payload);
  }

  async syncAdaptiveLearningGraph(payload: AdaptiveGraphSyncPayload): Promise<AdaptiveGraphSyncResult> {
    return window.adaptiveGraph.syncAdaptiveLearningGraph(payload);
  }

  async getLearnerSnapshot(learnerId: string): Promise<AdaptiveGraphLearnerSnapshot | null> {
    return window.adaptiveGraph.getLearnerSnapshot(learnerId);
  }

  async findRelevantAssets(query: AdaptiveGraphAssetQuery): Promise<AdaptiveGraphAssetRecommendation[]> {
    return window.adaptiveGraph.findRelevantAssets(query);
  }
}
