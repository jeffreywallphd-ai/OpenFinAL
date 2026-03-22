import { FinancialRatioInteractor } from '../FinancialRatioInteractor';

const mockRead = jest.fn();
const mockCreateGateway = jest.fn();

jest.mock('../../Entity/SecRequest', () => ({
  SecRequest: jest.fn().mockImplementation(() => ({ fillWithRequest: jest.fn(), setFieldValue: jest.fn() })),
}));
jest.mock('../../Gateway/Data/FinancialRatioGatewayFactory', () => ({
  FinancialRatioGatewayFactory: jest.fn().mockImplementation(() => ({ createGateway: mockCreateGateway })),
}));
jest.mock('../../Gateway/Response/JSONResponse', () => ({
  JSONResponse: jest.fn().mockImplementation(() => ({ response: { converted: true }, convertFromEntity: jest.fn() })),
}));

describe('FinancialRatioInteractor', () => {
  beforeEach(() => {
    (window as any).config = { load: jest.fn().mockResolvedValue({}) };
    mockCreateGateway.mockResolvedValue({ key: 'a', read: mockRead });
    mockRead.mockResolvedValue({});
  });

  it('get invokes gateway read with sec action', async () => {
    const interactor = new FinancialRatioInteractor();
    const req: any = { request: { request: { sec: { action: 'ratios' } } } };
    await interactor.get(req);
    expect(mockRead).toHaveBeenCalledWith(expect.anything(), 'ratios');
  });

  it('post/put/delete delegate to get', async () => {
    const interactor = new FinancialRatioInteractor();
    const spy = jest.spyOn(interactor, 'get').mockResolvedValue({} as any);
    await interactor.post({} as any);
    await interactor.put({} as any);
    await interactor.delete({} as any);
    expect(spy).toHaveBeenCalledTimes(3);
  });
});
