function registerPuppeteerHandlers({ ipcMain, puppeteerService }) {
  ipcMain.handle('puppeteer:get-page-text', (_event, url) => puppeteerService.getPageText(url));
}

module.exports = {
  registerPuppeteerHandlers,
};
