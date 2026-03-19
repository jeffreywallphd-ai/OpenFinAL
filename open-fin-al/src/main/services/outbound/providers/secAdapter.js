const { validatePeerCertificate } = require('../certificateValidation');
const { createProviderError } = require('../providerErrors');

const SEC_ALLOWED_HOSTS = new Set([
  'data.sec.gov',
  'www.sec.gov',
]);

function createSecAdapter({ axios, certificateService, logger = console }) {
  function assertSupportedUrl(url) {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'https:') {
      throw createProviderError('SEC outbound requests must use HTTPS.', {
        code: 'INVALID_SEC_REQUEST',
        statusCode: 400,
      });
    }

    if (!SEC_ALLOWED_HOSTS.has(parsedUrl.hostname)) {
      throw createProviderError(`SEC outbound adapter does not allow host ${parsedUrl.hostname}.`, {
        code: 'INVALID_SEC_REQUEST',
        statusCode: 400,
      });
    }

    return parsedUrl;
  }

  async function fetchJson({ url, headers }) {
    const parsedUrl = assertSupportedUrl(url);
    const storedFingerprint = await certificateService.ensureStoredFingerprint({
      certAuthHostname: parsedUrl.hostname,
      hostname: parsedUrl.hostname,
    });

    if (!storedFingerprint) {
      throw createProviderError('Could not retrieve certificate fingerprint', {
        code: 'SEC_CERTIFICATE_ERROR',
        statusCode: 500,
      });
    }

    try {
      const response = await axios({
        method: 'get',
        url: parsedUrl.toString(),
        headers,
        responseType: 'json',
      });

      const validation = validatePeerCertificate(response, storedFingerprint);

      if (!validation.ok) {
        throw createProviderError(validation.body.error.message, {
          code: validation.body.error.code,
          statusCode: validation.status,
          details: validation.body,
        });
      }

      return response.data;
    } catch (error) {
      if (error.isAxiosError && error.response) {
        throw createProviderError('SEC upstream request failed.', {
          code: 'SEC_UPSTREAM_ERROR',
          statusCode: error.response.status,
          details: error.response.data,
          cause: error,
        });
      }

      logger.error(error);
      throw error;
    }
  }

  async function fetchCompanyTickers(headers) {
    return fetchJson({
      url: 'https://www.sec.gov/files/company_tickers.json',
      headers,
    });
  }

  return {
    fetchCompanyTickers,
    fetchJson,
  };
}

module.exports = {
  SEC_ALLOWED_HOSTS,
  createSecAdapter,
};
