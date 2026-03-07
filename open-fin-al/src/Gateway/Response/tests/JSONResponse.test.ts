import * as Module from '../JSONResponse';
import { JSONResponse } from '../JSONResponse';

describe('JSONResponse', () => {
  it('exports module members', () => {
    expect(Object.keys(Module).length).toBeGreaterThan(0);
  });

  it('constructs JSONResponse from valid JSON', () => {
    const instance = new JSONResponse('{"response":{"ok":true}}');
    expect(instance).toBeInstanceOf(JSONResponse);
    expect(instance.response).toEqual({ response: { ok: true } });
  });

  it('toString serializes response data', () => {
    const instance = new JSONResponse();
    expect(instance.toString()).toContain('response');
  });

  it('throws for invalid JSON payloads', () => {
    expect(() => new JSONResponse('not-json')).toThrow(SyntaxError);
  });
});
