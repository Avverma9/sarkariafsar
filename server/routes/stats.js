const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats");

const noStore = (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
};

router.get("/schemes", noStore, statsController.getSchemesCount);
router.get("/blogs", noStore, statsController.getBlogsCount);
router.get("/posts", noStore, statsController.getPostsCount);
router.get("/posts/advanced", noStore, statsController.getPostsAdvancedStats);

module.exports = router;
