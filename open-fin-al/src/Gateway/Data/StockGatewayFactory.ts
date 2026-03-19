import { ISecretService } from '../../application/services/ISecretService';
import { IYahooFinanceClient } from '../../application/services/IYahooFinanceClient';
import { ElectronSecretService } from '../../infrastructure/electron/ElectronSecretService';
import { ElectronYahooFinanceClient } from '../../infrastructure/electron/ElectronYahooFinanceClient';
import { IDataGateway } from './IDataGateway';
import { FinancialModelingPrepGateway } from './StockGateway/FMPStockGateway';
import { AlphaVantageStockGateway } from './StockGateway/AlphaVantageStockGateway';
import { YFinanceStockGateway } from './StockGateway/YFinanceStockGateway';

interface StockGatewayFactoryDependencies {
  secretService?: ISecretService;
  yahooFinanceClient?: IYahooFinanceClient;
}

export class StockGatewayFactory {
  private readonly secretService: ISecretService;
  private readonly yahooFinanceClient: IYahooFinanceClient;

  constructor({
    secretService = new ElectronSecretService(),
    yahooFinanceClient = new ElectronYahooFinanceClient(),
  }: StockGatewayFactoryDependencies = {}) {
    this.secretService = secretService;
    this.yahooFinanceClient = yahooFinanceClient;
  }

  async createGateway(config: any): Promise<IDataGateway> {
    if (config['StockGateway'] === 'AlphaVantageStockGateway') {
      const key = await this.secretService.getSecret('ALPHAVANTAGE_API_KEY');
      return new AlphaVantageStockGateway(key);
    }

    if (config['StockGateway'] === 'FinancialModelingPrepGateway') {
      const key = await this.secretService.getSecret('FMP_API_KEY');
      return new FinancialModelingPrepGateway(key);
    }

    if (config['StockGateway'] === 'YFinanceStockGateway') {
      return new YFinanceStockGateway(this.yahooFinanceClient);
    }

    const key = await this.secretService.getSecret('ALPHAVANTAGE_API_KEY');
    return new AlphaVantageStockGateway(key);
  }
}
