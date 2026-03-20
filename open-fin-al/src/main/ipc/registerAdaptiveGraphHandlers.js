const { ipcContracts, registerHandle } = require('../../shared/ipc');

function registerAdaptiveGraphHandlers({ ipcMain, adaptiveGraphService }) {
  registerHandle(
    ipcMain,
    ipcContracts.adaptiveGraph.syncAdaptiveLearningGraph,
    (payload) => adaptiveGraphService.syncAdaptiveLearningGraph(payload),
  );
  registerHandle(
    ipcMain,
    ipcContracts.adaptiveGraph.getLearnerSnapshot,
    ({ learnerId }) => adaptiveGraphService.getLearnerSnapshot(learnerId),
  );
  registerHandle(
    ipcMain,
    ipcContracts.adaptiveGraph.findRelevantAssets,
    (query) => adaptiveGraphService.findRelevantAssets(query),
  );
}

module.exports = {
  registerAdaptiveGraphHandlers,
};
