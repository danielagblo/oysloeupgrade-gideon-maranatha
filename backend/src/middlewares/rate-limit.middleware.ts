import type { Request, Response, NextFunction } from "express";
import { checkRateLimit } from "../config/redis.js";

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in the window
  keyGenerator?: (req: Request) => string; // Function to generate rate limit key
  skipSuccessfulRequests?: boolean; // Skip rate limiting on successful responses
  skipFailedRequests?: boolean; // Skip rate limiting on failed responses
}

export const createRateLimitMiddleware = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req: Request) => {
      const ip = req.ip || req.connection.remoteAddress || "unknown";
      return `rate_limit:${ip}:${req.path}`;
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);

      const { allowed, remaining } = await checkRateLimit(
        key,
        maxRequests,
        windowMs
      );

      const resetTime = new Date(Date.now() + windowMs);
      res.set({
        "X-RateLimit-Limit": maxRequests.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": resetTime.toISOString(),
      });

      if (!allowed) {
        res.set("Retry-After", Math.ceil(windowMs / 1000).toString());
        return res.status(429).json({
          success: false,
          message: "Too many requests",
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter: Math.ceil(windowMs / 1000),
          },
        });
      }

      (req as any).rateLimit = { allowed, remaining, resetTime };

      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = function (body: any) {
          const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
          const shouldSkip =
            (skipSuccessfulRequests && isSuccess) ||
            (skipFailedRequests && !isSuccess);

          if (!shouldSkip) {
          }

          return originalSend.call(this, body);
        };
      }

      next();
    } catch (error) {
      console.warn("Rate limiting check failed, allowing request:", error);
      next();
    }
  };
};

export const strictRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per 15 minutes
});

export const moderateRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 requests per 15 minutes
});

export const lenientRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
});

export const adminRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes for admin actions
  keyGenerator: (req: Request) => {
    const adminId = (req as any).admin?.id;
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    return `admin_rate_limit:${adminId || ip}:${req.path}`;
  },
});

export const authRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 auth attempts per 15 minutes
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    return `auth_rate_limit:${ip}`;
  },
});
