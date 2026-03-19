const crypto = require('crypto');

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

  const fingerprint = crypto.createHash('sha256').update(cert.raw).digest('hex');

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

module.exports = {
  validatePeerCertificate,
};
