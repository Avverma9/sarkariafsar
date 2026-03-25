const express = require("express");

const { runSectionScrapeCycle } = require("../utils/sectionScrapeCron");

const router = express.Router();

router.post("/run-section-cron", async (req, res, next) => {
  try {
    const summary = await runSectionScrapeCycle();

    return res.status(200).json({
      success: true,
      message: "Section scrape cron executed successfully",
      data: summary,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
