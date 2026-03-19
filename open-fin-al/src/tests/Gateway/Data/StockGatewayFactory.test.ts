import { StockGatewayFactory } from '../../../Gateway/Data/StockGatewayFactory';
import { StockQuoteGatewayFactory } from '../../../Gateway/Data/StockQuoteGatewayFactory';
import { AlphaVantageStockGateway } from '../../../Gateway/Data/StockGateway/AlphaVantageStockGateway';
import { FinancialModelingPrepGateway } from '../../../Gateway/Data/StockGateway/FMPStockGateway';
import { YFinanceStockGateway } from '../../../Gateway/Data/StockGateway/YFinanceStockGateway';

describe('Stock gateway factories', () => {
  test('StockGatewayFactory uses injected services instead of window globals', async () => {
    const secretService = {
      getSecret: jest.fn(async (key: string) => `${key}-value`),
    };
    const yahooFinanceClient = {
      search: jest.fn(),
      chart: jest.fn(),
      historical: jest.fn(),
    };

    const factory = new StockGatewayFactory({ secretService, yahooFinanceClient });

    const alphaGateway = await factory.createGateway({ StockGateway: 'AlphaVantageStockGateway' });
    expect(alphaGateway).toBeInstanceOf(AlphaVantageStockGateway);
    expect(secretService.getSecret).toHaveBeenCalledWith('ALPHAVANTAGE_API_KEY');

    const fmpGateway = await factory.createGateway({ StockGateway: 'FinancialModelingPrepGateway' });
    expect(fmpGateway).toBeInstanceOf(FinancialModelingPrepGateway);
    expect(secretService.getSecret).toHaveBeenCalledWith('FMP_API_KEY');

    const yfinanceGateway = await factory.createGateway({ StockGateway: 'YFinanceStockGateway' });
    expect(yfinanceGateway).toBeInstanceOf(YFinanceStockGateway);
  });

  test('StockQuoteGatewayFactory creates a Yahoo Finance gateway with injected client', async () => {
    const secretService = {
      getSecret: jest.fn(async () => 'secret'),
    };
    const yahooFinanceClient = {
      search: jest.fn(),
      chart: jest.fn(),
      historical: jest.fn(),
    };

    const factory = new StockQuoteGatewayFactory({ secretService, yahooFinanceClient });
    const gateway = await factory.createGateway({ StockQuoteGateway: 'YFinanceStockQuoteGateway' });

    expect(gateway).toBeInstanceOf(YFinanceStockGateway);
    expect(secretService.getSecret).not.toHaveBeenCalled();
  });
});
