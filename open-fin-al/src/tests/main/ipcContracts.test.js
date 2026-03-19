/** @jest-environment node */

const { IPC_CHANNELS } = require('../../IPC/channels');
const {
  invokeContract,
  ipcContracts,
  registerHandle,
  registerListener,
  sendContract,
} = require('../../IPC/contracts');

describe('IPC contracts', () => {
  it('serializes preload invocations with shared channels', async () => {
    const invoke = jest.fn().mockResolvedValue('ok');
    const send = jest.fn();
    const ipcRenderer = { invoke, send };

    await expect(invokeContract(ipcRenderer, ipcContracts.vault.setSecret, 'API_KEY', 'secret')).resolves.toBe('ok');
    sendContract(ipcRenderer, ipcContracts.urlWindow.open, 'https://example.com');

    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.vault.setSecret, {
      key: 'API_KEY',
      value: 'secret',
    });
    expect(send).toHaveBeenCalledWith(IPC_CHANNELS.urlWindow.open, {
      url: 'https://example.com',
    });
  });

  it('validates and normalizes invoke handlers before calling services', async () => {
    const handles = new Map();
    const ipcMain = {
      handle: jest.fn((channel, handler) => handles.set(channel, handler)),
    };
    const service = {
      queryAll: jest.fn().mockResolvedValue([{ id: 1 }]),
    };

    registerHandle(ipcMain, ipcContracts.database.sqliteQuery, ({ query, parameters }) => service.queryAll(query, parameters));

    await expect(handles.get(IPC_CHANNELS.database.sqliteQuery)(null, {
      query: 'SELECT * FROM Example WHERE id = ?',
      parameters: [1],
    })).resolves.toEqual([{ id: 1 }]);
    expect(() => handles.get(IPC_CHANNELS.database.sqliteQuery)(null, {
      query: '',
      parameters: [1],
    })).toThrow('sqliteQueryRequest.query must be a non-empty string');
  });

  it('validates listener payloads before opening windows', () => {
    const listeners = new Map();
    const ipcMain = {
      on: jest.fn((channel, handler) => listeners.set(channel, handler)),
    };
    const openWindow = jest.fn();

    registerListener(ipcMain, ipcContracts.urlWindow.open, ({ url }) => openWindow(url));

    listeners.get(IPC_CHANNELS.urlWindow.open)(null, { url: 'https://example.com' });
    expect(openWindow).toHaveBeenCalledWith('https://example.com');
    expect(() => listeners.get(IPC_CHANNELS.urlWindow.open)(null, { url: '' })).toThrow(
      'openUrlWindowRequest.url must be a non-empty string',
    );
  });
});
