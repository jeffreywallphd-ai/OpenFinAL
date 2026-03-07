import { UserInteractor } from '../UserInteractor';

const mockCreate = jest.fn();
const mockRead = jest.fn();

jest.mock('../../Entity/User', () => ({ User: jest.fn().mockImplementation(() => ({ fillWithRequest: jest.fn() })) }));
jest.mock('../../Gateway/Data/SQLite/SQLiteUserGateway', () => ({ SQLiteUserGateway: jest.fn().mockImplementation(() => ({ create: mockCreate, read: mockRead })) }));

describe('UserInteractor', () => {
  beforeEach(() => {
    mockCreate.mockResolvedValue(true);
    mockRead.mockResolvedValue([]);
  });

  it('post returns success when gateway create succeeds', async () => {
    const res: any = await new UserInteractor().post({} as any);
    expect(res.response.status).toBe(200);
  });

  it('get reads from gateway', async () => {
    await new UserInteractor().get({} as any);
    expect(mockRead).toHaveBeenCalled();
  });

  it('put/delete delegate to post', async () => {
    const interactor = new UserInteractor();
    const spy = jest.spyOn(interactor, 'post').mockResolvedValue({} as any);
    await interactor.put({} as any);
    await interactor.delete({} as any);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
