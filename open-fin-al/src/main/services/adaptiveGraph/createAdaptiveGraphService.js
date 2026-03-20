function createAdaptiveGraphService({ graphRuntime }) {
  return {
    async syncAdaptiveGraphCatalog(payload) {
      return graphRuntime.syncAdaptiveGraphCatalog(payload);
    },
    async syncAdaptiveLearningGraph(payload) {
      return graphRuntime.syncAdaptiveLearningGraph(payload);
    },
    async getLearnerSnapshot(learnerId) {
      return graphRuntime.getLearnerSnapshot(learnerId);
    },
    async findRelevantAssets(query) {
      return graphRuntime.findRelevantAssets(query);
    },
  };
}

module.exports = {
  createAdaptiveGraphService,
};
