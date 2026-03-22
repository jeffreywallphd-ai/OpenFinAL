jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import { APIEndpoint } from '../APIEndpoint';

describe('APIEndpoint', () => {
  const fullRequest = {
    request: {
      endpoint: {
        protocol: 'https',
        hostname: 'example.com',
        id: 'endpoint-1',
        key: 'k',
        method: 'POST',
        port: '443',
        pathname: '/v1',
        search: '?a=1',
        searchParams: { a: '1' },
        headers: { h: 'v' },
        body: { ok: true },
        certLastModified: '2024-01-01',
        certAuthHostname: 'cert.example.com',
        certAuthHeaders: { auth: 'x' },
      },
    },
  } as any;

  it('initializes defaults', () => {
    const entity = new APIEndpoint();
    expect(entity.getFieldValue('method')).toBe('GET');
    expect(entity.getFieldValue('protocol')).toBe('https');
  });

  it('throws when required protocol or hostname are missing', () => {
    const entity = new APIEndpoint();
    expect(() => entity.fillWithRequest({ request: { request: { endpoint: { hostname: 'x' } } } } as any)).toThrow(
      'The URL protocol is required for this entity.',
    );
    expect(() => entity.fillWithRequest({ request: { request: { endpoint: { protocol: 'https' } } } } as any)).toThrow(
      'The URL hostname is required for this entity.',
    );
  });

  it('fills all known fields and serializes to object', () => {
    const entity = new APIEndpoint();
    entity.fillWithRequest({ request: { request: fullRequest.request } } as any);
    expect(entity.getFieldValue('id')).toBe('endpoint-1');
    expect(entity.getFieldValue('certAuthHostname')).toBe('cert.example.com');
    expect(entity.toObject()).toMatchObject(fullRequest.request.endpoint);
  });

  it('uses generated id and hostname fallback for certAuthHostname', () => {
    const entity = new APIEndpoint();
    entity.fillWithRequest({ request: { request: { endpoint: { protocol: 'https', hostname: 'openfinal.ai' } } } } as any);
    expect(entity.getId()).toBe('mock-uuid');
    expect(entity.getFieldValue('certAuthHostname')).toBe('openfinal.ai');
  });

  it('rejects unknown field and has unimplemented fillWithResponse', () => {
    const entity = new APIEndpoint();
    expect(() => entity.setFieldValue('unknown', 1)).toThrow('The requested data property does not exist.');
    expect(() => entity.fillWithResponse({} as any)).toThrow('Method not implemented.');
  });
});
