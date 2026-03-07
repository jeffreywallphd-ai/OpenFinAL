import * as ModuleUnderTest from '../RowValue.jsx';

describe('RowValue module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports SettingsRowValue', () => {
    expect(ModuleUnderTest.SettingsRowValue).toBeDefined();
  });
});
