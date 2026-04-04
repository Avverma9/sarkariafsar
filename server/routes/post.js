const express = require("express");
const router = express.Router();
const jobPostController = require("../controllers/post");
const filterController  = require("../controllers/filter");
const { cacheMiddleware } = require("../utils/cache");

router.post("/add", jobPostController.addJobPost);

router.get("/", cacheMiddleware(60), jobPostController.getAllJobPosts);
router.get("/id/:id", cacheMiddleware(120), jobPostController.getJobPostById);
router.get("/slug/:slug", cacheMiddleware(120), jobPostController.getJobPostBySlug);
router.get("/dedupe/:dedupeKey", jobPostController.getJobPostByDedupeKey);
router.get("/get-deadline-jobs", cacheMiddleware(300), jobPostController.getExpiringJobPostsReminder);
router.get("/get-posts-with-section", cacheMiddleware(120), jobPostController.getPostsWithSection);
router.get("/section-list/:sectionCanonicalUrl", cacheMiddleware(120), jobPostController.getPostListBySectionCanonicalUrl);

// SEO endpoints
router.get("/sitemap", cacheMiddleware(3600), jobPostController.getSitemapPosts);
router.get("/meta/:slug", cacheMiddleware(600), jobPostController.getPostMeta);
router.get("/states",  cacheMiddleware(3600), filterController.getAllStates);
router.get("/filter",  filterController.filterPost); // not cached — params vary per request

router.put("/id/:id", jobPostController.updateJobPost);
router.put("/slug/:slug", jobPostController.updateJobPostBySlug);

router.delete("/id/:id", jobPostController.deleteJobPost);
router.delete("/slug/:slug", jobPostController.deleteJobPostBySlug);


module.exports = router;
