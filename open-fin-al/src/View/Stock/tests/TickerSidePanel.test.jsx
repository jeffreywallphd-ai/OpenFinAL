import * as ModuleUnderTest from '../TickerSidePanel.jsx';

describe('TickerSidePanel module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports TickerSidePanel', () => {
    expect(ModuleUnderTest.TickerSidePanel).toBeDefined();
  });
});
