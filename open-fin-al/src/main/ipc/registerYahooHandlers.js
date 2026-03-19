function registerYahooHandlers({ ipcMain, yahooFinanceService }) {
  ipcMain.handle('yahoo-chart', (_event, ticker, options) => yahooFinanceService.yahooChart(ticker, options));
  ipcMain.handle('yahoo-search', (_event, keyword, options) => yahooFinanceService.yahooSearch(keyword, options));
  ipcMain.handle('yahoo-historical', (_event, ticker, options) => yahooFinanceService.yahooHistorical(ticker, options));
}

module.exports = {
  registerYahooHandlers,
};
