/** @jest-environment node */

const { createFileService } = require('../../main/services/fileService');

describe('createFileService', () => {
  it('reads text files as utf8', async () => {
    const service = createFileService({
      fs: {
        readFile: jest.fn((file, encoding, callback) => callback(null, `${file}:${encoding}`)),
      },
    });

    await expect(service.readFromFile('demo.txt')).resolves.toBe('demo.txt:utf8');
  });

  it('reads binary files without forcing an encoding', async () => {
    const buffer = Buffer.from('abc');
    const service = createFileService({
      fs: {
        readFile: jest.fn((file, callback) => callback(null, buffer)),
      },
    });

    await expect(service.readFromFileBinary('demo.bin')).resolves.toBe(buffer);
  });
});
