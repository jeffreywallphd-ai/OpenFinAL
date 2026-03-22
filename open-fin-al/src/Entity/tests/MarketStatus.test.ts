import { MarketStatus } from '../MarketStatus';

describe('MarketStatus', () => {
  it('fills provided properties', () => {
    const entity = new MarketStatus();
    entity.fillWithRequest({ request: { request: { market: { id: 1, type: 'equity', region: 'US', open: '09:30', close: '16:00', status: 'open' } } } } as any);
    expect(entity.getId()).toBe(1);
    expect(entity.getFieldValue('region')).toBe('US');
    expect(entity.getFieldValue('status')).toBe('open');
  });

  it('throws on unknown field', () => {
    expect(() => new MarketStatus().setFieldValue('missing', 'x')).toThrow('The requested data property does not exist.');
  });

  it('throws for fillWithResponse', () => {
    expect(() => new MarketStatus().fillWithResponse({} as any)).toThrow('Method not implemented.');
  });
});
