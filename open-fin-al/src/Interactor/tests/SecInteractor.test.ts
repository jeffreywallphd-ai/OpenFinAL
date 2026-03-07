import { SecInteractor } from '../SecInteractor';

const mockCreateGateway = jest.fn();
const mockRead = jest.fn();

jest.mock('../../Entity/SecRequest', () => ({ SecRequest: jest.fn().mockImplementation(() => ({ fillWithRequest: jest.fn(), setFieldValue: jest.fn() })) }));
jest.mock('../../Gateway/Data/FinancialReportGatewayFactory', () => ({ SecReportGatewayFactory: jest.fn().mockImplementation(() => ({ createGateway: mockCreateGateway })) }));

describe('SecInteractor', () => {
  beforeEach(() => {
    (window as any).config = { load: jest.fn().mockResolvedValue({}) };
    (window as any).convert = { XML2JSON: jest.fn() };
    mockCreateGateway.mockResolvedValue({ key: 'k', read: mockRead });
    mockRead.mockResolvedValue({});
  });

  it('routes report actions to getReportLink', async () => {
    const interactor = new SecInteractor();
    const spy = jest.spyOn(interactor, 'getReportLink').mockResolvedValue({ ok: true } as any);
    const req: any = { request: { request: { sec: { action: '10-K' } } } };
    await interactor.get(req);
    expect(spy).toHaveBeenCalled();
  });

  it('uses gateway for non-report action', async () => {
    const req: any = { request: { request: { sec: { action: 'submissionsLookup' } } } };
    await new SecInteractor().get(req);
    expect(mockRead).toHaveBeenCalled();
  });

  it('put/delete/post delegate to get', async () => {
    const interactor = new SecInteractor();
    const spy = jest.spyOn(interactor, 'get').mockResolvedValue({} as any);
    await interactor.post({} as any);
    await interactor.put({} as any);
    await interactor.delete({} as any);
    expect(spy).toHaveBeenCalledTimes(3);
  });
});
