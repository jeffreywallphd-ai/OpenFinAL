import { InitializationInteractor } from '../InitializationInteractor';

const mockCreateTables = jest.fn();
const mockCheckTableExists = jest.fn();
const mockCreateConfig = jest.fn();
const mockGetConfig = jest.fn();
const mockStockGet = jest.fn();
const mockUserCheckTable = jest.fn();
const mockAssetCount = jest.fn();
const mockSettingsGet = jest.fn();

jest.mock('../../Gateway/Data/SQLite/SQLiteTableCreationGateway', () => ({
  SQLiteTableCreationGateway: jest.fn().mockImplementation(() => ({ create: mockCreateTables, checkTableExists: mockCheckTableExists })),
}));
jest.mock('../../Utility/ConfigManager', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ createConfigIfNotExists: mockCreateConfig, getConfig: mockGetConfig })),
}));
jest.mock('../StockInteractor', () => ({ StockInteractor: jest.fn().mockImplementation(() => ({ get: mockStockGet })) }));
jest.mock('../../Gateway/Data/SQLite/SQLiteUserGateway', () => ({ SQLiteUserGateway: jest.fn().mockImplementation(() => ({ checkTableExists: mockUserCheckTable })) }));
jest.mock('../../Gateway/Data/SQLite/SQLiteAssetGateway', () => ({ SQLiteAssetGateway: jest.fn().mockImplementation(() => ({ count: mockAssetCount })) }));
jest.mock('../SettingsInteractor', () => ({ SettingsInteractor: jest.fn().mockImplementation(() => ({ get: mockSettingsGet })) }));

describe('InitializationInteractor', () => {
  beforeEach(() => {
    (window as any).vault = { refreshCert: jest.fn() };
    jest.clearAllMocks();
  });

  it('createConfig action returns success when config and tables created', async () => {
    mockCreateTables.mockResolvedValue(true);
    mockCreateConfig.mockResolvedValue(true);
    const res: any = await new InitializationInteractor().post({} as any, 'createConfig');
    expect(res.response.status).toBe(200);
  });

  it('initializeData fails when stock interactor errors', async () => {
    mockStockGet.mockRejectedValue(new Error('boom'));
    const res: any = await new InitializationInteractor().post({} as any, 'initializeData');
    expect(res.response.status).toBe(500);
  });

  it('refreshPinnedCertificates refreshes each trusted host', async () => {
    const interactor = new InitializationInteractor();
    const res: any = await interactor.post({} as any, 'refreshPinnedCertificates');
    expect((window as any).vault.refreshCert).toHaveBeenCalledTimes(interactor.trustedHosts.length);
    expect(res.response.status).toBe(200);
  });

  it('isInitialized validates dependencies and returns 200', async () => {
    mockCheckTableExists.mockResolvedValue(true);
    mockUserCheckTable.mockResolvedValue(true);
    mockAssetCount.mockResolvedValue({ count: 8000 });
    mockGetConfig.mockResolvedValue({});
    const res: any = await new InitializationInteractor().get({} as any, 'isInitialized');
    expect(res.response.status).toBe(200);
  });

  it('isConfigured returns 404 when settings not configured', async () => {
    mockCheckTableExists.mockResolvedValue(true);
    mockGetConfig.mockResolvedValue({});
    mockSettingsGet.mockResolvedValue({ response: { ok: false } });
    const res: any = await new InitializationInteractor().get({} as any, 'isConfigured');
    expect(res.response.status).toBe(404);
  });
});
