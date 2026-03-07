import * as ModuleUnderTest from '../StockAnalysisSearchBar.jsx';

describe('StockAnalysisSearchBar module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports StockAnalysisSearchBar', () => {
    expect(ModuleUnderTest.StockAnalysisSearchBar).toBeDefined();
  });
});
