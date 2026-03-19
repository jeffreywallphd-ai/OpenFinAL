export interface ISecretService {
  getSecret(key: string): Promise<string | null>;
}
