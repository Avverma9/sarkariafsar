const express = require("express");
const router = express.Router();
const jobPostController = require("../controllers/post");
const filterController  = require("../controllers/filter");

const noStore = (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
};

router.post("/add", jobPostController.addJobPost);

router.get("/", noStore, jobPostController.getAllJobPosts);
router.get("/id/:id", noStore, jobPostController.getJobPostById);
router.get("/slug/:slug", noStore, jobPostController.getJobPostBySlug);
router.get("/dedupe/:dedupeKey", jobPostController.getJobPostByDedupeKey);
router.get("/get-deadline-jobs", noStore, jobPostController.getExpiringJobPostsReminder);
router.get("/get-posts-with-section", noStore, jobPostController.getPostsWithSection);
router.get("/section-list/:sectionCanonicalUrl", noStore, jobPostController.getPostListBySectionCanonicalUrl);

// SEO endpoints
router.get("/sitemap", noStore, jobPostController.getSitemapPosts);
router.get("/meta/:slug", noStore, jobPostController.getPostMeta);
router.get("/states", noStore, filterController.getAllStates);
router.get("/filter", noStore, filterController.filterPost);

router.put("/id/:id", jobPostController.updateJobPost);
router.put("/slug/:slug", jobPostController.updateJobPostBySlug);

router.delete("/id/:id", jobPostController.deleteJobPost);
router.delete("/slug/:slug", jobPostController.deleteJobPostBySlug);


module.exports = router;
