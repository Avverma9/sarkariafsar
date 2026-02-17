import express from "express";
import { createOrUpdateWatch } from "../controllers/watch.controller.mjs";

const router = express.Router();

// POST /api/watch
router.post("/", createOrUpdateWatch);

export default router;
