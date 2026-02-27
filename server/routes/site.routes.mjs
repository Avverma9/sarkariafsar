import { Router } from "express";
import {
  fetchStoredJobListController,
  findByTitleJobAndSchemeController,
  fetchJobByTitleController,
  fetchJobByUrlController,
  getAllJobDetailsController,
  getJobSectionUrlsController,
  listJobSectionsController,
  scrapeJobDetailController,
  scrapeSectionJobsController,
  scrapeSiteSectionsController,
  siteAddController,
  siteGetController,
  syncJobListController,
  upsertJobSectionController,
} from "../controller/site.controller.mjs";

const router = Router();

// Health check endpoint.
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Scrapper API is running",
    timestamp: new Date().toISOString(),
  });
});

// Extract top navigation/category sections from a site URL.
router.get("/scrape/site-sections", scrapeSiteSectionsController);
router.post("/scrape/site-sections", scrapeSiteSectionsController);

// Extract job list (title + jobUrl) from one or many section URLs.
router.get("/scrape/section-jobs", scrapeSectionJobsController);
router.post("/scrape/section-jobs", scrapeSectionJobsController);
router.get("/sync-joblist", syncJobListController);
router.post("/sync-joblist", syncJobListController);

// Scrape one job page and return only formatted HTML.
router.get("/scrape/job-detail", scrapeJobDetailController);
router.post("/scrape/job-detail", scrapeJobDetailController);

// Fetch stored job detail from DB by title.
router.get("/fetch-stored-joblist", fetchStoredJobListController);
router.post("/fetch-stored-joblist", fetchStoredJobListController);
router.get("/fetch/job-by-title", fetchJobByTitleController);
router.post("/fetch/job-by-title", fetchJobByTitleController);
router.get("/find-by-title-job-and-scheme", findByTitleJobAndSchemeController);
router.post("/find-by-title-job-and-scheme", findByTitleJobAndSchemeController);
router.get("/fetch/job-by-url", fetchJobByUrlController);
router.post("/fetch/job-by-url", fetchJobByUrlController);
router.get("/fetch/all-job-details", getAllJobDetailsController);

// Manage logical merged job sections (New Jobs, Admit Card, etc.).
router.get("/job-sections", listJobSectionsController);
router.post("/job-sections", upsertJobSectionController);
router.get("/job-sections/:section/urls", getJobSectionUrlsController);

// Manage source sites and their status (active/inactive).
router.post("/site-add", siteAddController);
router.get("/site-get", siteGetController);

export default router;
