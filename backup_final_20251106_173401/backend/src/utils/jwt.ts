import { type JwtPayload, type Secret, sign, verify } from 'jsonwebtoken';

import { config } from '../config/env.js';
import { InvalidTokenError } from './errors.js';

export interface JWTPayload extends JwtPayload {
  userId: string;
  email: string;
  level: string;
}

const JWT_SECRET: Secret = config.jwt.secret;

export function issueJwt(payload: object, expiresIn: string | number = '1h'): string {
  return sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): JWTPayload {
  try {
    return verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    throw new InvalidTokenError('Invalid token');
  }
}

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return issueJwt(payload, config.jwt.expiry);
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
};

export const getTokenExpiry = (token: string): number => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - now);
};

export function getBearerTokenFromHeader(authorization?: string): string | null {
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1]?.trim();
  return token || null;
}

export const extractTokenFromHeader = getBearerTokenFromHeader;
