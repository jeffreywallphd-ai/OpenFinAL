import * as ModuleUnderTest from '../SlideshowWindow.jsx';

describe('SlideshowWindow module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports SlideshowWindow', () => {
    expect(ModuleUnderTest.SlideshowWindow).toBeDefined();
  });
});
