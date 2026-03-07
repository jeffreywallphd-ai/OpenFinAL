import * as ModuleUnderTest from '../LearningModuleDetails.jsx';

describe('LearningModuleDetails module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports LearningModuleDetails', () => {
    expect(ModuleUnderTest.LearningModuleDetails).toBeDefined();
  });
});
