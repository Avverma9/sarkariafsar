import express from "express";
import { getSectionsFromActiveSites } from "../controllers/section.controller.mjs";

const router = express.Router();

// GET /api/sections
router.get("/get-sections", getSectionsFromActiveSites);

export default router;
