import * as ModuleUnderTest from '../PinRegister.jsx';

describe('PinRegister module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports PinRegister', () => {
    expect(ModuleUnderTest.PinRegister).toBeDefined();
  });
});
