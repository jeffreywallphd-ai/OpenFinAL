import { StockPriceVolumeDataFrame } from '../../Entity/StockPriceVolumeDataFrame';

describe('StockPriceVolumeDataFrame entity', () => {
  it('normalizes mixed time series rows', () => {
    const dataFrame = StockPriceVolumeDataFrame.fromRows([
      { date: '2024-01-01', time: '09:30:00', price: '100.55', volume: '2000' },
      { date: '2024-01-02', price: 101.25, volume: null },
      { time: '10:00:00', price: 1.5, volume: 100 },
    ]);

    expect(dataFrame.getFieldValue('rowCount')).toBe(2);
    expect(dataFrame.toArray()).toEqual([
      { date: '2024-01-01', time: '09:30:00', price: 100.55, volume: 2000 },
      { date: '2024-01-02', time: '', price: 101.25, volume: null },
    ]);
  });

  it('updates row count when rows are reset', () => {
    const dataFrame = new StockPriceVolumeDataFrame();
    dataFrame.setFieldValue('rows', [{ date: '2024-01-03', price: '88', volume: '12' }]);

    expect(dataFrame.getFieldValue('rowCount')).toBe(1);
    expect(dataFrame.toJSON()).toEqual({
      columns: ['date', 'time', 'price', 'volume'],
      rows: [{ date: '2024-01-03', time: '', price: 88, volume: 12 }],
      rowCount: 1,
    });
  });
});
