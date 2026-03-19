const { ipcContracts, registerHandle } = require('../../IPC/contracts');

function registerOutboundHandlers({ ipcMain, outboundServices }) {
  registerHandle(ipcMain, ipcContracts.outbound.alphaVantage.marketStatus, ({ apiKey }) => {
    return outboundServices.alphaVantage.fetchMarketStatus(apiKey);
  });

  registerHandle(ipcMain, ipcContracts.outbound.sec.fetchJson, ({ url, headers }) => {
    return outboundServices.sec.fetchJson({ url, headers });
  });

  registerHandle(ipcMain, ipcContracts.outbound.sec.companyTickers, ({ headers }) => {
    return outboundServices.sec.fetchCompanyTickers(headers);
  });
}

module.exports = {
  registerOutboundHandlers,
};
