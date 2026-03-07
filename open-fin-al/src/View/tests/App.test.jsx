import * as ModuleUnderTest from '../App.jsx';

describe('App module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports App', () => {
    expect(ModuleUnderTest.App).toBeDefined();
  });
  it('exports DataContext', () => {
    expect(ModuleUnderTest.DataContext).toBeDefined();
  });
});
