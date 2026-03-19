const OPEN_FINAL_CERT_SERVICE = 'OpenFinALCert';

function createCertificateService({ keytar, tls, crypto, logger = console }) {
  async function getCertificateFingerprint(request) {
    try {
      const options = {
        host: request.certAuthHostname,
        port: 443,
        servername: request.certAuthHostname,
      };

      return await new Promise((resolve, reject) => {
        const socket = tls.connect(options, () => {});

        socket.on('secureConnect', () => {
          const cert = socket.getPeerCertificate(true);

          if (!cert) {
            logger.error(`No certificate found for ${request.hostname}`);
            resolve(null);
            return;
          }

          const fingerprint = crypto.createHash('sha256').update(cert.raw).digest('hex');
          socket.destroy();
          resolve(fingerprint);
        });

        socket.on('error', (error) => {
          logger.error(`Error connecting to ${request.hostname}:`, error);
          reject(error);
        });
      });
    } catch (error) {
      logger.error(`Error getting certificate fingerprint for ${request.hostname}:`, error);
      return null;
    }
  }

  async function getStoredFingerprint(hostname) {
    return keytar.getPassword(OPEN_FINAL_CERT_SERVICE, hostname);
  }

  async function setStoredFingerprint(hostname, fingerprint) {
    return keytar.setPassword(OPEN_FINAL_CERT_SERVICE, hostname, fingerprint);
  }

  async function ensureStoredFingerprint(request) {
    const hostname = request.certAuthHostname;

    if (!hostname) {
      return null;
    }

    let storedFingerprint = await getStoredFingerprint(hostname);

    if (!storedFingerprint) {
      storedFingerprint = await getCertificateFingerprint(request);

      if (storedFingerprint) {
        await setStoredFingerprint(hostname, storedFingerprint);
      }
    }

    return storedFingerprint;
  }

  async function refreshCertificateFingerprint(hostname) {
    try {
      const fingerprint = await getCertificateFingerprint({
        certAuthHostname: hostname,
        hostname,
      });

      const storedFingerprint = await getStoredFingerprint(hostname);

      if (storedFingerprint !== fingerprint) {
        await setStoredFingerprint(hostname, fingerprint);
      }

      return true;
    } catch (error) {
      logger.error(error);
      return false;
    }
  }

  return {
    ensureStoredFingerprint,
    getCertificateFingerprint,
    getStoredFingerprint,
    refreshCertificateFingerprint,
    setStoredFingerprint,
  };
}

module.exports = {
  OPEN_FINAL_CERT_SERVICE,
  createCertificateService,
};
