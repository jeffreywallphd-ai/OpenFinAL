import * as ModuleUnderTest from '../Row.jsx';

describe('Row module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports SettingsRow', () => {
    expect(ModuleUnderTest.SettingsRow).toBeDefined();
  });
});
