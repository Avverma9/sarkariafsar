import express from "express";
import {
  checkPostDetail,
  patchPostDetail,
  postUpdate,
  scrapePost,
  searchPostDetailsByLinks,
  trackPostChanges,
} from "../controllers/postScrape.controller.mjs";

const router = express.Router();
router.post("/check-detail", checkPostDetail);
router.patch("/detail", patchPostDetail);
router.get("/detail/search", searchPostDetailsByLinks);
router.post("/scrape", scrapePost);
router.post("/update", postUpdate);
router.post("/track-changes", trackPostChanges);

export default router;
