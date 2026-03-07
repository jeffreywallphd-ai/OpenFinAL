import * as ModuleUnderTest from '../Learn.jsx';

describe('Learn module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports Learn', () => {
    expect(ModuleUnderTest.Learn).toBeDefined();
  });
});
