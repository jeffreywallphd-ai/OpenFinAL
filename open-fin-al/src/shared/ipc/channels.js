const IPC_CHANNELS = Object.freeze({
  config: Object.freeze({
    getUsername: 'get-username',
    getUserPath: 'get-user-path',
    getAssetPath: 'get-asset-path',
    exists: 'has-config',
    save: 'save-config',
    load: 'load-config',
  }),
  files: Object.freeze({
    read: 'read-file',
    readBinary: 'read-binary',
  }),
  vault: Object.freeze({
    getSecret: 'get-secret',
    setSecret: 'set-secret',
    refreshCert: 'refresh-cert',
  }),
  database: Object.freeze({
    sqliteExists: 'sqlite-exists',
    sqliteInit: 'sqlite-init',
    selectData: 'select-data',
    sqliteQuery: 'sqlite-query',
    sqliteGet: 'sqlite-get',
    sqliteInsert: 'sqlite-insert',
    sqliteUpdate: 'sqlite-update',
    sqliteDelete: 'sqlite-delete',
  }),
  adaptiveGraph: Object.freeze({
    syncAdaptiveLearningGraph: 'adaptive-graph:sync',
    getLearnerSnapshot: 'adaptive-graph:get-learner-snapshot',
    findRelevantAssets: 'adaptive-graph:find-relevant-assets',
  }),
  yahooFinance: Object.freeze({
    chart: 'yahoo-chart',
    search: 'yahoo-search',
    historical: 'yahoo-historical',
  }),
  outbound: Object.freeze({
    alphaVantage: Object.freeze({
      marketStatus: 'outbound:alphavantage:market-status',
    }),
    sec: Object.freeze({
      fetchJson: 'outbound:sec:fetch-json',
      companyTickers: 'outbound:sec:company-tickers',
    }),
  }),
  transformers: Object.freeze({
    runTextGeneration: 'run-transformers',
  }),
  puppeteer: Object.freeze({
    getPageText: 'puppeteer:get-page-text',
  }),
  urlWindow: Object.freeze({
    open: 'open-url-window',
    getBodyTextHidden: 'get-url-body-text-hidden',
  }),
});

module.exports = {
  IPC_CHANNELS,
};
