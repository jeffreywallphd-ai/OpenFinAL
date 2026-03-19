const { ipcContracts, registerHandle } = require('../../IPC/contracts');

function registerPuppeteerHandlers({ ipcMain, puppeteerService }) {
  registerHandle(ipcMain, ipcContracts.puppeteer.getPageText, ({ url }) => puppeteerService.getPageText(url));
}

module.exports = {
  registerPuppeteerHandlers,
};
