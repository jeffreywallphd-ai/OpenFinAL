import * as ModuleUnderTest from '../TickerSearchBar.jsx';

describe('TickerSearchBar module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports TickerSearchBar', () => {
    expect(ModuleUnderTest.TickerSearchBar).toBeDefined();
  });
});
