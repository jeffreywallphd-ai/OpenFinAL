import { StockRequest } from '../../../Entity/StockRequest';
import { YFinanceStockGateway } from '../../../Gateway/Data/StockGateway/YFinanceStockGateway';

describe('YFinanceStockGateway', () => {
  test('formats lookup results through an injected yahoo finance client', async () => {
    const yahooFinanceClient = {
      search: jest.fn().mockResolvedValue({
        quotes: [
          { symbol: 'AAPL', shortName: 'Apple Inc.' },
          { symbol: 'MSFT', shortName: 'Microsoft Corporation' },
          { shortName: 'Missing Symbol' },
        ],
      }),
      chart: jest.fn(),
      historical: jest.fn(),
    };

    const gateway = new YFinanceStockGateway(yahooFinanceClient);
    const request = new StockRequest();
    request.setFieldValue('keyword', 'apple');

    const results = await gateway.read(request, 'lookup');

    expect(yahooFinanceClient.search).toHaveBeenCalledWith('apple', { quotesCount: 10 });
    expect(results).toHaveLength(2);
    expect(results[0].getFieldValue('ticker')).toBe('AAPL');
    expect(results[0].getFieldValue('companyName')).toBe('Apple Inc.');
  });

  test('formats quote data from the injected yahoo finance client', async () => {
    const yahooFinanceClient = {
      search: jest.fn(),
      chart: jest.fn().mockResolvedValue({
        quotes: [
          { date: '2024-01-02T14:30:00.000Z', close: 189.12, volume: 1000 },
          { date: '2024-01-02T14:31:00.000Z', close: 190.34, volume: 1200 },
        ],
      }),
      historical: jest.fn(),
    };

    const gateway = new YFinanceStockGateway(yahooFinanceClient);
    const request = new StockRequest();
    request.setFieldValue('ticker', 'AAPL');

    const results = await gateway.read(request, 'quote');

    expect(yahooFinanceClient.chart).toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0].getFieldValue('data')).toEqual([
      {
        date: new Date('2024-01-02T14:30:00.000Z').toLocaleDateString(),
        time: new Date('2024-01-02T14:30:00.000Z').toLocaleTimeString(),
        price: 189.12,
        volume: 1000,
      },
      {
        date: new Date('2024-01-02T14:31:00.000Z').toLocaleDateString(),
        time: new Date('2024-01-02T14:31:00.000Z').toLocaleTimeString(),
        price: 190.34,
        volume: 1200,
      },
    ]);
  });
});
