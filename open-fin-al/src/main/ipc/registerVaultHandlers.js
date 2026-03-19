function registerVaultHandlers({ ipcMain, secretService, certificateService }) {
  ipcMain.handle('get-secret', (_event, key) => secretService.getSecret(key));
  ipcMain.handle('set-secret', (_event, key, value) => secretService.setSecret(key, value));
  ipcMain.handle('refresh-cert', (_event, hostname) => certificateService.refreshCertificateFingerprint(hostname));
}

module.exports = {
  registerVaultHandlers,
};
