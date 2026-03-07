import { PortfolioTransactionInteractor } from '../PortfolioTransactionInteractor';

const mockCreate = jest.fn();
const mockRead = jest.fn();

jest.mock('../../Entity/PortfolioTransaction', () => ({ PortfolioTransaction: jest.fn().mockImplementation(() => ({ fillWithRequest: jest.fn(), setFieldValue: jest.fn() })) }));
jest.mock('../../Entity/PortfolioTransactionEntry', () => ({ PortfolioTransactionEntry: jest.fn().mockImplementation(() => ({ setFieldValue: jest.fn() })) }));
jest.mock('../../Gateway/Data/SQLite/SQLitePortfolioTransactionGateway', () => ({ SQLitePortfolioTransactionGateway: jest.fn().mockImplementation(() => ({ create: mockCreate, read: mockRead })) }));

describe('PortfolioTransactionInteractor', () => {
  beforeEach(() => {
    mockCreate.mockResolvedValue(true);
    mockRead.mockResolvedValue([]);
  });

  it('post creates deposit transaction', async () => {
    const req: any = { request: { request: { action: 'deposit', transaction: {} } } };
    const res: any = await new PortfolioTransactionInteractor().post(req);
    expect(res.response.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledWith(expect.anything(), 'deposit');
  });

  it('post catches errors', async () => {
    mockCreate.mockRejectedValueOnce(new Error('db'));
    const req: any = { request: { request: { action: 'deposit', transaction: {} } } };
    const res: any = await new PortfolioTransactionInteractor().post(req);
    expect(res.response.status).toBe(500);
  });

  it('get reads by action', async () => {
    const req: any = { request: { request: { action: 'getPortfolioValue', transaction: { portfolioId: 1 } } } };
    await new PortfolioTransactionInteractor().get(req);
    expect(mockRead).toHaveBeenCalledWith(expect.anything(), 'getPortfolioValue');
  });
});
