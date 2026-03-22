import { StockInteractor } from '../StockInteractor';

const mockCreateGateway = jest.fn();
const mockCreateQuoteGateway = jest.fn();
const mockRead = jest.fn();
const mockFileRead = jest.fn();
const mockFileWrite = jest.fn();

jest.mock('../../Entity/StockRequest', () => ({ StockRequest: jest.fn().mockImplementation(() => ({ fillWithRequest: jest.fn(), setFieldValue: jest.fn() })) }));
jest.mock('../../Gateway/Data/StockGatewayFactory', () => ({ StockGatewayFactory: jest.fn().mockImplementation(() => ({ createGateway: mockCreateGateway })) }));
jest.mock('../../Gateway/Data/StockQuoteGatewayFactory', () => ({ StockQuoteGatewayFactory: jest.fn().mockImplementation(() => ({ createGateway: mockCreateQuoteGateway })) }));

describe('StockInteractor', () => {
  beforeEach(() => {
    (window as any).config = { load: jest.fn().mockResolvedValue({}) };
    (window as any).fs = { existsSync: jest.fn().mockReturnValue(false), readFileSync: mockFileRead, writeFileSync: mockFileWrite };
    mockCreateGateway.mockResolvedValue({ key: 'k', read: mockRead, sourceName: 'src' });
    mockCreateQuoteGateway.mockResolvedValue({ key: 'q', read: mockRead, sourceName: 'src' });
    mockRead.mockResolvedValue([]);
  });

  it('uses quote gateway for quote action', async () => {
    const req: any = { request: { request: { stock: { action: 'quote' } } } };
    await new StockInteractor().get(req);
    expect(mockCreateQuoteGateway).toHaveBeenCalled();
  });

  it('uses stock gateway for lookup action', async () => {
    const req: any = { request: { request: { stock: { action: 'lookup' } } } };
    await new StockInteractor().get(req);
    expect(mockCreateGateway).toHaveBeenCalled();
  });
});
