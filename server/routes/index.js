const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({ message: 'API is working' });
});

// Routes
router.use('/postsection', require('./postsection'));
router.use('/post', require('./post'));
router.use('/blog', require('./blog'));
router.use('/schemes', require('./schemes'));
router.use('/search', require('./search'));
router.use('/stats', require('./stats'));
router.use('/content-template', require('./contentTemplate'));
router.use('/ai-crons', require('./aiCrons'));
router.use('/scrapper', require('./scrapperCron'));
router.use('/scrapper', require('../scrapper/fetchSection').router);
router.use('/scrapper', require('../scrapper/fetchAllBySection').router);
router.use('/scrapper', require('../scrapper/singlePostScrape').router);

module.exports = router;
