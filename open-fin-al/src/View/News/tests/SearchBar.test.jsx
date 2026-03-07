import * as ModuleUnderTest from '../SearchBar.jsx';

describe('SearchBar module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports NewsSearchBar', () => {
    expect(ModuleUnderTest.NewsSearchBar).toBeDefined();
  });
});
