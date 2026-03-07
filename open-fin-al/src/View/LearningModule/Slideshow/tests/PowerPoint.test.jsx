import * as ModuleUnderTest from '../PowerPoint.jsx';

describe('PowerPoint module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports PowerPoint', () => {
    expect(ModuleUnderTest.PowerPoint).toBeDefined();
  });
});
