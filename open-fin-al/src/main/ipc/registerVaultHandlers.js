const { ipcContracts, registerHandle } = require('../../shared/ipc');

function registerVaultHandlers({ ipcMain, secretService, certificateService }) {
  registerHandle(ipcMain, ipcContracts.vault.getSecret, ({ key }) => secretService.getSecret(key));
  registerHandle(ipcMain, ipcContracts.vault.setSecret, ({ key, value }) => secretService.setSecret(key, value));
  registerHandle(ipcMain, ipcContracts.vault.refreshCert, ({ hostname }) => certificateService.refreshCertificateFingerprint(hostname));
}

module.exports = {
  registerVaultHandlers,
};
