const { ipcContracts, registerHandle } = require('../../shared/ipc');

function registerYahooHandlers({ ipcMain, yahooFinanceService }) {
  registerHandle(ipcMain, ipcContracts.yahooFinance.chart, ({ ticker, options }) => yahooFinanceService.yahooChart(ticker, options));
  registerHandle(ipcMain, ipcContracts.yahooFinance.search, ({ keyword, options }) => yahooFinanceService.yahooSearch(keyword, options));
  registerHandle(ipcMain, ipcContracts.yahooFinance.historical, ({ ticker, options }) => yahooFinanceService.yahooHistorical(ticker, options));
}

module.exports = {
  registerYahooHandlers,
};
