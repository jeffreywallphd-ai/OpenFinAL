import { PortfolioTransactionEntry } from '../PortfolioTransactionEntry';

describe('PortfolioTransactionEntry', () => {
  it('validates required values', () => {
    const entity = new PortfolioTransactionEntry();
    expect(() => entity.fillWithRequest({ request: { request: { transactionEntry: {} } } } as any)).toThrow(
      'An assetId must be provided to create a new transaction',
    );
  });

  it('fills fields and keeps existing side mapping behavior', () => {
    const entity = new PortfolioTransactionEntry();
    const tx = { transactionId: 1, assetId: 2, side: 'credit', portfolioId: 99, orderDate: 'd', quantity: 4, price: 5, amount: 20 };
    entity.fillWithRequest({ request: { request: { transactionEntry: tx } } } as any);
    expect(entity.getFieldValue('transactionId')).toBe(1);
    expect(entity.getFieldValue('assetId')).toBe(2);
    expect(entity.getFieldValue('side')).toBe(99);
    expect(entity.getFieldValue('amount')).toBe(20);
  });
});
