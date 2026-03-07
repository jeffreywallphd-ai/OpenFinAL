import * as ModuleUnderTest from '../Creation.jsx';

describe('Creation module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports PortfolioCreation', () => {
    expect(ModuleUnderTest.PortfolioCreation).toBeDefined();
  });
});
