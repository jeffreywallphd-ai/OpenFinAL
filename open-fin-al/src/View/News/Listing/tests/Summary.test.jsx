import * as ModuleUnderTest from '../Summary.jsx';

describe('Summary module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports NewsListingSummary', () => {
    expect(ModuleUnderTest.NewsListingSummary).toBeDefined();
  });
});
