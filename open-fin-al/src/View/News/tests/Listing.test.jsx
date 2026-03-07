import * as ModuleUnderTest from '../Listing.jsx';

describe('Listing module', () => {
  it('loads without throwing', () => {
    expect(ModuleUnderTest).toBeDefined();
  });
  it('exports NewsListing', () => {
    expect(ModuleUnderTest.NewsListing).toBeDefined();
  });
});
