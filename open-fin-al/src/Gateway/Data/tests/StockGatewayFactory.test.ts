import * as Module from '../StockGatewayFactory';
import { StockGatewayFactory } from '../StockGatewayFactory';
describe('StockGatewayFactory', () => {
  beforeEach(() => {
    (global as any).window = (global as any).window || {};
    (window as any).vault = (window as any).vault || { getSecret: jest.fn().mockResolvedValue('secret') };
    (window as any).database = (window as any).database || { SQLiteQuery: jest.fn(), SQLiteGet: jest.fn(), SQLiteInsert: jest.fn(), SQLiteRun: jest.fn(), SQLiteInit: jest.fn() };
    (window as any).transformers = (window as any).transformers || { runTextGeneration: jest.fn().mockResolvedValue({ generated_text: 'ok' }) };
  });

  it('exports module members', () => {
    expect(Object.keys(Module).length).toBeGreaterThan(0);
  });

  it('constructs StockGatewayFactory', () => {
    const instance = new (StockGatewayFactory as any)('key');
    expect(instance).toBeInstanceOf(StockGatewayFactory);
  });
});
