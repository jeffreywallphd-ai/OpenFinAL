function buildAxiosRequestConfig(request) {
  const baseConfig = request.headers ? { headers: request.headers } : undefined;

  if (request.method === 'POST') {
    return {
      method: 'post',
      url: request.targetUrl,
      data: request.body,
      ...baseConfig,
    };
  }

  const normalizedProtocol = String(request.protocol || 'https').replace(/:$/, '');
  const baseURL = `${normalizedProtocol}://${request.hostname}`;
  const url = new URL(baseURL);
  url.protocol = `${normalizedProtocol}:`;
  url.hostname = request.hostname;
  url.port = request.port || 443;
  url.pathname = request.pathname;
  url.search = request.search || '';

  return {
    method: 'get',
    url: url.href,
    ...baseConfig,
  };
}

function createProxyServer({ express, cors, axios, certificateService, logger = console, port = 3001 }) {
  let server;

  function validatePeerCertificate(response, storedFingerprint) {
    const cert = response.request.socket?.getPeerCertificate();

    if (!cert) {
      return {
        ok: false,
        status: 403,
        body: {
          error: {
            code: 'FORBIDDEN',
            message: 'Access to the requested resource is forbidden. Unable to retrieve the SSL/TLS certificate for validation.',
          },
        },
      };
    }

    const fingerprint = require('crypto').createHash('sha256').update(cert.raw).digest('hex');

    if (storedFingerprint !== fingerprint) {
      return {
        ok: false,
        status: 403,
        body: {
          error: {
            code: 'FORBIDDEN',
            message: 'Access to the requested resource is forbidden. The retrieve SSL/TLS certificate does not appear to be valid.',
          },
        },
      };
    }

    return { ok: true };
  }

  async function handleProxyRequest(req, res) {
    const targetUrl = req.query.url;

    if (!targetUrl) {
      return res.status(400).send('A valid URL is required');
    }

    if (!req.body) {
      return res.status(400).send('Internal express requests must include an APIEndpoint object in the request body.');
    }

    try {
      const storedFingerprint = await certificateService.ensureStoredFingerprint(req.body);

      if (req.body.certAuthHostname && !storedFingerprint) {
        return res.status(500).send('Could not retrieve certificate fingerprint');
      }

      const response = await axios(buildAxiosRequestConfig({
        ...req.body,
        targetUrl,
      }));

      if (storedFingerprint) {
        const validation = validatePeerCertificate(response, storedFingerprint);

        if (!validation.ok) {
          return res.status(validation.status).json(validation.body);
        }
      }

      return res.json(response.data);
    } catch (error) {
      if (error.isAxiosError && error.response) {
        return res.status(error.response.status).json(error.response.data);
      }

      logger.error(error);
      return res.status(500).json({ message: 'Unknown internal proxy server error' });
    }
  }

  function start() {
    if (server) {
      return server;
    }

    const expressApp = express();
    expressApp.use(cors());
    expressApp.use(express.json());
    expressApp.all('/proxy', handleProxyRequest);
    server = expressApp.listen(port);
    return server;
  }

  function stop() {
    if (!server) {
      return;
    }

    server.close();
    server = undefined;
  }

  return {
    buildAxiosRequestConfig,
    handleProxyRequest,
    start,
    stop,
    validatePeerCertificate,
  };
}

module.exports = {
  buildAxiosRequestConfig,
  createProxyServer,
};
