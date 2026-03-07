import * as ModuleUnderTest from '../Stock.jsx';

describe('Stock module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports TimeSeries', () => {
    expect(ModuleUnderTest.TimeSeries).toBeDefined();
  });
});
