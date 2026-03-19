function createConfigService({ app, fs, path, os, logger = console }) {
  const configFileName = 'default.config.json';
  const configPath = path.join(app.getPath('userData'), configFileName);

  function ensureUserDataDirectory() {
    app.setPath('userData', path.join(app.getPath('appData'), 'OpenFinAL'));

    if (!fs.existsSync(app.getPath('userData'))) {
      fs.mkdirSync(app.getPath('userData'), { recursive: true });
    }
  }

  function getUsername() {
    try {
      const userInfo = os.userInfo();
      return userInfo.username;
    } catch (_error) {
      return 'Guest';
    }
  }

  function getAppPath() {
    return app.getAppPath('userData');
  }

  function getAssetPath() {
    const isDev = !app.isPackaged;

    return isDev
      ? path.join(__dirname, '../renderer/Asset/Slideshows')
      : path.join(process.resourcesPath, 'Asset/Slideshows');
  }

  function saveConfig(config) {
    try {
      fs.openSync(configPath, 'w');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
      return true;
    } catch (error) {
      logger.error('Error saving config:', error);
      return false;
    }
  }

  function hasConfig() {
    try {
      if (fs.existsSync(configPath)) {
        return true;
      }

      throw new Error('The config file does not exist');
    } catch (_error) {
      return false;
    }
  }

  function loadConfig() {
    try {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error loading config:', error);
      return false;
    }
  }

  return {
    configPath,
    ensureUserDataDirectory,
    getAppPath,
    getAssetPath,
    getUsername,
    hasConfig,
    loadConfig,
    saveConfig,
  };
}

module.exports = {
  createConfigService,
};
