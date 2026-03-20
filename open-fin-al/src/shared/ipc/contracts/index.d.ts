export type Awaitable<T> = T | Promise<T>;

export interface SqlRequest {
  query: string;
  parameters?: unknown[];
}

export interface DatabaseSelectDataRequest {
  query: string;
  inputData?: unknown[];
}

export interface VaultGetSecretRequest {
  key: string;
}

export interface VaultSetSecretRequest {
  key: string;
  value: string;
}

export interface RefreshCertificateRequest {
  hostname: string;
}

export interface YahooChartRequest {
  ticker: string;
  options?: Record<string, unknown>;
}

export interface YahooSearchRequest {
  keyword: string;
  options?: Record<string, unknown>;
}

export interface YahooHistoricalRequest {
  ticker: string;
  options?: Record<string, unknown>;
}

export interface AlphaVantageMarketStatusRequest {
  apiKey: string;
}

export interface SecFetchJsonRequest {
  url: string;
  headers?: Record<string, unknown>;
}

export interface SecCompanyTickersRequest {
  headers?: Record<string, unknown>;
}

export interface TransformersRunTextGenerationRequest {
  model: string;
  prompt: string;
  params?: Record<string, unknown>;
}

export interface FileReadRequest {
  filePath: string;
}

export interface UrlWindowRequest {
  url: string;
}

export interface ConfigBridge {
  exists(): Awaitable<any>;
  save(config: unknown): Awaitable<any>;
  load<T = any>(): Awaitable<T>;
  getUsername(): Awaitable<any>;
}

export interface ElectronAppBridge {
  getUserPath(): Awaitable<any>;
  getAssetPath(): Awaitable<any>;
}

export interface FileBridge {
  read(filePath: string): Awaitable<any>;
  readBinary(filePath: string): Awaitable<any>;
}

export interface ExApiBridge {
  fetch(url: string, params?: Record<string, unknown>): Awaitable<any>;
}

export interface OutboundAlphaVantageBridge {
  marketStatus(apiKey: string): Awaitable<any>;
}

export interface OutboundSecBridge {
  fetchJson(url: string, headers?: Record<string, unknown>): Awaitable<any>;
  companyTickers(headers?: Record<string, unknown>): Awaitable<any>;
}

export interface OutboundBridge {
  alphaVantage: OutboundAlphaVantageBridge;
  sec: OutboundSecBridge;
}

export interface VaultBridge {
  getSecret(key: string, legacyKey?: string): Awaitable<any>;
  setSecret(key: string, value: string): Awaitable<any>;
  refreshCert(hostname: string): Awaitable<any>;
}

export interface AdaptiveGraphBridge {
  syncAdaptiveGraphCatalog(payload: unknown): Awaitable<any>;
  syncAdaptiveLearningGraph(payload: unknown): Awaitable<any>;
  getLearnerSnapshot(learnerId: string): Awaitable<any>;
  findRelevantAssets(query: Record<string, unknown>): Awaitable<any>;
}

export interface DatabaseBridge {
  SQLiteExists(): Awaitable<any>;
  SQLiteInit(schema: string): Awaitable<any>;
  SQLiteGet<T = any>(request: SqlRequest): Awaitable<T>;
  SQLiteQuery<T = any>(request: SqlRequest): Awaitable<T[]>;
  SQLiteSelectData<T = any>(request: DatabaseSelectDataRequest): Awaitable<T[]>;
  SQLiteSelect<T = any>(request: SqlRequest): Awaitable<T[]>;
  SQLiteDelete(request: SqlRequest): Awaitable<any>;
  SQLiteUpdate(request: SqlRequest): Awaitable<any>;
  SQLiteInsert(request: SqlRequest): Awaitable<any>;
}

export interface YahooFinanceBridge {
  chart(ticker: string, options?: Record<string, unknown>): Awaitable<any>;
  search(keyword: string, options?: Record<string, unknown>): Awaitable<any>;
  historical(ticker: string, options?: Record<string, unknown>): Awaitable<any>;
}

export interface TransformersBridge {
  runTextGeneration(model: string, prompt: string, params?: Record<string, unknown>): Awaitable<any>;
}

export interface UrlWindowBridge {
  openUrlWindow(url: string): void;
  getUrlBodyTextHidden(url: string): Awaitable<any>;
}

export interface PuppeteerBridge {
  getPageText(url: string): Awaitable<any>;
}

export interface ConvertBridge {
  xmlToJson: unknown;
}
