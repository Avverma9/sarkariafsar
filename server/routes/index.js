const express = require('express');
const router = express.Router();
const { flushAll, flushPattern, isRedisReady } = require('../utils/cache');

router.get('/', (req, res) => {
    res.status(200).json({ message: 'API is working' });
});

// ─── Cache management (admin) ───
router.post('/cache/flush', async (req, res) => {
  try {
    if (!isRedisReady()) return res.status(200).json({ success: true, message: 'Redis not connected — no cache to flush' });
    await flushAll();
    res.status(200).json({ success: true, message: 'Cache flushed' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/cache/flush-pattern', async (req, res) => {
  try {
    const { pattern } = req.body;
    if (!pattern) return res.status(400).json({ success: false, message: 'pattern is required' });
    const deleted = await flushPattern(pattern);
    res.status(200).json({ success: true, message: `Flushed ${deleted} keys matching ${pattern}` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Redis status endpoint (helpful for health checks)
router.get('/cache/status', (req, res) => {
  try {
    return res.status(200).json({ success: true, redisReady: isRedisReady() });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// Routes
router.use('/postsection', require('./postsection'));
router.use('/post', require('./post'));
router.use('/blog', require('./blog'));
router.use('/schemes', require('./schemes'));
router.use('/search', require('./search'));
router.use('/stats', require('./stats'));
router.use('/content-template', require('./contentTemplate'));
router.use('/scrapper', require('./scrapperCron'));
router.use('/scrapper', require('../scrapper/fetchSection').router);
router.use('/scrapper', require('../scrapper/fetchAllBySection').router);
router.use('/scrapper', require('../scrapper/singlePostScrape').router);

module.exports = router;
