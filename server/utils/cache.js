const noStoreHeaders = (res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
};

const cacheMiddleware = () => {
  return async (req, res, next) => {
    noStoreHeaders(res);
    return next();
  };
};

const flushPattern = async () => 0;
const flushAll = async () => 0;
const getCache = async () => null;
const setCache = async () => false;
const delCache = async () => 0;
const isRedisReady = () => false;

module.exports = {
  cacheMiddleware,
  flushPattern,
  flushAll,
  isRedisReady,
  getCache,
  setCache,
  delCache,
  redis: null,
};
