export interface IConfigService<TConfig = any> {
  load(): Promise<TConfig>;
}
