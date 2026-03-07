import * as ModuleUnderTest from '../ForecastFeature.jsx';

describe('ForecastFeature module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports ForecastFeature', () => {
    expect(ModuleUnderTest.ForecastFeature).toBeDefined();
  });
});
