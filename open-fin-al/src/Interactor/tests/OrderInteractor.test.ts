import { OrderInteractor } from '../OrderInteractor';

const mockCreate = jest.fn();
const mockTransactionPost = jest.fn();

jest.mock('../../Entity/Order', () => ({ Order: jest.fn().mockImplementation(() => ({ fillWithRequest: jest.fn(), getFieldValue: jest.fn((k:string)=> ({portfolioId:1,assetId:2,quantity:3,lastPrice:4,cashId:5}[k])) })) }));
jest.mock('../../Gateway/Data/SQLite/SQLiteOrderGateway', () => ({ SQLiteOrderGateway: jest.fn().mockImplementation(() => ({ create: mockCreate })) }));
jest.mock('../PortfolioTransactionInteractor', () => ({ PortfolioTransactionInteractor: jest.fn().mockImplementation(() => ({ post: mockTransactionPost })) }));

describe('OrderInteractor', () => {
  beforeEach(() => {
    (global as any).window = { console: { log: jest.fn() } };
    mockCreate.mockResolvedValue(true);
    mockTransactionPost.mockResolvedValue({ ok: true });
  });

  it('post creates order and triggers purchaseAsset transaction', async () => {
    const res: any = await new OrderInteractor().post({} as any);
    expect(res.response.status).toBe(200);
    expect(mockTransactionPost).toHaveBeenCalled();
  });

  it('post returns 500 when order creation fails', async () => {
    mockCreate.mockResolvedValue(false);
    const res: any = await new OrderInteractor().post({} as any);
    expect(res.response.status).toBe(500);
  });

  it('get currently throws because gateway is not initialized', async () => {
    await expect(new OrderInteractor().get({} as any)).rejects.toThrow();
  });
});
