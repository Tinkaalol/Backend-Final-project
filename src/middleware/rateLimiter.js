import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../config/redis.js';
import { config } from '../config/env.js';

// In test environment skip rate limiting to prevent flaky tests
const noop = (_req, _res, next) => next();

function createLimiterMiddleware(limiter) {
  return async (req, res, next) => {
    try {
      await limiter.consume(req.ip);
      next();
    } catch (err) {
      const retryAfter = Math.ceil(err.msBeforeNext / 1000) || 60;
      res.set('Retry-After', retryAfter);
      res.status(429).json({
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Try again in ${retryAfter} seconds.`,
      });
    }
  };
}

const authLimiter = config.NODE_ENV !== 'test'
  ? new RateLimiterRedis({ storeClient: redis, keyPrefix: 'rl:auth', points: 5, duration: 60, blockDuration: 60 })
  : null;

const apiLimiter = config.NODE_ENV !== 'test'
  ? new RateLimiterRedis({ storeClient: redis, keyPrefix: 'rl:api', points: 100, duration: 60 })
  : null;

export const authRateLimit = authLimiter ? createLimiterMiddleware(authLimiter) : noop;
export const apiRateLimit = apiLimiter ? createLimiterMiddleware(apiLimiter) : noop;
