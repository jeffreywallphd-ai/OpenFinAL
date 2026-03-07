import * as Module from '../JSONRequest';
import { JSONRequest } from '../JSONRequest';

describe('JSONRequest', () => {
  it('exports module members', () => {
    expect(Object.keys(Module).length).toBeGreaterThan(0);
  });

  it('constructs JSONRequest from valid JSON', () => {
    const instance = new JSONRequest('{"symbol":"AAPL"}');
    expect(instance).toBeInstanceOf(JSONRequest);
    expect(instance.request).toEqual({ symbol: 'AAPL' });
  });

  it('throws for invalid JSON payloads', () => {
    expect(() => new JSONRequest('not-json')).toThrow(SyntaxError);
  });
});
