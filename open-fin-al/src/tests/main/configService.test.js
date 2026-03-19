/** @jest-environment node */

const path = require('path');
const { createConfigService } = require('../../main/services/configService');

describe('createConfigService', () => {
  const userDataPath = '/tmp/OpenFinAL';
  const appDataPath = '/tmp';

  function createApp(overrides = {}) {
    return {
      isPackaged: false,
      getAppPath: jest.fn(() => '/app/root'),
      getPath: jest.fn((name) => {
        if (name === 'userData') {
          return userDataPath;
        }

        if (name === 'appData') {
          return appDataPath;
        }

        throw new Error(`Unexpected path lookup: ${name}`);
      }),
      setPath: jest.fn(),
      ...overrides,
    };
  }

  it('creates the userData directory when missing', () => {
    const app = createApp();
    const fs = {
      existsSync: jest.fn(() => false),
      mkdirSync: jest.fn(),
    };

    const service = createConfigService({
      app,
      fs,
      path,
      os: { userInfo: jest.fn() },
    });

    service.ensureUserDataDirectory();

    expect(app.setPath).toHaveBeenCalledWith('userData', path.join(appDataPath, 'OpenFinAL'));
    expect(fs.mkdirSync).toHaveBeenCalledWith(userDataPath, { recursive: true });
  });

  it('saves and loads config using the resolved config path', () => {
    const app = createApp();
    const writeFileSync = jest.fn();
    const readFileSync = jest.fn(() => JSON.stringify({ theme: 'dark' }));
    const fs = {
      openSync: jest.fn(),
      writeFileSync,
      readFileSync,
      existsSync: jest.fn(() => true),
      mkdirSync: jest.fn(),
    };

    const service = createConfigService({
      app,
      fs,
      path,
      os: { userInfo: jest.fn(() => ({ username: 'alice' })) },
    });

    expect(service.saveConfig({ theme: 'dark' })).toBe(true);
    expect(writeFileSync).toHaveBeenCalledWith(
      path.join(userDataPath, 'default.config.json'),
      JSON.stringify({ theme: 'dark' }, null, 4),
    );
    expect(service.hasConfig()).toBe(true);
    expect(service.loadConfig()).toEqual({ theme: 'dark' });
    expect(service.getUsername()).toBe('alice');
  });
});
