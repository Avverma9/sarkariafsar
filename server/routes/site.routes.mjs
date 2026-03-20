import { Router } from "express";
import {
  clearCacheStorageController,
  createJobPostController,
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
import { createApiCacheMiddleware } from "../utils/apiCache.mjs";

const router = Router();

// Health check endpoint.
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Scrapper API is running",
    timestamp: new Date().toISOString(),
  });
});

router.post("/cache/clear", clearCacheStorageController);

// Extract top navigation/category sections from a site URL.
router.get(
  "/scrape/site-sections",
  createApiCacheMiddleware({ namespace: "site:scrape-site-sections", ttlSeconds: 300 }),
  scrapeSiteSectionsController
);
router.post("/scrape/site-sections", scrapeSiteSectionsController);

// Extract job list (title + jobUrl) from one or many section URLs.
router.get("/scrape/section-jobs", scrapeSectionJobsController);
router.post("/scrape/section-jobs", scrapeSectionJobsController);
router.get("/sync-joblist", syncJobListController);
router.post("/sync-joblist", syncJobListController);

// Scrape one job page and return only formatted HTML.
router.get("/scrape/job-detail", scrapeJobDetailController);
router.post("/scrape/job-detail", scrapeJobDetailController);

// Manually create or update a job post in the database.
router.post("/jobs", createJobPostController);

// Fetch stored job detail from DB by title.
router.get(
  "/fetch-stored-joblist",
  createApiCacheMiddleware({ namespace: "site:stored-joblist", ttlSeconds: 300 }),
  fetchStoredJobListController
);
router.post("/fetch-stored-joblist", fetchStoredJobListController);
router.get(
  "/fetch/job-by-title",
  createApiCacheMiddleware({ namespace: "site:job-by-title", ttlSeconds: 300 }),
  fetchJobByTitleController
);
router.post("/fetch/job-by-title", fetchJobByTitleController);
router.get(
  "/find-by-title-job-and-scheme",
  createApiCacheMiddleware({ namespace: "site:job-search", ttlSeconds: 300 }),
  findByTitleJobAndSchemeController
);
router.post("/find-by-title-job-and-scheme", findByTitleJobAndSchemeController);
router.get(
  "/fetch/job-by-url",
  createApiCacheMiddleware({ namespace: "site:job-by-url", ttlSeconds: 300 }),
  fetchJobByUrlController
);
router.post("/fetch/job-by-url", fetchJobByUrlController);
router.get(
  "/fetch/all-job-details",
  createApiCacheMiddleware({ namespace: "site:all-job-details", ttlSeconds: 300 }),
  getAllJobDetailsController
);

// Manage logical merged job sections (New Jobs, Admit Card, etc.).
router.get(
  "/job-sections",
  createApiCacheMiddleware({ namespace: "site:job-sections", ttlSeconds: 900 }),
  listJobSectionsController
);
router.post("/job-sections", upsertJobSectionController);
router.get(
  "/job-sections/:section/urls",
  createApiCacheMiddleware({ namespace: "site:job-section-urls", ttlSeconds: 900 }),
  getJobSectionUrlsController
);

// Manage source sites and their status (active/inactive).
router.post("/site-add", siteAddController);
router.get(
  "/site-get",
  createApiCacheMiddleware({ namespace: "site:sites", ttlSeconds: 900 }),
  siteGetController
);

export default router;
