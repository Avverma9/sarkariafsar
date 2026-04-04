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

// Initialise Redis client with graceful fallback.
// enableOfflineQueue:false → commands fail instantly when disconnected (no hanging requests).
// maxRetriesPerRequest:2  → per-command retry limit so HTTP requests don't stall.
// retryStrategy            → keeps trying to reconnect in background (backs off to 5s).
try {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    retryStrategy: (times) => {
      if (times > 20) return null;            // stop after ~20 retries
      return Math.min(times * 250, 5000);     // back off up to 5 s
    },
    lazyConnect: true,
  });

  redis.on("ready", () => {
    redisReady = true;
    console.log("[Cache] Redis ready ✓");
  });
  redis.on("error", (err) => {
    if (redisReady) console.warn("[Cache] Redis error:", err.message);
    redisReady = false;
  });
  redis.on("close", () => {
    redisReady = false;
  });
  redis.on("reconnecting", () => {
    // silent — avoids log spam
  });

  // Attempt initial connect; don't crash if Redis isn't installed
  redis.connect().catch(() => {
    redisReady = false;
    console.warn("[Cache] Redis not available — server running without cache");
  });
} catch (e) {
  console.warn("[Cache] Could not initialise Redis:", e && e.message);
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
      } catch (e) {
        // ignore cache errors — fallback to fresh response
        console.warn('[Cache] read error:', e && e.message);
      }

      // Monkey-patch res.json to store the response in cache
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300 && redisReady) {
            const val = typeof body === 'string' ? body : JSON.stringify(body);
            // Use SET with EX for atomic behaviour
            redis.set(key, val, 'EX', ttlSeconds).catch((err) => {
              console.warn('[Cache] write error:', err && err.message);
            });
          }
        } catch (err) {
          // swallow any serialization errors
          console.warn('[Cache] cache serialization error:', err && err.message);
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
  let cursor = '0';
  let deleted = 0;
  try {
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys && keys.length) {
        await redis.del(...keys);
        deleted += keys.length;
      }
    } while (cursor !== '0');
  } catch (err) {
    console.warn('[Cache] flushPattern error:', err && err.message);
  }
  return deleted;
};

/**
 * Flush entire cache.
 */
const flushAll = async () => {
  if (!redisReady) return;
  try {
    await redis.flushdb();
  } catch (err) {
    console.warn('[Cache] flushAll error:', err && err.message);
  }
};

const getCache = async (key) => {
  if (!redisReady) return null;
  try {
    const v = await redis.get(key);
    if (!v) return null;
    try { return JSON.parse(v); } catch { return v; }
  } catch (err) {
    console.warn('[Cache] getCache error:', err && err.message);
    return null;
  }
};

const setCache = async (key, value, ttlSeconds = 60) => {
  if (!redisReady) return false;
  try {
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    await redis.set(key, val, 'EX', ttlSeconds);
    return true;
  } catch (err) {
    console.warn('[Cache] setCache error:', err && err.message);
    return false;
  }
};

const delCache = async (key) => {
  if (!redisReady) return 0;
  try { return await redis.del(key); } catch (err) { console.warn('[Cache] delCache error:', err && err.message); return 0; }
};

const isRedisReady = () => redisReady;

module.exports = { cacheMiddleware, flushPattern, flushAll, isRedisReady, getCache, setCache, delCache, redis };
