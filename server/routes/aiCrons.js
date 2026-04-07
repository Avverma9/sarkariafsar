const express = require("express");
const { runBlogCron } = require("../utils/aiCrons/blogCron");
const { runSchemeCron } = require("../utils/aiCrons/schemeCron");

const router = express.Router();

// Manual blog cron trigger
router.post("/run-blog-cron", async (req, res, next) => {
  try {
    console.log("[BlogCron] Manual trigger started...");
    const result = await runBlogCron();
    
    return res.status(200).json({
      success: true,
      message: "Blog cron executed successfully",
      data: result,
    });
  } catch (error) {
    console.error("[BlogCron] Manual trigger error:", error);
    return next(error);
  }
});

// Manual scheme cron trigger
router.post("/run-scheme-cron", async (req, res, next) => {
  try {
    console.log("[SchemeCron] Manual trigger started...");
    const result = await runSchemeCron();
    
    return res.status(200).json({
      success: true,
      message: "Scheme cron executed successfully", 
      data: result,
    });
  } catch (error) {
    console.error("[SchemeCron] Manual trigger error:", error);
    return next(error);
  }
});

module.exports = router;
