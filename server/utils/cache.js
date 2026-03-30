/**
 * Redis caching middleware & helpers.
 *
 * Uses `ioredis` — falls back gracefully if Redis is not running (cache miss = fresh DB query).
 *
 * Usage in routes:
 *   const { cacheMiddleware, flushPattern } = require('../utils/cache');
 *   router.get('/posts', cacheMiddleware(120), controller.getAllPosts);
 *
 * Environment vars:
 *   REDIS_URL  — default "redis://127.0.0.1:6379"
 */

const Redis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let redis;
let redisReady = false;

try {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
    lazyConnect: true,
  });

  redis.on("connect", () => {
    redisReady = true;
    console.log("[Cache] Redis connected");
  });
  redis.on("error", (err) => {
    redisReady = false;
    console.warn("[Cache] Redis error (cache disabled):", err.message);
  });
  redis.on("close", () => {
    redisReady = false;
  });

  redis.connect().catch(() => {
    console.warn("[Cache] Redis not available — running without cache");
  });
} catch {
  console.warn("[Cache] Could not initialise Redis — running without cache");
}

/**
 * Express middleware — caches JSON responses for `ttlSeconds`.
 * Cache key = req.originalUrl
 */
const cacheMiddleware = (ttlSeconds = 60) => {
  return async (req, res, next) => {
    if (!redisReady) return next();

    const key = `cache:${req.originalUrl}`;
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch {
      // cache miss — fall through
    }

    // Monkey-patch res.json to store the response in cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && redisReady) {
        redis.setex(key, ttlSeconds, JSON.stringify(body)).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Flush all keys matching a pattern, e.g. flushPattern('cache:/api/post*')
 */
const flushPattern = async (pattern) => {
  if (!redisReady) return 0;
  let cursor = "0";
  let deleted = 0;
  do {
    const [next, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = next;
    if (keys.length) {
      await redis.del(...keys);
      deleted += keys.length;
    }
  } while (cursor !== "0");
  return deleted;
};

/**
 * Flush entire cache.
 */
const flushAll = async () => {
  if (!redisReady) return;
  await redis.flushdb();
};

const isRedisReady = () => redisReady;

module.exports = { cacheMiddleware, flushPattern, flushAll, isRedisReady };
