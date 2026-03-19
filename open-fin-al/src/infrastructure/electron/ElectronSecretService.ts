import { ISecretService } from '../../application/services/ISecretService';

export class ElectronSecretService implements ISecretService {
  async getSecret(key: string): Promise<string | null> {
    return window.vault.getSecret(key);
  }
}
