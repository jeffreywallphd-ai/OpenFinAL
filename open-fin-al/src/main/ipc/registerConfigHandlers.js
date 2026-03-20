const { ipcContracts, registerHandle } = require('../../shared/ipc');

function registerConfigHandlers({ ipcMain, configService }) {
  registerHandle(ipcMain, ipcContracts.config.getUsername, () => configService.getUsername());
  registerHandle(ipcMain, ipcContracts.config.getUserPath, () => configService.getAppPath());
  registerHandle(ipcMain, ipcContracts.config.getAssetPath, () => configService.getAssetPath());
  registerHandle(ipcMain, ipcContracts.config.exists, () => configService.hasConfig());
  registerHandle(ipcMain, ipcContracts.config.save, (config) => configService.saveConfig(config));
  registerHandle(ipcMain, ipcContracts.config.load, () => configService.loadConfig());
}

module.exports = {
  registerConfigHandlers,
};
