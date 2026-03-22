import { EconomicIndicatorInteractor } from '../EconomicIndicatorInteractor';

jest.mock('../../Entity/EconomicIndicator', () => ({
  EconomicIndicator: jest.fn().mockImplementation(() => ({
    fillWithRequest: jest.fn(),
    setFieldValue: jest.fn(),
  })),
}));

const mockRead = jest.fn();
const mockCreateGateway = jest.fn();
jest.mock('../../Gateway/Data/EconomicIndicatorGatewayFactory', () => ({
  EconomicIndicatorGatewayFactory: jest.fn().mockImplementation(() => ({
    createGateway: mockCreateGateway,
  })),
}));

jest.mock('../../Gateway/Response/JSONResponse', () => ({
  JSONResponse: jest.fn().mockImplementation(() => ({
    response: { response: { ok: true } },
    convertFromEntity: jest.fn(function(this: any) {
      this.response = { converted: true };
    }),
  })),
}));

describe('EconomicIndicatorInteractor', () => {
  beforeEach(() => {
    (window as any).config = { load: jest.fn().mockResolvedValue({}) };
    (window as any).console = { log: jest.fn() };
    mockRead.mockResolvedValue({});
    mockCreateGateway.mockResolvedValue({ key: 'k', read: mockRead });
  });

  it('get uses gateway and returns converted response', async () => {
    const interactor = new EconomicIndicatorInteractor();
    const req: any = { request: { request: { action: 'x' } } };
    await expect(interactor.get(req)).resolves.toEqual({ converted: true });
    expect(mockRead).toHaveBeenCalled();
  });

  it('post/put/delete delegate to get', async () => {
    const interactor = new EconomicIndicatorInteractor();
    const spy = jest.spyOn(interactor, 'get').mockResolvedValue({ ok: true } as any);
    const req: any = {};
    await interactor.post(req);
    await interactor.put(req);
    await interactor.delete(req);
    expect(spy).toHaveBeenCalledTimes(3);
  });
});
