import * as ModuleUnderTest from '../TimeSeriesChart.jsx';

describe('TimeSeriesChart module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports TimeSeriesChart', () => {
    expect(ModuleUnderTest.TimeSeriesChart).toBeDefined();
  });
});
