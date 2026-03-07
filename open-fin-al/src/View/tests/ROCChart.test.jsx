import * as ModuleUnderTest from '../ROCChart.jsx';

describe('ROCChart module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports ROCChart', () => {
    expect(ModuleUnderTest.ROCChart).toBeDefined();
  });
});
