import { DataFrame } from '../../Entity/DataFrame';
import { Series } from '../../Entity/Series';

describe('DataFrame', () => {
  const rows = [
    { ticker: 'AAPL', price: 190.1, volume: 1000 },
    { ticker: 'MSFT', price: 420.4, volume: 1200 },
    { ticker: 'NVDA', price: 950.2, volume: 2000 },
  ];

  it('supports pandas-like shape/columns/head/tail usage', () => {
    const df = new DataFrame(rows);

    expect(df.shape).toEqual([3, 3]);
    expect(df.columns).toEqual(['ticker', 'price', 'volume']);
    expect(df.head(2).toRecords()).toEqual(rows.slice(0, 2));
    expect(df.tail(1).toRecords()).toEqual(rows.slice(-1));
  });

  it('supports column series access and row indexing', () => {
    const df = new DataFrame(rows, { index: ['r1', 'r2', 'r3'] });

    const priceSeries = df.get('price');
    expect(priceSeries).toBeInstanceOf(Series);
    expect(priceSeries.toArray()).toEqual([190.1, 420.4, 950.2]);
    expect(priceSeries.loc('r2')).toBe(420.4);

    expect(df.iloc(1)).toEqual(rows[1]);
    expect(df.loc('r3')).toEqual(rows[2]);
    expect(df.get(0)).toEqual(rows[0]);
  });

  it('supports selecting columns and adding columns', () => {
    const df = new DataFrame(rows);

    const selected = df.select(['ticker', 'volume']);
    expect(selected.columns).toEqual(['ticker', 'volume']);
    expect(selected.toRecords()).toEqual([
      { ticker: 'AAPL', volume: 1000 },
      { ticker: 'MSFT', volume: 1200 },
      { ticker: 'NVDA', volume: 2000 },
    ]);

    const withNotional = df.withColumn('notional', [190100, 504480, 1900400]);
    expect(withNotional.get('notional').toArray()).toEqual([190100, 504480, 1900400]);
  });
});
