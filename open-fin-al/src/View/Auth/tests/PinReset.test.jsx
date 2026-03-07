import * as ModuleUnderTest from '../PinReset.jsx';

describe('PinReset module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports PinReset', () => {
    expect(ModuleUnderTest.PinReset).toBeDefined();
  });
});
