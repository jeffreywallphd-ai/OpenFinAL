/** @jest-environment node */

const { buildAxiosRequestConfig } = require('../../main/services/proxyServer');

describe('buildAxiosRequestConfig', () => {
  it('builds GET requests from API endpoint parts', () => {
    expect(buildAxiosRequestConfig({
      protocol: 'https:',
      hostname: 'example.com',
      pathname: '/news',
      search: '?page=1',
      headers: { Accept: 'application/json' },
    })).toEqual({
      method: 'get',
      url: 'https://example.com/news?page=1',
      headers: { Accept: 'application/json' },
    });
  });

  it('builds POST requests against the proxied target url', () => {
    expect(buildAxiosRequestConfig({
      method: 'POST',
      targetUrl: 'https://api.example.com/items',
      body: { id: 1 },
      headers: { Authorization: 'Bearer token' },
    })).toEqual({
      method: 'post',
      url: 'https://api.example.com/items',
      data: { id: 1 },
      headers: { Authorization: 'Bearer token' },
    });
  });
});
