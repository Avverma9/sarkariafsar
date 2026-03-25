const express = require("express");
const router = express.Router();
const jobPostController = require("../controllers/post");

router.post("/add", jobPostController.addJobPost);

router.get("/", jobPostController.getAllJobPosts);
router.get("/id/:id", jobPostController.getJobPostById);
router.get("/slug/:slug", jobPostController.getJobPostBySlug);
router.get("/dedupe/:dedupeKey", jobPostController.getJobPostByDedupeKey);
router.get("/get-deadline-jobs",jobPostController.getExpiringJobPostsReminder)
router.get("/get-posts-with-section",jobPostController.getPostsWithSection)
router.get("/section-list/:sectionCanonicalUrl", jobPostController.getPostListBySectionCanonicalUrl);

router.put("/id/:id", jobPostController.updateJobPost);
router.put("/slug/:slug", jobPostController.updateJobPostBySlug);

router.delete("/id/:id", jobPostController.deleteJobPost);
router.delete("/slug/:slug", jobPostController.deleteJobPostBySlug);


module.exports = router;
