import { NewsInteractor } from '../NewsInteractor';

const mockCreateGateway = jest.fn();
const mockRead = jest.fn();

jest.mock('../../Entity/NewsRequest', () => ({ NewsRequest: jest.fn().mockImplementation(() => ({ fillWithRequest: jest.fn(), setFieldValue: jest.fn() })) }));
jest.mock('../../Gateway/Data/NewsGatewayFactory', () => ({ NewsGatewayFactory: jest.fn().mockImplementation(() => ({ createGateway: mockCreateGateway })) }));

describe('NewsInteractor', () => {
  beforeEach(() => {
    (window as any).config = { load: jest.fn().mockResolvedValue({}) };
    mockCreateGateway.mockResolvedValue({ key: 'k', sourceName: 'test-source', read: mockRead });
  });

  it('returns converted response and source when results exist', async () => {
    mockRead.mockResolvedValue([]);
    const req: any = { request: { request: { news: { action: 'search' } } } };
    const res: any = await new NewsInteractor().get(req);
    expect(res.source).toBe('test-source');
  });

  it('returns 400 when no results', async () => {
    mockRead.mockResolvedValue(null);
    const req: any = { request: { request: { news: { action: 'search' } } } };
    const res: any = await new NewsInteractor().get(req);
    expect(res.status).toBe(400);
  });
});
