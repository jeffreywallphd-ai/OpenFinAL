import * as ModuleUnderTest from '../AuthContainer.jsx';

describe('AuthContainer module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports AuthContainer', () => {
    expect(ModuleUnderTest.AuthContainer).toBeDefined();
  });
});
