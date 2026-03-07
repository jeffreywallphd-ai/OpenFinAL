import * as ModuleUnderTest from '../Analysis.jsx';

describe('Analysis module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports Analysis', () => {
    expect(ModuleUnderTest.Analysis).toBeDefined();
  });
});
