import * as ModuleUnderTest from '../Browser.jsx';

describe('Browser module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports NewsBrowser', () => {
    expect(ModuleUnderTest.NewsBrowser).toBeDefined();
  });
});
