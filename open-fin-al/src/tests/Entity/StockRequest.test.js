import { StockRequest } from '../../Entity/StockRequest';
import { JSONRequest } from '../../Gateway/Request/JSONRequest';

describe('StockRequest entity', () => {
  it('initializes dataFrame field and maps request dataFrame rows', () => {
    const stockRequest = new StockRequest();

    expect(stockRequest.getFieldValue('dataFrame')).toBeNull();

    stockRequest.fillWithRequest(
      new JSONRequest(
        JSON.stringify({
          request: {
            stock: {
              ticker: 'AAPL',
              dataFrame: {
                rows: [{ date: '2024-02-01', time: '09:31:00', price: '188.5', volume: '1000' }],
              },
            },
          },
        })
      )
    );

    const dataFrame = stockRequest.getFieldValue('dataFrame');
    expect(dataFrame).toBeDefined();
    expect(dataFrame.toArray()).toEqual([
      { date: '2024-02-01', time: '09:31:00', price: 188.5, volume: 1000 },
    ]);
  });
});
