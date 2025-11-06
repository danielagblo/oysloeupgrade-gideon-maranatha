import { describe, expect, it } from 'bun:test';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-key';
const JWT_EXPIRES_IN = '1h';

interface DecodedToken {
  userId?: string;
  email?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

describe('JWT Utilities', () => {
  describe('token generation', () => {
    it('generates valid JWT token', () => {
      const payload = { userId: 'test-user-123', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('generates different tokens for different payloads', () => {
      const payload1 = { userId: 'user1', email: 'user1@example.com' };
      const payload2 = { userId: 'user2', email: 'user2@example.com' };

      const token1 = jwt.sign(payload1, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });
      const token2 = jwt.sign(payload2, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      expect(token1).not.toBe(token2);
    });

    it('generates tokens with different timestamps', async () => {
      const payload = { userId: 'test-user', email: 'test@example.com' };

      const token1 = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      await Bun.sleep(1000);

      const token2 = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      const decoded1 = jwt.decode(token1) as DecodedToken;
      const decoded2 = jwt.decode(token2) as DecodedToken;

      expect(decoded1.iat).toBeLessThan(decoded2.iat);
      expect(decoded1.exp).toBeLessThan(decoded2.exp);
    });

    it('includes expiration time in token', () => {
      const payload = { userId: 'test-user' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      const decoded = jwt.decode(token) as DecodedToken;
      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
    });
  });

  describe('token verification', () => {
    it('verifies valid token', () => {
      const payload = { userId: 'test-user-123', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

      expect(decoded.userId).toBe('test-user-123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('rejects token with wrong secret', () => {
      const payload = { userId: 'test-user' };
      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });

    it('rejects malformed token', () => {
      const malformedToken = 'not.a.valid.jwt.token';

      expect(() => {
        jwt.verify(malformedToken, JWT_SECRET);
      }).toThrow();
    });

    it('rejects empty token', () => {
      expect(() => {
        jwt.verify('', JWT_SECRET);
      }).toThrow();
    });

    it('rejects token with missing parts', () => {
      const incompleteToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

      expect(() => {
        jwt.verify(incompleteToken, JWT_SECRET);
      }).toThrow();
    });
  });

  describe('token expiry', () => {
    it('creates token with short expiry', () => {
      const payload = { userId: 'test-user' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1s' });

      const decoded = jwt.decode(token) as DecodedToken;
      const now = Math.floor(Date.now() / 1000);

      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp - now).toBeLessThanOrEqual(2);
    });

    it('creates token with long expiry', () => {
      const payload = { userId: 'test-user' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

      const decoded = jwt.decode(token) as DecodedToken;
      const now = Math.floor(Date.now() / 1000);
      const twentyFourHours = 24 * 60 * 60;

      expect(decoded.exp).toBeGreaterThan(now + twentyFourHours - 60);
      expect(decoded.exp).toBeLessThan(now + twentyFourHours + 60);
    });

    it('rejects expired token', async () => {
      const payload = { userId: 'test-user' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1ms' });

      await Bun.sleep(10);

      expect(() => {
        jwt.verify(token, JWT_SECRET);
      }).toThrow();
    });
  });

  describe('token decoding', () => {
    it('decodes token without verification', () => {
      const payload = { userId: 'test-user', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      const decoded = jwt.decode(token) as DecodedToken;

      expect(decoded.userId).toBe('test-user');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('handles malformed token in decode', () => {
      const malformedToken = 'not.a.valid.jwt.token';

      const decoded = jwt.decode(malformedToken);
      expect(decoded).toBeNull();
    });
  });

  describe('token payload validation', () => {
    it('preserves complex payload structures', () => {
      const complexPayload = {
        userId: 'test-user',
        email: 'test@example.com',
        roles: ['user', 'admin'],
        metadata: {
          lastLogin: new Date().toISOString(),
          preferences: { theme: 'dark', language: 'en' },
        },
      };

      const token = jwt.sign(complexPayload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });
      const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

      expect(decoded.userId).toBe(complexPayload.userId);
      expect(decoded.email).toBe(complexPayload.email);
      expect(decoded.roles).toEqual(complexPayload.roles);
      expect(decoded.metadata).toEqual(complexPayload.metadata);
    });

    it('handles empty payload', () => {
      const emptyPayload = {};
      const token = jwt.sign(emptyPayload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
      expect(decoded).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });
  });
});
