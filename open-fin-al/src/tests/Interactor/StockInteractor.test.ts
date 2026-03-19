import { StockInteractor } from '../../Interactor/StockInteractor';
import { createStockLookupRequestModel, createStockQuoteRequestModel } from '../../Gateway/Transport/StockTransport';

describe('StockInteractor', () => {
  test('maps lookup transport models into use-case DTOs and preserves the existing response shape', async () => {
    const configService = {
      load: jest.fn().mockResolvedValue({
        StockGateway: 'FinancialModelingPrepGateway',
        StockQuoteGateway: 'YFinanceStockQuoteGateway',
      }),
    };

    const interactor = new StockInteractor({
      configService,
    });

    const originalRead = jest.spyOn(require('../../Gateway/Data/SQLite/SQLiteAssetGateway').SQLiteAssetGateway.prototype, 'read');
    originalRead.mockResolvedValue([
      {
        getFields: () =>
          new Map([
            ['id', { name: 'id', value: 17 }],
            ['symbol', { name: 'symbol', value: 'AAPL' }],
            ['name', { name: 'name', value: 'Apple Inc.' }],
            ['cik', { name: 'cik', value: '0000320193' }],
          ]),
        getFieldValue: (field: string) => ({ id: 17, symbol: 'AAPL', name: 'Apple Inc.', cik: '0000320193' }[field]),
      },
    ]);

    const response = await interactor.get(createStockLookupRequestModel('apple'));

    expect(response).toEqual({
      response: {
        ok: true,
        status: 200,
        results: [
          {
            id: 17,
            symbol: 'AAPL',
            ticker: 'AAPL',
            name: 'Apple Inc.',
            companyName: 'Apple Inc.',
            cik: '0000320193',
          },
        ],
      },
      source: 'SQLite Database',
    });

    originalRead.mockRestore();
  });

  test('uses the dedicated quote gateway for quote requests and serializes quote DTOs', async () => {
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
              ['endDate', { name: 'endDate', value: '1/2/2024' }],
              ['data', { name: 'data', value: [{ date: '1/2/2024', time: '9:31:00 AM', price: 190.34, volume: 1200 }] }],
            ]),
          getFieldValue: (field: string) =>
            ({
              ticker: 'AAPL',
              quotePrice: 190.34,
              endDate: '1/2/2024',
              data: [{ date: '1/2/2024', time: '9:31:00 AM', price: 190.34, volume: 1200 }],
            }[field]),
        },
      ]),
    };

    const stockQuoteGatewayFactory = {
      createGateway: jest.fn().mockResolvedValue(quoteGateway),
    };
    const stockGatewayFactory = {
      createGateway: jest.fn(),
    };

    const interactor = new StockInteractor({
      configService,
      stockGatewayFactory: stockGatewayFactory as any,
      stockQuoteGatewayFactory: stockQuoteGatewayFactory as any,
    });

    const response = await interactor.get(createStockQuoteRequestModel('AAPL'));

    expect(configService.load).toHaveBeenCalledTimes(1);
    expect(stockQuoteGatewayFactory.createGateway).toHaveBeenCalledWith({
      StockGateway: 'FinancialModelingPrepGateway',
      StockQuoteGateway: 'YFinanceStockQuoteGateway',
    });
    expect(stockGatewayFactory.createGateway).not.toHaveBeenCalled();
    expect(response).toEqual({
      response: {
        ok: true,
        status: 200,
        results: [
          {
            ticker: 'AAPL',
            quotePrice: 190.34,
            date: '1/2/2024',
            startDate: '1/2/2024',
            endDate: '1/2/2024',
            data: [{ date: '1/2/2024', time: '9:31:00 AM', price: 190.34, volume: 1200 }],
          },
        ],
      },
      source: 'Injected Quote Gateway',
    });
  });
});
