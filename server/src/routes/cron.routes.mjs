import express from "express";
import { processNewPostsCron, watchSweepCron } from "../controllers/cron.controller.mjs";

const router = express.Router();

// POST /api/cron/process-new-posts
router.post("/process-new-posts", processNewPostsCron);
// POST /api/cron/watch-sweep
router.post("/watch-sweep", watchSweepCron);

export default router;
