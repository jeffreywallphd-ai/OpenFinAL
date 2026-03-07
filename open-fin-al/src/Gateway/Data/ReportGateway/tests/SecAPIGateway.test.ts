import * as Module from '../SecAPIGateway';
import { SecAPIGateway } from '../SecAPIGateway';
describe('SecAPIGateway', () => {
  beforeEach(() => {
    (global as any).window = (global as any).window || {};
    (window as any).vault = (window as any).vault || { getSecret: jest.fn().mockResolvedValue('secret') };
    (window as any).database = (window as any).database || { SQLiteQuery: jest.fn(), SQLiteGet: jest.fn(), SQLiteInsert: jest.fn(), SQLiteRun: jest.fn(), SQLiteInit: jest.fn() };
    (window as any).transformers = (window as any).transformers || { runTextGeneration: jest.fn().mockResolvedValue({ generated_text: 'ok' }) };
  });

  it('exports module members', () => {
    expect(Object.keys(Module).length).toBeGreaterThan(0);
  });

  it('constructs SecAPIGateway', () => {
    const instance = new (SecAPIGateway as any)('key');
    expect(instance).toBeInstanceOf(SecAPIGateway);
  });
});
