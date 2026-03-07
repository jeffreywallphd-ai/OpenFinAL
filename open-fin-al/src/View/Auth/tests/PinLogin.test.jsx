import * as ModuleUnderTest from '../PinLogin.jsx';

describe('PinLogin module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports PinLogin', () => {
    expect(ModuleUnderTest.PinLogin).toBeDefined();
  });
});
