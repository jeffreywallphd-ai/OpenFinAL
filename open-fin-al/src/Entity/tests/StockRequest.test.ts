import { StockRequest } from '../StockRequest';

describe('StockRequest', () => {
  it('requires stock property', () => {
    expect(() => new StockRequest().fillWithRequest({ request: { request: {} } } as any)).toThrow(
      'Making a request about a stock requires a stock property',
    );
  });

  it('fills every known stock field', () => {
    const entity = new StockRequest();
    const stock = { key: 'k', keyword: 'ai', ticker: 'NVDA', cik: '2', isSP500: 1, companyName: 'NVIDIA', interval: '1d', quotePrice: 120.5, startDate: '2024-01-01', endDate: '2024-01-31' };
    entity.fillWithRequest({ request: { request: { stock } } } as any);

    expect(entity.getFieldValue('key')).toBe('k');
    expect(entity.getFieldValue('ticker')).toBe('NVDA');
    expect(entity.getFieldValue('quotePrice')).toBe(120.5);
    expect(entity.getFieldValue('endDate')).toBe('2024-01-31');
  });

  it('throws on unknown field and unimplemented response mapping', () => {
    const entity = new StockRequest();
    expect(() => entity.setFieldValue('badField', 1)).toThrow('The requested data property does not exist.');
    expect(() => entity.fillWithResponse({} as any)).toThrow('Method not implemented.');
  });
});
