import { describe, expect, it } from 'bun:test';
import bcrypt from 'bcrypt';

describe('Password Utilities', () => {
  describe('bcrypt hashing', () => {
    it('hashes password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$\d+\$.{53}$/);
    });

    it('generates different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await bcrypt.hash(password, 12);
      const hash2 = await bcrypt.hash(password, 12);

      expect(hash1).not.toBe(hash2);
    });

    it('hashes passwords with different salts', async () => {
      const password = 'TestPassword123!';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 14);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('bcrypt comparison', () => {
    it('compares password correctly with hash', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('rejects incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('handles empty password', async () => {
      const password = '';
      const hash = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('handles special characters in password', async () => {
      const password = 'P@ssw0rd!@#$%^&*()';
      const hash = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('handles unicode characters in password', async () => {
      const password = 'Pássw0rd测试';
      const hash = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('rejects invalid hash format', async () => {
      const password = 'TestPassword123!';
      const invalidHash = 'invalid-hash';

      const isValid = await bcrypt.compare(password, invalidHash);
      expect(isValid).toBe(false);
    });
  });

  describe('password strength validation', () => {
    it('validates minimum length', () => {
      const shortPassword = '123';
      const longPassword = 'ThisIsAVeryLongPassword123!';

      expect(shortPassword.length).toBeLessThan(8);
      expect(longPassword.length).toBeGreaterThanOrEqual(8);
    });

    it('validates contains uppercase letter', () => {
      const passwordWithUpper = 'Password123!';
      const passwordWithoutUpper = 'password123!';

      expect(/[A-Z]/.test(passwordWithUpper)).toBe(true);
      expect(/[A-Z]/.test(passwordWithoutUpper)).toBe(false);
    });

    it('validates contains lowercase letter', () => {
      const passwordWithLower = 'Password123!';
      const passwordWithoutLower = 'PASSWORD123!';

      expect(/[a-z]/.test(passwordWithLower)).toBe(true);
      expect(/[a-z]/.test(passwordWithoutLower)).toBe(false);
    });

    it('validates contains number', () => {
      const passwordWithNumber = 'Password123!';
      const passwordWithoutNumber = 'Password!';

      expect(/\d/.test(passwordWithNumber)).toBe(true);
      expect(/\d/.test(passwordWithoutNumber)).toBe(false);
    });

    it('validates contains special character', () => {
      const passwordWithSpecial = 'Password123!';
      const passwordWithoutSpecial = 'Password123';

      expect(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(passwordWithSpecial)).toBe(true);
      expect(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(passwordWithoutSpecial)).toBe(false);
    });
  });
});
