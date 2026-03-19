const { createProviderError } = require('../providerErrors');

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

function createAlphaVantageAdapter({ axios }) {
  function buildUrl(query) {
    const url = new URL(ALPHA_VANTAGE_BASE_URL);

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  async function fetchMarketStatus(apiKey) {
    if (!apiKey) {
      throw createProviderError('Alpha Vantage market status requests require an API key.', {
        code: 'INVALID_ALPHA_VANTAGE_REQUEST',
        statusCode: 400,
      });
    }

    const response = await axios({
      method: 'get',
      url: buildUrl({
        function: 'MARKET_STATUS',
        apikey: apiKey,
      }),
    });

    return response.data;
  }

  return {
    buildUrl,
    fetchMarketStatus,
  };
}

module.exports = {
  ALPHA_VANTAGE_BASE_URL,
  createAlphaVantageAdapter,
};
