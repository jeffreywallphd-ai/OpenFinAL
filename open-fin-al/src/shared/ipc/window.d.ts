import type {
  ConfigBridge,
  ConvertBridge,
  DatabaseBridge,
  ElectronAppBridge,
  ExApiBridge,
  FileBridge,
  OutboundBridge,
  PuppeteerBridge,
  TransformersBridge,
  UrlWindowBridge,
  VaultBridge,
  YahooFinanceBridge,
} from './contracts';

declare global {
  interface Window {
    config: ConfigBridge;
    convert: ConvertBridge;
    database: DatabaseBridge;
    electron: {
      ipcRenderer: {
        invoke<T = any>(channel: string, payload?: unknown): Promise<T>;
        send(channel: string, payload?: unknown): void;
      };
    };
    electronApp: ElectronAppBridge;
    exApi: ExApiBridge;
    file: FileBridge;
    outbound: OutboundBridge;
    puppetApi: PuppeteerBridge;
    transformers: TransformersBridge;
    urlWindow: UrlWindowBridge;
    vault: VaultBridge;
    yahooFinance: YahooFinanceBridge;
  }
}

export {};
