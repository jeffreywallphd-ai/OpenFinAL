import { LanguageModelInteractor } from '../LanguageModelInteractor';

const mockGetConfig = jest.fn();
const mockCreateChat = jest.fn();
const mockCreateNews = jest.fn();
const mockChatFactoryCreate = jest.fn();
const mockNewsFactoryCreate = jest.fn();

jest.mock('../../Utility/ConfigManager', () => ({ __esModule: true, default: jest.fn().mockImplementation(() => ({ getConfig: mockGetConfig })) }));
jest.mock('../../Entity/LanguageModelRequest', () => ({ LanguageModelRequest: jest.fn().mockImplementation(() => ({ fillWithRequest: jest.fn(), setFieldValue: jest.fn() })) }));
jest.mock('../../Gateway/AI/Model/ChatbotModelGatewayFactory', () => ({ ChatbotModelGatewayFactory: jest.fn().mockImplementation(() => ({ createGateway: mockChatFactoryCreate })) }));
jest.mock('../../Gateway/AI/Model/NewsSummaryModelGatewayFactory', () => ({ NewsSummaryModelGatewayFactory: jest.fn().mockImplementation(() => ({ createGateway: mockNewsFactoryCreate })) }));

describe('LanguageModelInteractor', () => {
  beforeEach(() => {
    mockGetConfig.mockResolvedValue({});
    mockChatFactoryCreate.mockResolvedValue({ key: 'k', create: mockCreateChat });
    mockNewsFactoryCreate.mockResolvedValue({ key: 'n', create: mockCreateNews });
    mockCreateChat.mockResolvedValue({ answer: 'chat' });
    mockCreateNews.mockResolvedValue({ answer: 'news' });
  });

  it('uses chatbot gateway by default', async () => {
    const req: any = { request: { request: { model: { name: 'm', messages: [] } } } };
    const res = await new LanguageModelInteractor().post(req);
    expect(res).toEqual({ answer: 'chat' });
  });

  it('uses news summary gateway for getNewsSummary action', async () => {
    const req: any = { request: { request: { action: 'getNewsSummary', model: { name: 'm', messages: [] } } } };
    const res = await new LanguageModelInteractor().post(req);
    expect(res).toEqual({ answer: 'news' });
  });

  it('get/put/delete delegate to post', async () => {
    const interactor = new LanguageModelInteractor();
    const spy = jest.spyOn(interactor, 'post').mockResolvedValue({ ok: true } as any);
    await interactor.get({} as any);
    await interactor.put({} as any);
    await interactor.delete({} as any);
    expect(spy).toHaveBeenCalledTimes(3);
  });
});
