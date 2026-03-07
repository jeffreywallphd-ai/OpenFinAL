import * as ModuleUnderTest from '../MovingAVGChart.jsx';

describe('MovingAVGChart module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports MovingAvgChart', () => {
    expect(ModuleUnderTest.MovingAvgChart).toBeDefined();
  });
});
