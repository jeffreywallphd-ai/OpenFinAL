import * as ModuleUnderTest from '../Forecast.jsx';

describe('Forecast module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports a default value', () => {
    expect(ModuleUnderTest.default).toBeDefined();
  });
});
