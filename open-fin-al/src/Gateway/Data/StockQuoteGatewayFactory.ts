import { ISecretService } from '../../application/services/ISecretService';
import { IYahooFinanceClient } from '../../application/services/IYahooFinanceClient';
import { ElectronSecretService } from '../../infrastructure/electron/ElectronSecretService';
import { ElectronYahooFinanceClient } from '../../infrastructure/electron/ElectronYahooFinanceClient';
import { IDataGateway } from './IDataGateway';
import { AlphaVantageStockGateway } from './StockGateway/AlphaVantageStockGateway';
import { YFinanceStockGateway } from './StockGateway/YFinanceStockGateway';

interface StockQuoteGatewayFactoryDependencies {
  secretService?: ISecretService;
  yahooFinanceClient?: IYahooFinanceClient;
}

export class StockQuoteGatewayFactory {
  private readonly secretService: ISecretService;
  private readonly yahooFinanceClient: IYahooFinanceClient;

  constructor({
    secretService = new ElectronSecretService(),
    yahooFinanceClient = new ElectronYahooFinanceClient(),
  }: StockQuoteGatewayFactoryDependencies = {}) {
    this.secretService = secretService;
    this.yahooFinanceClient = yahooFinanceClient;
  }

  async createGateway(config: any): Promise<IDataGateway> {
    if (config['StockQuoteGateway'] === 'AlphaVantageStockQuoteGateway') {
      const key = await this.secretService.getSecret('ALPHAVANTAGE_API_KEY');
      return new AlphaVantageStockGateway(key);
    }

    if (config['StockQuoteGateway'] === 'YFinanceStockQuoteGateway') {
      return new YFinanceStockGateway(this.yahooFinanceClient);
    }

    const key = await this.secretService.getSecret('ALPHAVANTAGE_API_KEY');
    return new AlphaVantageStockGateway(key);
  }
}
