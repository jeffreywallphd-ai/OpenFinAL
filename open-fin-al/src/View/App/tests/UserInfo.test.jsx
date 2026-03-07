import * as ModuleUnderTest from '../UserInfo.jsx';

describe('UserInfo module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports UserInfo', () => {
    expect(ModuleUnderTest.UserInfo).toBeDefined();
  });
});
