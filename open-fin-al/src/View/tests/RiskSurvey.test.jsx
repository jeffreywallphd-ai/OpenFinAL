import * as ModuleUnderTest from '../RiskSurvey.jsx';

describe('RiskSurvey module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports a default value', () => {
    expect(ModuleUnderTest.default).toBeDefined();
  });
});
