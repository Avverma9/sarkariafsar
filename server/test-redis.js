const { isRedisReady, getCache, setCache, delCache } = require('./utils/cache');

async function run() {
  console.log('Redis ready:', isRedisReady());
  const key = 'test:cache:example';
  const ok = await setCache(key, { hello: 'world', at: new Date().toISOString() }, 10);
  console.log('setCache:', ok);
  const val = await getCache(key);
  console.log('getCache:', val);
  const del = await delCache(key);
  console.log('delCache:', del);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
