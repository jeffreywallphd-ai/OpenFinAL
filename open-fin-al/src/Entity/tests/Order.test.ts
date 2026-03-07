import { Order } from '../Order';

describe('Order', () => {
  it('validates required fields', () => {
    const entity = new Order();
    expect(() => entity.fillWithRequest({ request: { request: { order: { portfolioId: 1, quantity: 1 } } } } as any)).toThrow(
      'An assetId must be provided to create a new order',
    );
    expect(() => entity.fillWithRequest({ request: { request: { order: { assetId: 1, quantity: 1 } } } } as any)).toThrow(
      'A portfolioId must be provided to create a new order',
    );
    expect(() => entity.fillWithRequest({ request: { request: { order: { assetId: 1, portfolioId: 2 } } } } as any)).toThrow(
      'A quantity must be provided to create a new order',
    );
  });

  it('fills all optional fields', () => {
    const entity = new Order();
    const order = { assetId: 1, portfolioId: 2, quantity: 3, orderType: 'Sell', orderMethod: 'Limit', orderDate: 'd', lastPrice: 10, lastPriceDate: 'ld', limitPrice: 11, stopPrice: 9, fulfilled: 1, fulfilledDate: 'fd', cashId: 7 };
    entity.fillWithRequest({ request: { request: { order } } } as any);
    expect(entity.getFieldValue('orderType')).toBe('Sell');
    expect(entity.getFieldValue('limitPrice')).toBe(11);
    expect(entity.getFieldValue('cashId')).toBe(7);
  });
});
