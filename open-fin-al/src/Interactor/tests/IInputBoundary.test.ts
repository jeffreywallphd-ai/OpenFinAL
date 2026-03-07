import type { IInputBoundary } from '../IInputBoundary';

describe('IInputBoundary', () => {
  it('is usable as a type contract', () => {
    const mockBoundary: IInputBoundary = {
      requestModel: {} as any,
      responseModel: {} as any,
      post: async () => ({ } as any),
      get: async () => ({ } as any),
      put: async () => ({ } as any),
      delete: async () => ({ } as any),
    };
    expect(typeof mockBoundary.get).toBe('function');
  });
});
