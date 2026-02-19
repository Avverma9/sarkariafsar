import express from "express";
import aggregatorRoutes from "./aggregator.routes.mjs";
import sectionsRoutes from "./sections.routes.mjs";
import postScrapeRoutes from "./postScrape.routes.mjs";  
import geminiRoutes from "./gemini.routes.mjs";
import watchRoutes from "./watch.routes.mjs";
import recruitmentRoutes from "./recruitment.routes.mjs";
import cronRoutes from "./cron.routes.mjs";
import adminRoutes from "./admin.routes.mjs";

const router = express.Router();

router.use("/site", aggregatorRoutes);
router.use("/sections", sectionsRoutes);
router.use("/post", postScrapeRoutes);
router.use("/gemini", geminiRoutes);
router.use("/watch", watchRoutes);
router.use("/recruitment", recruitmentRoutes);
router.use("/cron", cronRoutes);
router.use("/admin", adminRoutes);
export default router;
