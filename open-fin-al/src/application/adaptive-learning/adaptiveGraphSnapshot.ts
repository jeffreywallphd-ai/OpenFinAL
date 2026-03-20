import {
  AdaptiveGraphSyncPayload,
  LearnerProfile,
  createAdaptiveGraphLearnerProfileNode,
  exportAdaptiveFeatureGraphNodes,
  exportAdaptiveLearningContentGraphNodes,
} from '@domain/adaptive-learning';
import { bootstrapAdaptiveFeatures } from './bootstrapAdaptiveFeatures';
import { bootstrapAdaptiveLearningContent } from './bootstrapAdaptiveLearningContent';

export function buildAdaptiveGraphSyncPayload(
  learnerProfile: LearnerProfile,
  syncedAt: string = new Date().toISOString(),
): AdaptiveGraphSyncPayload {
  bootstrapAdaptiveFeatures();
  bootstrapAdaptiveLearningContent();

  return {
    learnerProfile: createAdaptiveGraphLearnerProfileNode(learnerProfile),
    assetNodes: [
      ...exportAdaptiveFeatureGraphNodes(),
      ...exportAdaptiveLearningContentGraphNodes(),
    ],
    syncedAt,
  };
}
