const os = require('os');
const path = require('path');
const fs = require('fs');

const testUserDataPath = path.join(os.tmpdir(), `openfinal-tests-${Date.now()}`);
fs.mkdirSync(testUserDataPath, { recursive: true });

const mockApp = {
  quit: jest.fn(),
  getPath: jest.fn((name) => (name === 'appData' || name === 'userData' ? testUserDataPath : testUserDataPath)),
  setPath: jest.fn(),
  getAppPath: jest.fn(() => '/mock/app/path'),
  isPackaged: false,
  whenReady: jest.fn(() => ({ then: jest.fn() })),
  on: jest.fn(),
  removeAllListeners: jest.fn()
};

const mockBrowserWindow = jest.fn(() => ({
  maximize: jest.fn(),
  show: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
  loadURL: jest.fn(),
  webContents: {
    setWindowOpenHandler: jest.fn(),
    once: jest.fn(),
    executeJavaScript: jest.fn()
  }
}));
mockBrowserWindow.getAllWindows = jest.fn(() => []);

const mockIpcMain = {
  handle: jest.fn(),
  on: jest.fn()
};

jest.mock('electron', () => ({
  app: mockApp,
  BrowserWindow: mockBrowserWindow,
  shell: { openExternal: jest.fn() },
  session: { defaultSession: { webRequest: { onHeadersReceived: jest.fn() } } },
  ipcMain: mockIpcMain
}));

jest.mock('electron-squirrel-startup', () => false);
jest.mock('sqlite3', () => ({ verbose: jest.fn(() => ({ Database: jest.fn() })) }));
jest.mock('better-sqlite3', () => jest.fn());
jest.mock('puppeteer', () => ({ launch: jest.fn() }));
jest.mock('keytar', () => ({ getPassword: jest.fn(), setPassword: jest.fn() }));
jest.mock('express', () => {
  const use = jest.fn();
  const all = jest.fn();
  const listen = jest.fn();
  const expressApp = { use, all, listen };
  const expressFn = jest.fn(() => expressApp);
  expressFn.json = jest.fn(() => 'json-middleware');
  return expressFn;
});
jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('cors', () => jest.fn(() => 'cors-middleware'));

const mockConnect = jest.fn();
jest.mock('tls', () => ({ connect: (...args) => mockConnect(...args) }));

const mockPipeline = jest.fn(() => Promise.resolve(jest.fn()));
const envMock = {};
jest.mock('@xenova/transformers', () => ({ pipeline: (...args) => mockPipeline(...args), env: envMock }));

jest.mock('../Database/MigrationManager', () => ({
  MigrationManager: jest.fn().mockImplementation(() => ({ runMigrations: jest.fn().mockResolvedValue(undefined) }))
}));

const keytar = require('keytar');
const { MigrationManager } = require('../Database/MigrationManager');

const { __testables } = require('../main');

describe('main.js utility functions', () => {
  afterEach(() => {
    jest.clearAllMocks();
    __testables.__setDbForTests(null);
    __testables.__setBetterDbForTests(null);
    __testables.__setYFForTests(null);
    __testables.__resetPipelineForTests();
  });

  it('returns false for handleSquirrelEvent when no squirrel args are present', () => {
    const originalArgv = process.argv;
    process.argv = ['node'];

    const result = __testables.handleSquirrelEvent();

    expect(result).toBe(false);
    expect(mockApp.quit).not.toHaveBeenCalled();
    process.argv = originalArgv;
  });

  it('handles squirrel uninstall by deleting app data and quitting', () => {
    const uninstallPath = path.join(testUserDataPath, 'OpenFinAL');
    fs.mkdirSync(uninstallPath, { recursive: true });
    fs.writeFileSync(path.join(uninstallPath, 'temp.txt'), 'tmp');

    const originalArgv = process.argv;
    process.argv = ['node', '--squirrel-uninstall'];

    const result = __testables.handleSquirrelEvent();

    expect(result).toBe(true);
    expect(fs.existsSync(uninstallPath)).toBe(false);
    expect(mockApp.quit).toHaveBeenCalled();
    process.argv = originalArgv;
  });

  it('recursively deletes nested folders', () => {
    const root = path.join(testUserDataPath, 'nested');
    const child = path.join(root, 'child');
    fs.mkdirSync(child, { recursive: true });
    fs.writeFileSync(path.join(child, 'file.txt'), 'data');

    __testables.deleteFolderRecursiveSync(root);

    expect(fs.existsSync(root)).toBe(false);
  });

  it('returns Guest when os.userInfo throws', () => {
    const userInfoSpy = jest.spyOn(os, 'userInfo').mockImplementation(() => {
      throw new Error('boom');
    });

    expect(__testables.getUsername()).toBe('Guest');
    userInfoSpy.mockRestore();
  });

  it('runs migrations only when betterDb is set', async () => {
    await __testables.runMigrations();
    expect(MigrationManager).not.toHaveBeenCalled();

    __testables.__setBetterDbForTests({});
    await __testables.runMigrations();

    expect(MigrationManager).toHaveBeenCalledTimes(1);
    const instance = MigrationManager.mock.results[0].value;
    expect(instance.runMigrations).toHaveBeenCalledTimes(1);
  });

  it('refreshes certificate when fingerprint changes', async () => {
    const fakeFingerprint = 'abc123';
    const requestSocket = { destroy: jest.fn(), on: jest.fn() };
    mockConnect.mockImplementation((_opts, _cb) => requestSocket);
    requestSocket.on.mockImplementation((event, handler) => {
      if (event === 'secureConnect') {
        requestSocket.getPeerCertificate = jest.fn(() => ({ raw: Buffer.from('cert') }));
        handler();
      }
    });

    keytar.getPassword.mockResolvedValue('different');
    keytar.setPassword.mockResolvedValue(undefined);

    const result = await __testables.refreshCertificateFingerprint('example.com');

    expect(result).toBe(true);
    expect(keytar.setPassword).toHaveBeenCalledWith('OpenFinALCert', 'example.com', expect.any(String));
  });

  it('gets and sets keytar secrets', async () => {
    keytar.getPassword.mockResolvedValue('secret-value');
    keytar.setPassword.mockResolvedValue(undefined);

    await expect(__testables.getSecret('api')).resolves.toBe('secret-value');
    await expect(__testables.setSecret('api', 'new-secret')).resolves.toBe(true);
  });

  it('creates transformer pipelines for requested models', async () => {
    const p1 = await __testables.getPipeline('model-1');
    const p2 = await __testables.getPipeline('model-1');
    const p3 = await __testables.getPipeline('model-2');

    expect(typeof p1).toBe('function');
    expect(typeof p2).toBe('function');
    expect(typeof p3).toBe('function');
    expect(mockPipeline).toHaveBeenCalledTimes(3);
  });

  it('delegates yahoo methods to yahoo client', async () => {
    const yahooClient = {
      chart: jest.fn().mockResolvedValue({ ok: 'chart' }),
      search: jest.fn().mockResolvedValue({ ok: 'search' }),
      historical: jest.fn().mockResolvedValue({ ok: 'historical' })
    };
    __testables.__setYFForTests(Promise.resolve(yahooClient));

    await expect(__testables.yahooChart('AAPL', {})).resolves.toEqual({ ok: 'chart' });
    await expect(__testables.yahooSearch('apple', {})).resolves.toEqual({ ok: 'search' });
    await expect(__testables.yahooHistorical('AAPL', {})).resolves.toEqual({ ok: 'historical' });
  });

  it('saves, checks, and loads config', () => {
    const config = { theme: 'dark', version: 1 };

    expect(__testables.saveConfig(config)).toBe(true);
    expect(__testables.hasConfig()).toBe(true);
    expect(__testables.loadConfig()).toEqual(config);
  });

  it('returns false when loading config from invalid JSON', () => {
    const configFile = path.join(testUserDataPath, 'default.config.json');
    fs.writeFileSync(configFile, 'not-json', 'utf8');

    expect(__testables.loadConfig()).toBe(false);
  });

  it('reads text and binary files', async () => {
    const file = path.join(testUserDataPath, 'read-file.txt');
    const bin = path.join(testUserDataPath, 'read-file.bin');
    fs.writeFileSync(file, 'hello world', 'utf8');
    fs.writeFileSync(bin, Buffer.from([0, 1, 2]));

    await expect(__testables.readFromFile(file)).resolves.toBe('hello world');
    await expect(__testables.readFromFileBinary(bin)).resolves.toEqual(Buffer.from([0, 1, 2]));
  });

  it('runs sqlite wrappers and handles insert lastID', async () => {
    const fakeDb = {
      all: jest.fn((_query, _params, cb) => cb(null, [{ id: 1 }])),
      get: jest.fn((_query, _params, cb) => cb(null, { id: 1 })),
      run: jest.fn(function (query, _params, cb) {
        cb.call({ lastID: 42 }, null);
      }),
      exec: jest.fn()
    };

    __testables.__setDbForTests(fakeDb);

    await expect(__testables.selectFromDatabase('select 1', [])).resolves.toEqual([{ id: 1 }]);
    await expect(__testables.sqliteQuery('select 1', [])).resolves.toEqual([{ id: 1 }]);
    await expect(__testables.sqliteGet('select 1', [])).resolves.toEqual({ id: 1 });
    await expect(__testables.sqliteRun('INSERT INTO a VALUES (?)', [1])).resolves.toEqual({ ok: true, lastID: 42 });
    await expect(__testables.sqliteRun('UPDATE a SET b=?', [1])).resolves.toBe(true);

    expect(fakeDb.exec).not.toHaveBeenCalled();
  });

  it('initializes database schema when db exists', async () => {
    const fakeDb = { exec: jest.fn() };
    __testables.__setDbForTests(fakeDb);

    await expect(__testables.initDatabase('CREATE TABLE sample(id INTEGER);')).resolves.toBe(true);
    expect(fakeDb.exec).toHaveBeenCalledWith('CREATE TABLE sample(id INTEGER);');
  });
});
