import { EnvVariableExtractor } from '../EnvVariableExtractor';

describe('EnvVariableExtractor', () => {
  let extractor: EnvVariableExtractor;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    extractor = new EnvVariableExtractor();
    fetchMock = jest.fn();
    // @ts-ignore
    global.fetch = fetchMock;
  });

  afterEach(() => {
    // @ts-ignore
    delete global.fetch;
  });

  it('extractAll fetches .env file and parses json', async () => {
    fetchMock.mockResolvedValue({
      text: jest.fn().mockResolvedValue('{"A":"1","B":"2"}'),
    });

    const result = await extractor.extractAll();

    expect(fetchMock).toHaveBeenCalledWith('../.env');
    expect(result).toEqual({ A: '1', B: '2' });
  });

  it('extract returns specific value for provided variable key', async () => {
    fetchMock.mockResolvedValue({
      text: jest.fn().mockResolvedValue('{"API_KEY":"secret","MODE":"dev"}'),
    });

    const result = await extractor.extract('API_KEY');

    expect(fetchMock).toHaveBeenCalledWith('../.env');
    expect(result).toBe('secret');
  });

  it('extract returns undefined for missing variable', async () => {
    fetchMock.mockResolvedValue({
      text: jest.fn().mockResolvedValue('{"API_KEY":"secret"}'),
    });

    const result = await extractor.extract('NOT_SET');

    expect(result).toBeUndefined();
  });

  it('propagates parsing errors when .env content is not valid json', async () => {
    fetchMock.mockResolvedValue({
      text: jest.fn().mockResolvedValue('not-json'),
    });

    await expect(extractor.extractAll()).rejects.toThrow(SyntaxError);
    await expect(extractor.extract('API_KEY')).rejects.toThrow(SyntaxError);
  });
});
