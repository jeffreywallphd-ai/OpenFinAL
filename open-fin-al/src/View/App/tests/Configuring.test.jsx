import * as ModuleUnderTest from '../Configuring.jsx';

describe('Configuring module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports AppConfiguring', () => {
    expect(ModuleUnderTest.AppConfiguring).toBeDefined();
  });
});
