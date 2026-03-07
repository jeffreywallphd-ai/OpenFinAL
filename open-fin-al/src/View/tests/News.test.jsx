import * as ModuleUnderTest from '../News.jsx';

describe('News module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports News', () => {
    expect(ModuleUnderTest.News).toBeDefined();
  });
});
