import * as ModuleUnderTest from '../Slide.jsx';

describe('Slide module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports Slide', () => {
    expect(ModuleUnderTest.Slide).toBeDefined();
  });
});
