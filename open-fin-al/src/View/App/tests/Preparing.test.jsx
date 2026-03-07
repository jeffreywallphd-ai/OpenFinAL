import * as ModuleUnderTest from '../Preparing.jsx';

describe('Preparing module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports AppPreparing', () => {
    expect(ModuleUnderTest.AppPreparing).toBeDefined();
  });
});
