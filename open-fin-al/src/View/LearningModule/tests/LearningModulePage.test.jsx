import * as ModuleUnderTest from '../LearningModulePage.jsx';

describe('LearningModulePage module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports a default value', () => {
    expect(ModuleUnderTest.default).toBeDefined();
  });
  it('exports LearningModulePage', () => {
    expect(ModuleUnderTest.LearningModulePage).toBeDefined();
  });
});
