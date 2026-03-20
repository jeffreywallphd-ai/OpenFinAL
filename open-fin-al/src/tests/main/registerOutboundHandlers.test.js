/** @jest-environment node */

const { IPC_CHANNELS } = require('../../shared/ipc/channels');
const { registerOutboundHandlers } = require('../../main/ipc/registerOutboundHandlers');

describe('registerOutboundHandlers', () => {
  it('registers outbound provider IPC handlers', async () => {
    const handlers = new Map();
    const ipcMain = {
      handle: jest.fn((channel, handler) => handlers.set(channel, handler)),
    };
    const outboundServices = {
      alphaVantage: {
        fetchMarketStatus: jest.fn().mockResolvedValue({ markets: [] }),
      },
      sec: {
        fetchJson: jest.fn().mockResolvedValue({ ok: true }),
        fetchCompanyTickers: jest.fn().mockResolvedValue({ 0: { ticker: 'AAPL' } }),
      },
    };

    registerOutboundHandlers({ ipcMain, outboundServices });

    await expect(handlers.get(IPC_CHANNELS.outbound.alphaVantage.marketStatus)(null, { apiKey: 'demo' })).resolves.toEqual({ markets: [] });
    await expect(handlers.get(IPC_CHANNELS.outbound.sec.fetchJson)(null, { url: 'https://data.sec.gov/submissions/CIK0001.json' })).resolves.toEqual({ ok: true });
    await expect(handlers.get(IPC_CHANNELS.outbound.sec.companyTickers)(null, { headers: { 'User-Agent': 'Investor user@example.com' } })).resolves.toEqual({ 0: { ticker: 'AAPL' } });
  });
});
