import { SecRequest } from '../SecRequest';

describe('SecRequest', () => {
  it('requires sec property', () => {
    expect(() => new SecRequest().fillWithRequest({ request: { request: {} } } as any)).toThrow(
      'Making a request about financial statements requires a sec property',
    );
  });

  it('fills fields and defaults accountingStandard to us-gaap', () => {
    const entity = new SecRequest();
    entity.fillWithRequest({ request: { request: { sec: { ticker: 'AAPL', cik: '1', isSP500: 1, concept: 'Assets', limit: '10', startDate: '2024-01-01', endDate: '2024-12-31', key: 'x' } } } } as any);

    expect(entity.getFieldValue('ticker')).toBe('AAPL');
    expect(entity.getFieldValue('accountingStandard')).toBe('us-gaap');
    expect(entity.getFieldValue('key')).toBe('x');
  });

  it('respects provided accountingStandard', () => {
    const entity = new SecRequest();
    entity.fillWithRequest({ request: { request: { sec: { accountingStandard: 'ifrs', ticker: 'SAP' } } } } as any);
    expect(entity.getFieldValue('accountingStandard')).toBe('ifrs');
  });
});
