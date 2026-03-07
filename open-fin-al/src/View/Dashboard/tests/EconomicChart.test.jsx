import * as ModuleUnderTest from '../EconomicChart.jsx';

describe('EconomicChart module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports EconomicChart', () => {
    expect(ModuleUnderTest.EconomicChart).toBeDefined();
  });
});
