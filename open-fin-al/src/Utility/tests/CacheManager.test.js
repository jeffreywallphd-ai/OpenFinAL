import { CacheManager } from '../CacheManager';

describe('CacheManager', () => {
  let cacheManager;
  let readFileSync;
  let writeFileSync;
  let mkdirSync;
  let consoleErrorSpy;

  beforeEach(() => {
    readFileSync = jest.fn();
    writeFileSync = jest.fn();
    mkdirSync = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    window.fs = {
      fs: {
        readFileSync,
        writeFileSync,
        mkdirSync,
      },
    };

    cacheManager = new CacheManager();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete window.fs;
  });

  describe('extractSync', () => {
    it('reads and returns cache contents from expected path', () => {
      readFileSync.mockReturnValue('cached payload');

      const result = cacheManager.extractSync('foo/bar.json');

      expect(readFileSync).toHaveBeenCalledWith('src/Cache/foo/bar.json', 'utf-8');
      expect(result).toBe('cached payload');
    });

    it('returns null and logs when filesystem bridge is unavailable', () => {
      delete window.fs;

      const result = cacheManager.extractSync('anything.txt');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('returns null and logs when readFileSync throws', () => {
      readFileSync.mockImplementation(() => {
        throw new Error('read failed');
      });

      const result = cacheManager.extractSync('broken.txt');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error retreiving cached data:',
        expect.any(Error),
      );
    });
  });

  describe('cacheSync', () => {
    it('writes data to expected cache path and returns writeFileSync result', () => {
      writeFileSync.mockReturnValue(undefined);

      const result = cacheManager.cacheSync('foo/out.json', '{"a":1}');

      expect(writeFileSync).toHaveBeenCalledWith('src/Cache/foo/out.json', '{"a":1}');
      expect(result).toBeUndefined();
    });

    it('returns false and logs when filesystem bridge is unavailable', () => {
      window.fs = null;

      const result = cacheManager.cacheSync('x', 'y');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('returns false and logs when writeFileSync throws', () => {
      writeFileSync.mockImplementation(() => {
        throw new Error('write failed');
      });

      const result = cacheManager.cacheSync('x', 'y');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error caching data:', expect.any(Error));
    });
  });

  describe('makeDirectorySync', () => {
    it('creates directory at expected location', () => {
      cacheManager.makeDirectorySync('a/b', 'c');

      expect(mkdirSync).toHaveBeenCalledWith('src/Cache/a/b/c');
    });

    it('logs when filesystem bridge is unavailable', () => {
      window.fs = undefined;

      cacheManager.makeDirectorySync('a', 'b');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error caching data:', expect.any(Error));
    });

    it('logs when mkdirSync throws', () => {
      mkdirSync.mockImplementation(() => {
        throw new Error('mkdir failed');
      });

      cacheManager.makeDirectorySync('a', 'b');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error caching data:', expect.any(Error));
    });
  });
});
