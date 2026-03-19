function registerTransformersHandlers({ ipcMain, transformersService }) {
  ipcMain.handle('run-transformers', (_event, model, prompt, params) => {
    return transformersService.runTextGeneration(model, prompt, params);
  });
}

module.exports = {
  registerTransformersHandlers,
};
