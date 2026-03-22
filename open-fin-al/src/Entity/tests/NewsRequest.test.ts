import { NewsRequest } from '../NewsRequest';

describe('NewsRequest', () => {
  it('requires news property', () => {
    expect(() => new NewsRequest().fillWithRequest({ request: { request: {} } } as any)).toThrow(
      'Making a request about news requires a news property',
    );
  });

  it('fills known fields and keeps current sort mapping behavior', () => {
    const entity = new NewsRequest();
    const news = {
      key: 'abc', keyword: 'inflation', ticker: 'AAPL', topic: 'earnings', companyName: 'Apple',
      limit: '10', sort: 'LATEST', startDate: '2024-01-01', endDate: '2024-01-31'
    };
    entity.fillWithRequest({ request: { request: { news } } } as any);

    expect(entity.getFieldValue('key')).toBe('abc');
    expect(entity.getFieldValue('ticker')).toBe('AAPL');
    expect(entity.getFieldValue('sort')).toBe('10');
    expect(entity.getFieldValue('endDate')).toBe('2024-01-31');
  });

  it('throws on unknown field and unimplemented response mapping', () => {
    const entity = new NewsRequest();
    expect(() => entity.setFieldValue('badField', 1)).toThrow('The requested data property does not exist.');
    expect(() => entity.fillWithResponse({} as any)).toThrow('Method not implemented.');
  });
});
