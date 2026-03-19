const { ipcContracts, registerHandle } = require('../../IPC/contracts');

function registerTransformersHandlers({ ipcMain, modelRuntimeService }) {
  registerHandle(ipcMain, ipcContracts.transformers.runTextGeneration, ({ model, prompt, params }) => {
    return modelRuntimeService.runTextGeneration(model, prompt, params);
  });
}

module.exports = {
  registerTransformersHandlers,
};
