import { MarketStatusInteractor } from '../MarketStatusInteractor';

const mockCreateGateway = jest.fn();
const mockRead = jest.fn();

jest.mock('../../Entity/MarketStatus', () => ({ MarketStatus: jest.fn().mockImplementation(() => ({ fillWithRequest: jest.fn(), setFieldValue: jest.fn() })) }));
jest.mock('../../Gateway/Data/MarketStatusGatewayFactory', () => ({ MarketStatusGatewayFactory: jest.fn().mockImplementation(() => ({ createGateway: mockCreateGateway })) }));

describe('MarketStatusInteractor', () => {
  beforeEach(() => {
    (window as any).config = { load: jest.fn().mockResolvedValue({}) };
    mockCreateGateway.mockResolvedValue({ key: 'k', read: mockRead });
    mockRead.mockResolvedValue([]);
  });

  it('get reads market status', async () => {
    await new MarketStatusInteractor().get({} as any);
    expect(mockRead).toHaveBeenCalled();
  });

  it('post/put/delete delegate to get', async () => {
    const interactor = new MarketStatusInteractor();
    const spy = jest.spyOn(interactor, 'get').mockResolvedValue({} as any);
    await interactor.post({} as any);
    await interactor.put({} as any);
    await interactor.delete({} as any);
    expect(spy).toHaveBeenCalledTimes(3);
  });
});
