import { StockInteractor } from '../../Interactor/StockInteractor';

describe('StockInteractor', () => {
  test('loads config through the injected config service and uses injected factories', async () => {
    const configService = {
      load: jest.fn().mockResolvedValue({
        StockGateway: 'FinancialModelingPrepGateway',
        StockQuoteGateway: 'YFinanceStockQuoteGateway',
      }),
    };

    const quoteGateway = {
      key: undefined as string | undefined,
      sourceName: 'Injected Quote Gateway',
      read: jest.fn().mockResolvedValue([
        {
          getFields: () =>
            new Map([
              ['ticker', { name: 'ticker', value: 'AAPL' }],
              ['quotePrice', { name: 'quotePrice', value: 190.34 }],
            ]),
        },
      ]),
    };

    const stockGateway = {
      key: 'fmp-key',
      sourceName: 'Injected Stock Gateway',
      read: jest.fn().mockResolvedValue([
        {
          getFields: () =>
            new Map([
              ['ticker', { name: 'ticker', value: 'AAPL' }],
              ['quotePrice', { name: 'quotePrice', value: 190.34 }],
            ]),
        },
      ]),
    };

    const stockQuoteGatewayFactory = {
      createGateway: jest.fn().mockResolvedValue(quoteGateway),
    };
    const stockGatewayFactory = {
      createGateway: jest.fn().mockResolvedValue(stockGateway),
    };

    const interactor = new StockInteractor({
      configService,
      stockGatewayFactory: stockGatewayFactory as any,
      stockQuoteGatewayFactory: stockQuoteGatewayFactory as any,
    });

    const response = await interactor.get({
      request: {
        request: {
          stock: {
            action: 'quote',
            ticker: 'AAPL',
          },
        },
      },
    } as any);

    expect(configService.load).toHaveBeenCalledTimes(1);
    expect(stockQuoteGatewayFactory.createGateway).toHaveBeenCalledWith({
      StockGateway: 'FinancialModelingPrepGateway',
      StockQuoteGateway: 'YFinanceStockQuoteGateway',
    });
    expect(stockGatewayFactory.createGateway).toHaveBeenCalledWith({
      StockGateway: 'FinancialModelingPrepGateway',
      StockQuoteGateway: 'YFinanceStockQuoteGateway',
    });
    expect(response.response.ok).toBe(true);
    expect((response as any).source).toBe('Injected Stock Gateway');
    expect(response.response.results[0]).toEqual({
      ticker: 'AAPL',
      quotePrice: 190.34,
    });
  });
});
