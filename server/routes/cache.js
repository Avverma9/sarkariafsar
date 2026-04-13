const router    = require('express').Router();
const authAdmin = require('../middleware/authAdmin');
const { flushAll, flushPattern, isRedisReady } = require('../utils/cache');

router.post('/flush', authAdmin, async (req, res) => {
  try {
    if (!isRedisReady()) {
      return res.json({ success: true, message: 'Redis not connected — nothing to flush.' });
    }
    await flushAll();
    return res.json({ success: true, message: 'All cache flushed successfully.' });
  } catch (err) {
    console.error('[Cache] flush error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/flush-pattern', authAdmin, async (req, res) => {
  try {
    const { pattern } = req.body;
    if (!pattern) return res.status(400).json({ success: false, message: 'Pattern required.' });

    if (!isRedisReady()) {
      return res.json({ success: true, message: 'Redis not connected — nothing to flush.' });
    }
    const count = await flushPattern(pattern);
    return res.json({ success: true, message: `Flushed ${count} key(s) matching "${pattern}".` });
  } catch (err) {
    console.error('[Cache] flush-pattern error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
