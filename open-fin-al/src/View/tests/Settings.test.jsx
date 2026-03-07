import * as ModuleUnderTest from '../Settings.jsx';

describe('Settings module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports Settings', () => {
    expect(ModuleUnderTest.Settings).toBeDefined();
  });
});
