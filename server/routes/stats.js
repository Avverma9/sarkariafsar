const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats");

router.get("/schemes", statsController.getSchemesCount);
router.get("/blogs", statsController.getBlogsCount);
router.get("/posts", statsController.getPostsCount);
router.get("/posts/advanced", statsController.getPostsAdvancedStats);

module.exports = router;
