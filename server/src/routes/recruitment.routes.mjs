import express from "express";
import { processRecruitmentPost } from "../controllers/recruitment.controller.mjs";

const router = express.Router();

// POST /api/recruitment/process-post
router.post("/process-post", processRecruitmentPost);

export default router;
