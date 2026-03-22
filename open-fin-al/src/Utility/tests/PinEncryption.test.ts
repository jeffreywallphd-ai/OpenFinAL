import { PinEncryption } from '../PinEncryption';

describe('PinEncryption (Utility/tests)', () => {
  describe('validatePinFormat', () => {
    it('accepts only exactly 8 numeric digits', () => {
      expect(PinEncryption.validatePinFormat('12345678')).toBe(true);
      expect(PinEncryption.validatePinFormat('00000000')).toBe(true);
      expect(PinEncryption.validatePinFormat('1234567')).toBe(false);
      expect(PinEncryption.validatePinFormat('123456789')).toBe(false);
      expect(PinEncryption.validatePinFormat('1234abcd')).toBe(false);
    });
  });

  describe('hashPin and verifyPin', () => {
    it('hashes a valid pin into salt:hash format', async () => {
      const hash = await PinEncryption.hashPin('12345678');
      const [salt, body] = hash.split(':');

      expect(hash).toContain(':');
      expect(salt).toHaveLength(32);
      expect(body).toHaveLength(128);
    });

    it('throws for invalid pin format in hashPin', async () => {
      await expect(PinEncryption.hashPin('1234')).rejects.toThrow('PIN must be exactly 8 digits');
    });

    it('verifies valid pin and rejects invalid or malformed inputs', async () => {
      const pin = '24681357';
      const hash = await PinEncryption.hashPin(pin);

      await expect(PinEncryption.verifyPin(pin, hash)).resolves.toBe(true);
      await expect(PinEncryption.verifyPin('11112222', hash)).resolves.toBe(false);
      await expect(PinEncryption.verifyPin('bad', hash)).resolves.toBe(false);
      await expect(PinEncryption.verifyPin(pin, 'malformed')).resolves.toBe(false);
      await expect(PinEncryption.verifyPin(pin, ':hash')).resolves.toBe(false);
      await expect(PinEncryption.verifyPin(pin, 'salt:')).resolves.toBe(false);
    });

    it('returns false when internal hashing errors during verifyPin', async () => {
      const spy = jest.spyOn(PinEncryption as any, 'pbkdf2Hash').mockRejectedValue(new Error('crypto fail'));

      await expect(PinEncryption.verifyPin('12345678', 'ab'.repeat(16) + ':' + 'cd'.repeat(64))).resolves.toBe(false);

      spy.mockRestore();
    });
  });

  describe('random generation and internal helpers', () => {
    it('generateRandomPin always returns 8 numeric digits in valid range', () => {
      for (let i = 0; i < 20; i++) {
        const pin = PinEncryption.generateRandomPin();
        expect(pin).toMatch(/^[0-9]{8}$/);
        expect(Number(pin)).toBeGreaterThanOrEqual(10000000);
        expect(Number(pin)).toBeLessThanOrEqual(99999999);
      }
    });

    it('timingSafeEqual correctly compares equal and different strings', () => {
      const timingSafeEqual = (PinEncryption as any).timingSafeEqual;
      expect(timingSafeEqual('abc', 'abc')).toBe(true);
      expect(timingSafeEqual('abc', 'abd')).toBe(false);
      expect(timingSafeEqual('abc', 'ab')).toBe(false);
    });

    it('simpleHash returns deterministic 64-byte-hex-equivalent output string', () => {
      const simpleHash = (PinEncryption as any).simpleHash;
      const hashA = simpleHash('input-value');
      const hashB = simpleHash('input-value');
      const hashC = simpleHash('other-value');

      expect(hashA).toBe(hashB);
      expect(hashA).not.toBe(hashC);
      expect(hashA).toHaveLength(64);
      expect(hashA).toMatch(/^[0-9a-f]+$/);
    });
  });
});
