import * as ModuleUnderTest from '../LoadedLayout.jsx';

describe('LoadedLayout module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports AppLoadedLayout', () => {
    expect(ModuleUnderTest.AppLoadedLayout).toBeDefined();
  });
  it('exports HeaderContext', () => {
    expect(ModuleUnderTest.HeaderContext).toBeDefined();
  });
  it('exports useHeader', () => {
    expect(ModuleUnderTest.useHeader).toBeDefined();
  });
});
