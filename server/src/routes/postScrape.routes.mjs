import express from "express";
import {
  postUpdate,
  scrapePost,
  trackPostChanges,
} from "../controllers/postScrape.controller.mjs";

const router = express.Router();
router.post("/scrape", scrapePost);
router.post("/update", postUpdate);
router.post("/track-changes", trackPostChanges);

export default router;
