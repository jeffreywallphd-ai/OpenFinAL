import { Portfolio } from '../Portfolio';

describe('Portfolio', () => {
  it('requires name and userId', () => {
    const entity = new Portfolio();
    expect(() => entity.fillWithRequest({ request: { request: { portfolio: { userId: 'u' } } } } as any)).toThrow(
      'A portfolio name must be provided to create a new portfolio',
    );
    expect(() => entity.fillWithRequest({ request: { request: { portfolio: { name: 'n' } } } } as any)).toThrow(
      'A portfolio must be associated with a valid user',
    );
  });

  it('fills optional and required fields', () => {
    const entity = new Portfolio();
    const portfolio = { name: 'Growth', description: 'desc', userId: 'u1', isDefault: 1, createdAt: 'now', assetGroupDetails: [{ symbol: 'AAPL' }] };
    entity.fillWithRequest({ request: { request: { portfolio } } } as any);
    expect(entity.getFieldValue('name')).toBe('Growth');
    expect(entity.getFieldValue('isDefault')).toBe(1);
    expect(entity.getFieldValue('assetGroupDetails')).toEqual([{ symbol: 'AAPL' }]);
  });
});
