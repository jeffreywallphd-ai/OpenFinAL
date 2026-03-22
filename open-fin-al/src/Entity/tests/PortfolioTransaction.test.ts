import { PortfolioTransaction } from '../PortfolioTransaction';
import { PortfolioTransactionEntry } from '../PortfolioTransactionEntry';

jest.mock('../PortfolioTransactionEntry', () => ({
  PortfolioTransactionEntry: jest.fn().mockImplementation(() => ({ fillWithRequest: jest.fn() })),
}));

jest.mock('../../Utility/RequestSplitter', () => ({
  RequestSplitter: jest.fn().mockImplementation(() => ({
    split: jest.fn((target: string, _source: string, entryType: string, action: string) => ({
      request: { request: { [target]: { transactionId: 1, assetId: entryType === 'debitEntry' ? 2 : 3, side: entryType, quantity: 1, price: 2 } } },
      action,
    })),
  })),
}));

describe('PortfolioTransaction', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  it('validates required fields', () => {
    const entity = new PortfolioTransaction();
    expect(() => entity.fillWithRequest({ request: { request: { transaction: { type: 'Buy' } } } } as any)).toThrow(
      'A portfolioId must be provided to create a new transaction',
    );
  });

  it('fills transaction and creates debit/credit entries', () => {
    const entity = new PortfolioTransaction();
    const transaction = { portfolioId: 1, type: 'Buy', transactionDate: 'd', note: 'n', isCanceled: 0, debitEntry: { assetId: 2 }, creditEntry: { assetId: 3 } };
    entity.fillWithRequest({ request: { request: { action: 'create', transaction } } } as any);

    expect(entity.getFieldValue('portfolioId')).toBe(1);
    expect(entity.getFieldValue('type')).toBe('Buy');
    expect(PortfolioTransactionEntry).toHaveBeenCalledTimes(2);
    expect(entity.getFieldValue('debitEntry')).toBeTruthy();
    expect(entity.getFieldValue('creditEntry')).toBeTruthy();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});
