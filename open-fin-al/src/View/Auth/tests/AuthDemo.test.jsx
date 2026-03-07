import * as ModuleUnderTest from '../AuthDemo.jsx';

describe('AuthDemo module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports AuthDemo', () => {
    expect(ModuleUnderTest.AuthDemo).toBeDefined();
  });
});
