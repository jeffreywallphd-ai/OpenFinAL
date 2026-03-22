import { SettingsInteractor } from '../SettingsInteractor';

const mockGetConfig = jest.fn();
const mockGetSecret = jest.fn();
const mockSetSecret = jest.fn();
const mockSaveConfig = jest.fn();

jest.mock('../../Utility/ConfigManager', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getConfig: mockGetConfig,
    getSecret: mockGetSecret,
    setSecret: mockSetSecret,
    saveConfig: mockSaveConfig,
  })),
}));

jest.mock('@Entity/EconomicIndicator', () => ({ EconomicIndicator: jest.fn() }), { virtual: true });
jest.mock('@Entity/MarketStatus', () => ({ MarketStatus: jest.fn() }), { virtual: true });

describe('SettingsInteractor', () => {
  const baseConfig = {
    UserSettings: { FirstName: 'A', LastName: 'B' },
    MarketStatusGateway: 'AlphaVantageMarketGateway',
    StockGateway: 'YFinanceStockGateway',
    StockQuoteGateway: 'AlphaVantageStockQuoteGateway',
    NewsGateway: 'AlphaVantageNewsGateway',
    ReportGateway: 'SecAPIGateway',
    RatioGateway: 'AlphaVantageRatioGateway',
    EconomicIndicatorGateway: 'AlphaVantageEconomicGateway',
    ChatbotModel: 'OpenAIModelGateway',
    NewsSummaryModel: 'OpenAIModelGateway',
    ChatbotModelSettings: { ChatbotModelName: 'gpt', ChatbotModelMaxOutputTokens: 10, ChatbotModelTemperature: 1, ChatbotModelTopP: 1 },
    NewsSummaryModelSettings: { NewsSummaryModelName: 'gpt', NewsSummaryModelMaxOutputTokens: 10, NewsSummaryModelTemperature: 1, NewsSummaryModelTopP: 1 },
  };

  beforeEach(() => {
    (window as any).config = { getUsername: jest.fn().mockResolvedValue('user') };
    jest.clearAllMocks();
    mockGetConfig.mockResolvedValue(JSON.parse(JSON.stringify(baseConfig)));
    mockGetSecret.mockResolvedValue('secret');
    mockSaveConfig.mockReturnValue(true);
  });

  it('post saves values and secrets', async () => {
    const req: any = { request: { configurations: { a: { hasValue: true, valueIsKey: true, valueName: 'ALPHA', value: 'new', name: 'ALPHA', setting: 'UserSettings', valueType: 'text' } } } };
    const res: any = await new SettingsInteractor().post(req);
    expect(res.response.status).toBe(200);
  });

  it('get returns 200 for isConfigured when required settings are populated', async () => {
    const interactor = new SettingsInteractor();
    const mk = () => ({ toObject: () => ({ value: 'x' }) });
    jest.spyOn(interactor, 'createChatbotModelSettings').mockResolvedValue({
      currentAIModel: mk(),
      chatbotModelName: mk(),
      chatbotMaxTokens: mk(),
      chatbotTemperature: mk(),
      chatbotTopP: mk(),
      chatbotModelGatewayConfiguration: mk(),
      chatbotModelNameConfiguration: mk(),
      chatbotMaxTokensConfiguration: mk(),
      chatbotTemperatureConfiguration: mk(),
      chatbotTopPConfiguration: mk(),
    } as any);
    jest.spyOn(interactor, 'createNewsSummaryModelSettings').mockResolvedValue({
      currentAIModel: mk(),
      newsSummaryModelName: mk(),
      newsSummaryModelMaxTokens: mk(),
      newsSummaryModelTemperature: mk(),
      newsSummaryModelTopP: mk(),
      newsSummaryModelGatewayConfiguration: mk(),
      newsSummaryModelNameConfiguration: mk(),
      newsSummaryModelMaxTokensConfiguration: mk(),
      newsSummaryModelTemperatureConfiguration: mk(),
      newsSummaryModelTopPConfiguration: mk(),
    } as any);

    const req: any = { request: { action: 'isConfigured' } };
    const res: any = await interactor.get(req);
    expect(res.response.status).toBe(200);
  });

  it('put delegates to post and delete throws', async () => {
    const interactor = new SettingsInteractor();
    const spy = jest.spyOn(interactor, 'post').mockResolvedValue({ ok: true } as any);
    await interactor.put({} as any);
    await expect(interactor.delete({} as any)).rejects.toThrow('Configurations cannot be deleted.');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
