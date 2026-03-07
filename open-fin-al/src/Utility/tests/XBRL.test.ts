import XBRL from '../XBRL';

describe('XBRL', () => {
  it('constructs with default null CIK', () => {
    const instance = new XBRL();

    expect(instance).toBeInstanceOf(XBRL);
    expect(instance.CIK).toBeNull();
  });

  it('allows CIK to be assigned after construction', () => {
    const instance = new XBRL();
    instance.CIK = '0000320193';

    expect(instance.CIK).toBe('0000320193');
  });
});
