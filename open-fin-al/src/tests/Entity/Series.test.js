import { Series } from '../../Entity/Series';

describe('Series', () => {
  it('supports positional and label access', () => {
    const series = new Series([10, 20, 30], { name: 'price', index: ['a', 'b', 'c'] });

    expect(series.length).toBe(3);
    expect(series.iloc(2)).toBe(30);
    expect(series.loc('b')).toBe(20);
    expect(series.get(1)).toBe(20);
    expect(series.get('a')).toBe(10);
  });
});
