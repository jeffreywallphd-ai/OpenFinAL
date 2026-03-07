import * as ModuleUnderTest from '../Home.jsx';

describe('Home module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports a default value', () => {
    expect(ModuleUnderTest.default).toBeDefined();
  });
});
