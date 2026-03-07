import * as ModuleUnderTest from '../RSIChart.jsx';

describe('RSIChart module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports RSIChart', () => {
    expect(ModuleUnderTest.RSIChart).toBeDefined();
  });
});
