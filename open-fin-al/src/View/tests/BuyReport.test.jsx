import * as ModuleUnderTest from '../BuyReport.jsx';

describe('BuyReport module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports a default value', () => {
    expect(ModuleUnderTest.default).toBeDefined();
  });
});
