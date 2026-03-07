import * as Module from '../NewsGatewayFactory';
import { NewsGatewayFactory } from '../NewsGatewayFactory';
describe('NewsGatewayFactory', () => {
  beforeEach(() => {
    (global as any).window = (global as any).window || {};
    (window as any).vault = (window as any).vault || { getSecret: jest.fn().mockResolvedValue('secret') };
    (window as any).database = (window as any).database || { SQLiteQuery: jest.fn(), SQLiteGet: jest.fn(), SQLiteInsert: jest.fn(), SQLiteRun: jest.fn(), SQLiteInit: jest.fn() };
    (window as any).transformers = (window as any).transformers || { runTextGeneration: jest.fn().mockResolvedValue({ generated_text: 'ok' }) };
  });

  it('exports module members', () => {
    expect(Object.keys(Module).length).toBeGreaterThan(0);
  });

  it('constructs NewsGatewayFactory', () => {
    const instance = new (NewsGatewayFactory as any)('key');
    expect(instance).toBeInstanceOf(NewsGatewayFactory);
  });
});
