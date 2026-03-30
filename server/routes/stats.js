const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats");
const { cacheMiddleware } = require("../utils/cache");

router.get("/schemes", cacheMiddleware(120), statsController.getSchemesCount);
router.get("/blogs", cacheMiddleware(120), statsController.getBlogsCount);
router.get("/posts", cacheMiddleware(120), statsController.getPostsCount);
router.get("/posts/advanced", cacheMiddleware(300), statsController.getPostsAdvancedStats);

module.exports = router;
