function registerConfigHandlers({ ipcMain, configService }) {
  ipcMain.handle('get-username', () => configService.getUsername());
  ipcMain.handle('get-user-path', () => configService.getAppPath());
  ipcMain.handle('get-asset-path', () => configService.getAssetPath());
  ipcMain.handle('has-config', () => configService.hasConfig());
  ipcMain.handle('save-config', (_event, config) => configService.saveConfig(config));
  ipcMain.handle('load-config', () => configService.loadConfig());
}

module.exports = {
  registerConfigHandlers,
};
