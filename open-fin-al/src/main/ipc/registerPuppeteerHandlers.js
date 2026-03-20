const { ipcContracts, registerHandle } = require('../../shared/ipc');

function registerPuppeteerHandlers({ ipcMain, puppeteerService }) {
  registerHandle(ipcMain, ipcContracts.puppeteer.getPageText, ({ url }) => puppeteerService.getPageText(url));
}

module.exports = {
  registerPuppeteerHandlers,
};
