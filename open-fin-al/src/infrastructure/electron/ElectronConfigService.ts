import { IConfigService } from '../../application/services/IConfigService';

export class ElectronConfigService implements IConfigService {
  async load(): Promise<any> {
    return window.config.load();
  }
}
