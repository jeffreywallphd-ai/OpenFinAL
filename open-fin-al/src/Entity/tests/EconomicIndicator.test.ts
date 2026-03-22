import { EconomicIndicator } from '../EconomicIndicator';

describe('EconomicIndicator', () => {
  it('requires name', () => {
    expect(() => new EconomicIndicator().fillWithRequest({ request: { request: { economics: {} } } } as any)).toThrow(
      'A name is required for the economic indicator',
    );
  });

  it('fills provided fields', () => {
    const entity = new EconomicIndicator();
    const data = { id: 2, name: 'CPI', interval: 'monthly', maturity: '10Y', data: [1], key: 'x' };
    entity.fillWithRequest({ request: { request: { economics: data } } } as any);
    expect(entity.getId()).toBe(2);
    expect(entity.getFieldValue('name')).toBe('CPI');
    expect(entity.getFieldValue('interval')).toBe('monthly');
    expect(entity.getFieldValue('data')).toEqual([1]);
    expect(entity.getFieldValue('key')).toBe('x');
  });
});
