import express from "express";
import {
  addSite,
  findMegaPostsByTitle,
  getMegaPosts,
  getMegaSections,
  getSites,
  getDeadlineJobs,
  markJobFavorite,
  postListBysectionUrl,
  runMegaSync,
  updateStatus,
} from "../controllers/aggregator.controller.mjs";

const router = express.Router();

router.post("/site", addSite);
router.get("/sites", getSites);
router.put("/site/:id/status", updateStatus);
// POST /api/aggregator/sync
router.post("/sync", runMegaSync);

// GET /api/aggregator/mega-sections
router.get("/mega-sections", getMegaSections);

// GET /api/aggregator/mega-posts?slug=latest-gov-jobs&page=1&limit=20
router.get("/mega-posts", getMegaPosts);
// GET /api/site/post-list-by-section-url?megaTitle=Latest%20Gov%20Jobs&page=1&limit=100
router.get("/post-list-by-section-url", postListBysectionUrl);
router.get("/find-by-title", findMegaPostsByTitle);
router.post("/favorite-job", markJobFavorite);
router.get("/deadline-jobs", getDeadlineJobs);
export default router;
