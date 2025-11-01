import Redis, { RedisOptions } from 'ioredis';
import { logError, logInfo } from '../utils/logger.js';
import { config } from './env.js';

export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
} as RedisOptions);

redisClient.on('connect', () => {
  logInfo('Redis connection established');
});

redisClient.on('error', (error) => {
  logError('Redis connection error:', error);
});

export const addTokenToDenyList = async (token: string, ttl: number): Promise<void> => {
  const key = `denied:${token}`;
  await redisClient.setex(key, ttl, '1');
};

export const isTokenDenied = async (token: string): Promise<boolean> => {
  const key = `denied:${token}`;
  const result = await redisClient.get(key);
  return result !== null;
};

export const storeOTP = async (
  phone: string,
  purpose: string,
  nonce: string,
  code: string,
  ttl: number = 300
): Promise<void> => {
  const key = `otp:${phone}:${purpose}:${nonce}`;
  await redisClient.setex(key, ttl, code);
};

export const getOTP = async (
  phone: string,
  purpose: string,
  nonce: string
): Promise<string | null> => {
  const key = `otp:${phone}:${purpose}:${nonce}`;
  return await redisClient.get(key);
};

export const deleteOTP = async (phone: string, purpose: string, nonce: string): Promise<void> => {
  const key = `otp:${phone}:${purpose}:${nonce}`;
  await redisClient.del(key);
};

export const markOTPVerified = async (
  phone: string,
  purpose: string,
  nonce: string,
  ttl: number = 300
): Promise<void> => {
  const key = `otp_verified:${phone}:${purpose}:${nonce}`;
  await redisClient.setex(key, ttl, '1');
};

export const isOTPVerified = async (
  phone: string,
  purpose: string,
  nonce: string
): Promise<boolean> => {
  const key = `otp_verified:${phone}:${purpose}:${nonce}`;
  const result = await redisClient.get(key);
  return result !== null;
};

export const checkRateLimit = async (
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> => {
  const count = await redisClient.incr(key);

  if (count === 1) {
    await redisClient.pexpire(key, windowMs);
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
  };
};

export const closeRedis = async (): Promise<void> => {
  await redisClient.quit();
  logInfo('Redis connection closed');
};
