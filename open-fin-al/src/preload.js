// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');
const { invokeContract, ipcContracts, sendContract } = require('./IPC/contracts');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer,
});

contextBridge.exposeInMainWorld('electronApp', {
  getUserPath: () => invokeContract(ipcRenderer, ipcContracts.config.getUserPath),
  getAssetPath: () => invokeContract(ipcRenderer, ipcContracts.config.getAssetPath),
});

contextBridge.exposeInMainWorld('file', {
  read: (filePath) => invokeContract(ipcRenderer, ipcContracts.files.read, filePath),
  readBinary: (filePath) => invokeContract(ipcRenderer, ipcContracts.files.readBinary, filePath),
});

contextBridge.exposeInMainWorld('exApi', {
  fetch: async (url, params = {}) => {
    try {
      const urlString = `http://localhost:3001/proxy?url=${encodeURIComponent(url)}`;

      let response;
      if (!params || Object.keys(params).length === 0) {
        response = await fetch(urlString);
      } else {
        response = await fetch(urlString, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
      }

      if (!response.ok) {
        throw new Error(`The request failed with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch error: ', error);
      return {};
    }
  },
});

contextBridge.exposeInMainWorld('outbound', {
  alphaVantage: {
    marketStatus: (apiKey) => invokeContract(ipcRenderer, ipcContracts.outbound.alphaVantage.marketStatus, apiKey),
  },
  sec: {
    fetchJson: (url, headers) => invokeContract(ipcRenderer, ipcContracts.outbound.sec.fetchJson, url, headers),
    companyTickers: (headers) => invokeContract(ipcRenderer, ipcContracts.outbound.sec.companyTickers, headers),
  },
});

contextBridge.exposeInMainWorld('vault', {
  getSecret: (key) => invokeContract(ipcRenderer, ipcContracts.vault.getSecret, key),
  setSecret: (key, value) => invokeContract(ipcRenderer, ipcContracts.vault.setSecret, key, value),
  refreshCert: (hostname) => invokeContract(ipcRenderer, ipcContracts.vault.refreshCert, hostname),
});

contextBridge.exposeInMainWorld('transformers', {
  runTextGeneration: (model, prompt, params) => invokeContract(
    ipcRenderer,
    ipcContracts.transformers.runTextGeneration,
    model,
    prompt,
    params,
  ),
});

contextBridge.exposeInMainWorld('config', {
  exists: () => invokeContract(ipcRenderer, ipcContracts.config.exists),
  save: (config) => invokeContract(ipcRenderer, ipcContracts.config.save, config),
  load: () => invokeContract(ipcRenderer, ipcContracts.config.load),
  getUsername: () => invokeContract(ipcRenderer, ipcContracts.config.getUsername),
});

contextBridge.exposeInMainWorld('database', {
  SQLiteExists: () => invokeContract(ipcRenderer, ipcContracts.database.sqliteExists),
  SQLiteInit: (schema) => invokeContract(ipcRenderer, ipcContracts.database.sqliteInit, schema),
  SQLiteGet: (request) => invokeContract(ipcRenderer, ipcContracts.database.sqliteGet, request),
  SQLiteQuery: (request) => invokeContract(ipcRenderer, ipcContracts.database.sqliteQuery, request),
  SQLiteSelectData: (request) => invokeContract(ipcRenderer, ipcContracts.database.selectData, request),
  SQLiteSelect: (request) => invokeContract(ipcRenderer, ipcContracts.database.sqliteQuery, request), // legacy alias for SQLiteQuery
  SQLiteDelete: (request) => invokeContract(ipcRenderer, ipcContracts.database.sqliteDelete, request),
  SQLiteUpdate: (request) => invokeContract(ipcRenderer, ipcContracts.database.sqliteUpdate, request),
  SQLiteInsert: (request) => invokeContract(ipcRenderer, ipcContracts.database.sqliteInsert, request),
});

contextBridge.exposeInMainWorld('yahooFinance', {
  chart: (ticker, options) => invokeContract(ipcRenderer, ipcContracts.yahooFinance.chart, ticker, options),
  search: (keyword, options) => invokeContract(ipcRenderer, ipcContracts.yahooFinance.search, keyword, options),
  historical: (ticker, options) => invokeContract(ipcRenderer, ipcContracts.yahooFinance.historical, ticker, options),
});

contextBridge.exposeInMainWorld('urlWindow', {
  openUrlWindow: (url) => sendContract(ipcRenderer, ipcContracts.urlWindow.open, url),
  getUrlBodyTextHidden: (url) => invokeContract(ipcRenderer, ipcContracts.urlWindow.getBodyTextHidden, url),
});

contextBridge.exposeInMainWorld('puppetApi', {
  getPageText: (url) => invokeContract(ipcRenderer, ipcContracts.puppeteer.getPageText, url),
});

contextBridge.exposeInMainWorld('convert', {
  xmlToJson: require('xml2js'),
});
