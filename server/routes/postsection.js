const express = require("express");
const router = express.Router();
const jobSectionController = require("../controllers/postsection");

router.post("/add", jobSectionController.addJobSection);

router.get("/", jobSectionController.getAllJobSections);
router.get("/id/:id", jobSectionController.getJobSectionById);
router.get("/canonical/:canonicalUrl", jobSectionController.getJobSectionByCanonicalUrl);

router.put("/id/:id", jobSectionController.updateJobSection);
router.put("/canonical/:canonicalUrl", jobSectionController.updateJobSectionByCanonicalUrl);

router.delete("/id/:id", jobSectionController.deleteJobSection);
router.delete("/canonical/:canonicalUrl", jobSectionController.deleteJobSectionByCanonicalUrl);

module.exports = router;