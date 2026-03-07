import { Asset } from '../Asset';

describe('Asset', () => {
  it('validates required fields', () => {
    const entity = new Asset();
    expect(() => entity.fillWithRequest({ request: { request: { asset: { type: 'Stock' } } } } as any)).toThrow(
      'A symbol must be provided for each asset',
    );
    expect(() => entity.fillWithRequest({ request: { request: { asset: { symbol: 'AAPL' } } } } as any)).toThrow(
      'A type must be provided to create a new asset',
    );
  });

  it('maps mirrored name/company and symbol/ticker fields', () => {
    const entity = new Asset();
    entity.fillWithRequest({ request: { request: { asset: { id: 7, symbol: 'MSFT', type: 'Stock', companyName: 'Microsoft', cik: '1', isSP500: 1 } } } } as any);

    expect(entity.getId()).toBe(7);
    expect(entity.getFieldValue('symbol')).toBe('MSFT');
    expect(entity.getFieldValue('ticker')).toBe('MSFT');
    expect(entity.getFieldValue('name')).toBe('Microsoft');
    expect(entity.getFieldValue('companyName')).toBe('Microsoft');
    expect(entity.getFieldValue('cik')).toBe('1');
    expect(entity.getFieldValue('isSP500')).toBe(1);
  });

  it('rejects unknown fields and has unimplemented response mapping', () => {
    const entity = new Asset();
    expect(() => entity.setFieldValue('bad', 1)).toThrow('The requested data property does not exist.');
    expect(() => entity.fillWithResponse({} as any)).toThrow('Method not implemented.');
  });
});
