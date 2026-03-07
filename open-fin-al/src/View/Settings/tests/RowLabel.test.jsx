import * as ModuleUnderTest from '../RowLabel.jsx';

describe('RowLabel module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports SettingsRowLabel', () => {
    expect(ModuleUnderTest.SettingsRowLabel).toBeDefined();
  });
});
