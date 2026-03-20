const { IPC_CHANNELS } = require('../channels');

function createContract({ channel, type = 'invoke', serialize = (...args) => args[0], validate = (value) => value }) {
  return Object.freeze({
    channel,
    type,
    serialize,
    validate,
  });
}

function invokeContract(ipcRenderer, contract, ...args) {
  return ipcRenderer.invoke(contract.channel, contract.serialize(...args));
}

function sendContract(ipcRenderer, contract, ...args) {
  return ipcRenderer.send(contract.channel, contract.serialize(...args));
}

function registerHandle(ipcMain, contract, handler) {
  ipcMain.handle(contract.channel, (_event, payload) => handler(contract.validate(payload)));
}

function registerListener(ipcMain, contract, handler) {
  ipcMain.on(contract.channel, (_event, payload) => handler(contract.validate(payload)));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertString(value, fieldName) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${fieldName} must be a non-empty string`);
  }

  return value;
}

function assertOptionalRecord(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (!isPlainObject(value)) {
    throw new TypeError(`${fieldName} must be an object when provided`);
  }

  return value;
}

function assertRecord(value, fieldName) {
  if (!isPlainObject(value)) {
    throw new TypeError(`${fieldName} must be an object`);
  }

  return value;
}

function assertSqlPayload(value, fieldName) {
  const payload = assertRecord(value, fieldName);
  assertString(payload.query, `${fieldName}.query`);

  if (payload.parameters !== undefined && !Array.isArray(payload.parameters)) {
    throw new TypeError(`${fieldName}.parameters must be an array when provided`);
  }

  return payload;
}

function assertSelectDataPayload(value) {
  const payload = assertRecord(value, 'selectDataRequest');
  assertString(payload.query, 'selectDataRequest.query');

  if (payload.inputData !== undefined && !Array.isArray(payload.inputData)) {
    throw new TypeError('selectDataRequest.inputData must be an array when provided');
  }

  return payload;
}

const ipcContracts = Object.freeze({
  config: Object.freeze({
    getUsername: createContract({ channel: IPC_CHANNELS.config.getUsername, serialize: () => undefined }),
    getUserPath: createContract({ channel: IPC_CHANNELS.config.getUserPath, serialize: () => undefined }),
    getAssetPath: createContract({ channel: IPC_CHANNELS.config.getAssetPath, serialize: () => undefined }),
    exists: createContract({ channel: IPC_CHANNELS.config.exists, serialize: () => undefined }),
    save: createContract({
      channel: IPC_CHANNELS.config.save,
      serialize: (config) => config,
      validate: (config) => config,
    }),
    load: createContract({ channel: IPC_CHANNELS.config.load, serialize: () => undefined }),
  }),
  files: Object.freeze({
    read: createContract({
      channel: IPC_CHANNELS.files.read,
      serialize: (filePath) => filePath,
      validate: (filePath) => assertString(filePath, 'filePath'),
    }),
    readBinary: createContract({
      channel: IPC_CHANNELS.files.readBinary,
      serialize: (filePath) => filePath,
      validate: (filePath) => assertString(filePath, 'filePath'),
    }),
  }),
  vault: Object.freeze({
    getSecret: createContract({
      channel: IPC_CHANNELS.vault.getSecret,
      serialize: (keyOrService, maybeKey) => ({ key: maybeKey || keyOrService }),
      validate: (payload) => ({ key: assertString(assertRecord(payload, 'getSecretRequest').key, 'getSecretRequest.key') }),
    }),
    setSecret: createContract({
      channel: IPC_CHANNELS.vault.setSecret,
      serialize: (key, value) => ({ key, value }),
      validate: (payload) => {
        const data = assertRecord(payload, 'setSecretRequest');
        return {
          key: assertString(data.key, 'setSecretRequest.key'),
          value: assertString(data.value, 'setSecretRequest.value'),
        };
      },
    }),
    refreshCert: createContract({
      channel: IPC_CHANNELS.vault.refreshCert,
      serialize: (hostname) => ({ hostname }),
      validate: (payload) => ({
        hostname: assertString(assertRecord(payload, 'refreshCertRequest').hostname, 'refreshCertRequest.hostname'),
      }),
    }),
  }),
  database: Object.freeze({
    sqliteExists: createContract({ channel: IPC_CHANNELS.database.sqliteExists, serialize: () => undefined }),
    sqliteInit: createContract({
      channel: IPC_CHANNELS.database.sqliteInit,
      serialize: (schema) => ({ schema }),
      validate: (payload) => ({ schema: assertString(assertRecord(payload, 'sqliteInitRequest').schema, 'sqliteInitRequest.schema') }),
    }),
    selectData: createContract({
      channel: IPC_CHANNELS.database.selectData,
      serialize: (request) => request,
      validate: assertSelectDataPayload,
    }),
    sqliteQuery: createContract({
      channel: IPC_CHANNELS.database.sqliteQuery,
      serialize: (request) => request,
      validate: (payload) => assertSqlPayload(payload, 'sqliteQueryRequest'),
    }),
    sqliteGet: createContract({
      channel: IPC_CHANNELS.database.sqliteGet,
      serialize: (request) => request,
      validate: (payload) => assertSqlPayload(payload, 'sqliteGetRequest'),
    }),
    sqliteInsert: createContract({
      channel: IPC_CHANNELS.database.sqliteInsert,
      serialize: (request) => request,
      validate: (payload) => assertSqlPayload(payload, 'sqliteInsertRequest'),
    }),
    sqliteUpdate: createContract({
      channel: IPC_CHANNELS.database.sqliteUpdate,
      serialize: (request) => request,
      validate: (payload) => assertSqlPayload(payload, 'sqliteUpdateRequest'),
    }),
    sqliteDelete: createContract({
      channel: IPC_CHANNELS.database.sqliteDelete,
      serialize: (request) => request,
      validate: (payload) => assertSqlPayload(payload, 'sqliteDeleteRequest'),
    }),
  }),
  yahooFinance: Object.freeze({
    chart: createContract({
      channel: IPC_CHANNELS.yahooFinance.chart,
      serialize: (ticker, options) => ({ ticker, options }),
      validate: (payload) => {
        const data = assertRecord(payload, 'yahooChartRequest');
        return {
          ticker: assertString(data.ticker, 'yahooChartRequest.ticker'),
          options: assertOptionalRecord(data.options, 'yahooChartRequest.options'),
        };
      },
    }),
    search: createContract({
      channel: IPC_CHANNELS.yahooFinance.search,
      serialize: (keyword, options) => ({ keyword, options }),
      validate: (payload) => {
        const data = assertRecord(payload, 'yahooSearchRequest');
        return {
          keyword: assertString(data.keyword, 'yahooSearchRequest.keyword'),
          options: assertOptionalRecord(data.options, 'yahooSearchRequest.options'),
        };
      },
    }),
    historical: createContract({
      channel: IPC_CHANNELS.yahooFinance.historical,
      serialize: (ticker, options) => ({ ticker, options }),
      validate: (payload) => {
        const data = assertRecord(payload, 'yahooHistoricalRequest');
        return {
          ticker: assertString(data.ticker, 'yahooHistoricalRequest.ticker'),
          options: assertOptionalRecord(data.options, 'yahooHistoricalRequest.options'),
        };
      },
    }),
  }),
  outbound: Object.freeze({
    alphaVantage: Object.freeze({
      marketStatus: createContract({
        channel: IPC_CHANNELS.outbound.alphaVantage.marketStatus,
        serialize: (apiKey) => ({ apiKey }),
        validate: (payload) => ({
          apiKey: assertString(assertRecord(payload, 'alphaVantageMarketStatusRequest').apiKey, 'alphaVantageMarketStatusRequest.apiKey'),
        }),
      }),
    }),
    sec: Object.freeze({
      fetchJson: createContract({
        channel: IPC_CHANNELS.outbound.sec.fetchJson,
        serialize: (url, headers) => ({ url, headers }),
        validate: (payload) => {
          const data = assertRecord(payload, 'secFetchJsonRequest');
          return {
            url: assertString(data.url, 'secFetchJsonRequest.url'),
            headers: assertOptionalRecord(data.headers, 'secFetchJsonRequest.headers'),
          };
        },
      }),
      companyTickers: createContract({
        channel: IPC_CHANNELS.outbound.sec.companyTickers,
        serialize: (headers) => ({ headers }),
        validate: (payload) => ({
          headers: assertOptionalRecord(assertRecord(payload, 'secCompanyTickersRequest').headers, 'secCompanyTickersRequest.headers'),
        }),
      }),
    }),
  }),
  transformers: Object.freeze({
    runTextGeneration: createContract({
      channel: IPC_CHANNELS.transformers.runTextGeneration,
      serialize: (model, prompt, params) => ({ model, prompt, params }),
      validate: (payload) => {
        const data = assertRecord(payload, 'transformersRequest');
        return {
          model: assertString(data.model, 'transformersRequest.model'),
          prompt: assertString(data.prompt, 'transformersRequest.prompt'),
          params: assertOptionalRecord(data.params, 'transformersRequest.params'),
        };
      },
    }),
  }),
  puppeteer: Object.freeze({
    getPageText: createContract({
      channel: IPC_CHANNELS.puppeteer.getPageText,
      serialize: (url) => ({ url }),
      validate: (payload) => ({ url: assertString(assertRecord(payload, 'puppeteerRequest').url, 'puppeteerRequest.url') }),
    }),
  }),
  urlWindow: Object.freeze({
    open: createContract({
      channel: IPC_CHANNELS.urlWindow.open,
      type: 'send',
      serialize: (url) => ({ url }),
      validate: (payload) => ({ url: assertString(assertRecord(payload, 'openUrlWindowRequest').url, 'openUrlWindowRequest.url') }),
    }),
    getBodyTextHidden: createContract({
      channel: IPC_CHANNELS.urlWindow.getBodyTextHidden,
      serialize: (url) => ({ url }),
      validate: (payload) => ({ url: assertString(assertRecord(payload, 'getUrlBodyTextHiddenRequest').url, 'getUrlBodyTextHiddenRequest.url') }),
    }),
  }),
});

module.exports = {
  assertRecord,
  assertSelectDataPayload,
  assertSqlPayload,
  assertString,
  createContract,
  invokeContract,
  ipcContracts,
  isPlainObject,
  registerHandle,
  registerListener,
  sendContract,
};
