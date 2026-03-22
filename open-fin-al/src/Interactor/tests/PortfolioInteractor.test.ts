import { PortfolioInteractor } from '../PortfolioInteractor';

const mockCreate = jest.fn();
const mockReadPortfolio = jest.fn();
const mockReadAsset = jest.fn();

jest.mock('../../Entity/Portfolio', () => ({ Portfolio: jest.fn().mockImplementation(() => ({ fillWithRequest: jest.fn(), setFieldValue: jest.fn() })) }));
jest.mock('../../Entity/Asset', () => ({ Asset: jest.fn().mockImplementation(() => ({ setFieldValue: jest.fn() })) }));
jest.mock('../../Gateway/Data/SQLite/SQLitePortfolioGateway', () => ({ SQLitePortfolioGateway: jest.fn().mockImplementation(() => ({ create: mockCreate, read: mockReadPortfolio })) }));
jest.mock('../../Gateway/Data/SQLite/SQLiteAssetGateway', () => ({ SQLiteAssetGateway: jest.fn().mockImplementation(() => ({ read: mockReadAsset })) }));

describe('PortfolioInteractor', () => {
  beforeEach(() => {
    mockCreate.mockResolvedValue(true);
    mockReadPortfolio.mockResolvedValue([]);
    mockReadAsset.mockResolvedValue([]);
  });

  it('post returns success on create', async () => {
    const res: any = await new PortfolioInteractor().post({} as any);
    expect(res.response.status).toBe(200);
  });

  it('get uses asset gateway for getCashId', async () => {
    const req: any = { request: { request: { action: 'getCashId', portfolio: { userId: 1 } } } };
    await new PortfolioInteractor().get(req);
    expect(mockReadAsset).toHaveBeenCalled();
  });

  it('get uses portfolio gateway by default', async () => {
    const req: any = { request: { request: { action: 'getPortfoliosByUserId', portfolio: { userId: 1 } } } };
    await new PortfolioInteractor().get(req);
    expect(mockReadPortfolio).toHaveBeenCalled();
  });
});
