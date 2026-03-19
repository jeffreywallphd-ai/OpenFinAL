const { ipcContracts, registerHandle } = require('../../IPC/contracts');

function registerTransformersHandlers({ ipcMain, transformersService }) {
  registerHandle(ipcMain, ipcContracts.transformers.runTextGeneration, ({ model, prompt, params }) => {
    return transformersService.runTextGeneration(model, prompt, params);
  });
}

module.exports = {
  registerTransformersHandlers,
};
