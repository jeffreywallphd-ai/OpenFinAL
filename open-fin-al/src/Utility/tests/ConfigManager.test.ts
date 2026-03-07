jest.mock('@Entity/MarketStatus', () => ({ MarketStatus: {} }), { virtual: true });

import ConfigUpdater from '../ConfigManager';

describe('ConfigUpdater', () => {
  let updater: ConfigUpdater;
  const getSecret = jest.fn();
  const setSecret = jest.fn();
  const exists = jest.fn();
  const save = jest.fn();
  const load = jest.fn();
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    updater = new ConfigUpdater();
    getSecret.mockReset();
    setSecret.mockReset();
    exists.mockReset();
    save.mockReset();
    load.mockReset();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    window.vault = { getSecret, setSecret };
    window.config = { exists, save, load };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete window.vault;
    delete window.config;
  });

  it('createEnvIfNotExists creates missing keys and returns true when successful', async () => {
    getSecret.mockResolvedValue(undefined);
    setSecret.mockResolvedValue(undefined);

    const created = await updater.createEnvIfNotExists();

    expect(created).toBe(true);
    expect(getSecret).toHaveBeenCalledTimes(4);
    expect(setSecret).toHaveBeenCalledTimes(4);
    expect(setSecret).toHaveBeenNthCalledWith(1, 'ALPHAVANTAGE_API_KEY', '');
    expect(setSecret).toHaveBeenNthCalledWith(2, 'FMP_API_KEY', '');
    expect(setSecret).toHaveBeenNthCalledWith(3, 'OPENAI_API_KEY', '');
    expect(setSecret).toHaveBeenNthCalledWith(4, 'HUGGINGFACE_API_KEY', '');
  });

  it('createEnvIfNotExists skips existing keys and marks false when setSecret throws', async () => {
    getSecret
      .mockResolvedValueOnce('exists')
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);
    setSecret
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('cannot store'))
      .mockResolvedValueOnce(undefined);

    const created = await updater.createEnvIfNotExists();

    expect(created).toBe(false);
    expect(setSecret).toHaveBeenCalledTimes(3);
  });

  it('createConfigIfNotExists creates and saves default config when missing', async () => {
    exists.mockResolvedValue(false);
    save.mockResolvedValue('saved');

    const result = await updater.createConfigIfNotExists();

    expect(result).toBe('saved');
    expect(save).toHaveBeenCalledTimes(1);
    const payload = save.mock.calls[0][0];
    expect(payload.DarkMode).toBe(false);
    expect(payload.ChatbotModelSettings.ChatbotModelName).toBe('gpt-4');
    expect(payload.NewsSummaryModelSettings.NewsSummaryModelTopP).toBe(0.2);
  });

  it('createConfigIfNotExists returns true when config already exists', async () => {
    exists.mockResolvedValue(true);

    const result = await updater.createConfigIfNotExists();

    expect(result).toBe(true);
    expect(save).not.toHaveBeenCalled();
  });

  it('createConfigIfNotExists logs and returns false when config interactions throw', async () => {
    exists.mockRejectedValue(new Error('io'));

    const result = await updater.createConfigIfNotExists();

    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unable to save the configuration file: ', expect.any(Error));
  });

  it('saveConfig returns true when save call succeeds', async () => {
    save.mockReturnValue(undefined);

    const result = await updater.saveConfig({ DarkMode: true });

    expect(save).toHaveBeenCalledWith({ DarkMode: true });
    expect(result).toBe(true);
  });

  it('saveConfig logs and returns false when save throws', async () => {
    save.mockImplementation(() => {
      throw new Error('failed write');
    });

    const result = await updater.saveConfig({});

    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unable to save the configuration file: ', expect.any(Error));
  });

  it('getSecret delegates to vault.getSecret', async () => {
    getSecret.mockResolvedValue('value');

    const value = await updater.getSecret('OPENAI_API_KEY');

    expect(getSecret).toHaveBeenCalledWith('OPENAI_API_KEY');
    expect(value).toBe('value');
  });

  it('setSecret delegates to vault.setSecret', async () => {
    setSecret.mockResolvedValue(undefined);

    await updater.setSecret('OPENAI_API_KEY', 'new-value');

    expect(setSecret).toHaveBeenCalledWith('OPENAI_API_KEY', 'new-value');
  });

  it('getConfig returns loaded config when available', async () => {
    load.mockReturnValue({ DarkMode: true });

    const config = await updater.getConfig();

    expect(config).toEqual({ DarkMode: true });
  });

  it('getConfig logs and returns null when config load is falsy', async () => {
    load.mockReturnValue(null);

    const config = await updater.getConfig();

    expect(config).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unable to load the configuration file: ', expect.any(Error));
  });

  it('getConfig logs and returns null when config load throws', async () => {
    load.mockImplementation(() => {
      throw new Error('boom');
    });

    const config = await updater.getConfig();

    expect(config).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unable to load the configuration file: ', expect.any(Error));
  });
});
