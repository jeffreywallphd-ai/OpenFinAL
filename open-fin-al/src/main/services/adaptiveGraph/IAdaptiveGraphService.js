/**
 * @typedef {Object} AdaptiveGraphService
 * @property {(payload: import('../../../domain/adaptive-learning/graph').AdaptiveGraphSyncPayload) => Promise<import('../../../domain/adaptive-learning/graph').AdaptiveGraphSyncResult>} syncAdaptiveLearningGraph
 * @property {(learnerId: string) => Promise<import('../../../domain/adaptive-learning/graph').AdaptiveGraphLearnerSnapshot | null>} getLearnerSnapshot
 * @property {(query: import('../../../domain/adaptive-learning/graph').AdaptiveGraphAssetQuery) => Promise<import('../../../domain/adaptive-learning/graph').AdaptiveGraphAssetRecommendation[]>} findRelevantAssets
 */

module.exports = {};
