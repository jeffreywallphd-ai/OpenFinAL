/** @jest-environment node */

const { createSecAdapter } = require('../../../../main/services/outbound/providers/secAdapter');

describe('createSecAdapter', () => {
  it('validates the peer certificate before returning SEC data', async () => {
    const raw = Buffer.from('test-cert');
    const axios = jest.fn().mockResolvedValue({
      data: { cik: '0000123456' },
      request: {
        socket: {
          getPeerCertificate: jest.fn().mockReturnValue({ raw }),
        },
      },
    });
    const certificateService = {
      ensureStoredFingerprint: jest.fn().mockResolvedValue(
        require('crypto').createHash('sha256').update(raw).digest('hex'),
      ),
    };
    const adapter = createSecAdapter({ axios, certificateService, logger: { error: jest.fn() } });

    await expect(adapter.fetchJson({
      url: 'https://data.sec.gov/submissions/CIK0000123456.json',
      headers: { 'User-Agent': 'Investor user@example.com' },
    })).resolves.toEqual({ cik: '0000123456' });

    expect(certificateService.ensureStoredFingerprint).toHaveBeenCalledWith({
      certAuthHostname: 'data.sec.gov',
      hostname: 'data.sec.gov',
    });
  });

  it('rejects unsupported hosts', async () => {
    const adapter = createSecAdapter({
      axios: jest.fn(),
      certificateService: { ensureStoredFingerprint: jest.fn() },
      logger: { error: jest.fn() },
    });

    await expect(adapter.fetchJson({
      url: 'https://example.com/submissions/CIK0000123456.json',
    })).rejects.toMatchObject({
      code: 'INVALID_SEC_REQUEST',
      statusCode: 400,
    });
  });
});
