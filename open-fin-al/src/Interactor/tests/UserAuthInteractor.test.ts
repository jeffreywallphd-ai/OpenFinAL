import { UserAuthInteractor } from '../UserAuthInteractor';
import { PinEncryption } from '../../Utility/PinEncryption';

jest.mock('../../Utility/PinEncryption');

describe('UserAuthInteractor', () => {
  const SQLiteQuery = jest.fn();
  const SQLiteInsert = jest.fn();
  const SQLiteUpdate = jest.fn();

  beforeEach(() => {
    (window as any).database = { SQLiteQuery, SQLiteInsert, SQLiteUpdate };
    jest.clearAllMocks();
    (PinEncryption.validatePinFormat as jest.Mock).mockReturnValue(true);
    (PinEncryption.hashPin as jest.Mock).mockResolvedValue('hash');
    (PinEncryption.verifyPin as jest.Mock).mockResolvedValue(true);
  });

  it('registerUser succeeds', async () => {
    SQLiteQuery.mockResolvedValue([]);
    SQLiteInsert.mockResolvedValue({});
    const res = await new UserAuthInteractor().registerUser({ firstName: 'A', lastName: 'B', username: 'u', pin: '12345678' });
    expect(res.success).toBe(true);
  });

  it('loginUser validates pin', async () => {
    SQLiteQuery.mockResolvedValue([{ id: 1, username: 'u', pinHash: 'hash' }]);
    const res = await new UserAuthInteractor().loginUser('u', '12345678');
    expect(res.success).toBe(true);
  });

  it('changePIN rejects invalid new pin', async () => {
    (PinEncryption.validatePinFormat as jest.Mock).mockReturnValue(false);
    const res = await new UserAuthInteractor().changePIN(1, '1', 'bad');
    expect(res.success).toBe(false);
  });

  it('getUserPortfolios and getDefaultPortfolio handle empty results', async () => {
    SQLiteQuery.mockResolvedValue([]);
    const service = new UserAuthInteractor();
    await expect(service.getUserPortfolios(1)).resolves.toEqual([]);
    await expect(service.getDefaultPortfolio(1)).resolves.toBeNull();
  });

  it('pin reset flow works', async () => {
    SQLiteQuery.mockResolvedValueOnce([{ id: 9, firstName: 'A', lastName: 'B', username: 'u' }]);
    const service = new UserAuthInteractor();
    const init = await service.initiatePinReset('u', 'a', 'b');
    expect(init).toEqual({ success: true, userId: 9 });
    const complete = await service.completePinReset(9, '12345678');
    expect(complete.success).toBe(true);
  });
});
