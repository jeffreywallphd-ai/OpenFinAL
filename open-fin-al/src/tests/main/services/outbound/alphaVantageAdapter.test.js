/** @jest-environment node */

const { createAlphaVantageAdapter } = require('../../../../main/services/outbound/providers/alphaVantageAdapter');

describe('createAlphaVantageAdapter', () => {
  it('builds the expected market status request and returns response data', async () => {
    const axios = jest.fn().mockResolvedValue({
      data: { markets: [{ market_type: 'Equity' }] },
    });
    const adapter = createAlphaVantageAdapter({ axios });

    await expect(adapter.fetchMarketStatus('demo-key')).resolves.toEqual({
      markets: [{ market_type: 'Equity' }],
    });

    expect(axios).toHaveBeenCalledWith({
      method: 'get',
      url: 'https://www.alphavantage.co/query?function=MARKET_STATUS&apikey=demo-key',
    });
  });
});
