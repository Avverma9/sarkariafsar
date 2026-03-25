const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search');

router.get('/search-with-title', searchController.searchWithTitle);

module.exports = router;