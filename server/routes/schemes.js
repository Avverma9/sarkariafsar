const express = require("express");
const router = express.Router();
const schemeController = require("../controllers/schemes");

const noStore = (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
};

// CREATE
router.post("/add", schemeController.addGovScheme);

// READ
router.get("/", noStore, schemeController.getAllGovSchemes);
// Sitemap endpoint
router.get("/sitemap", noStore, schemeController.getSitemapSchemes);
// extra helper endpoints
router.get("/getSchemeStateNameOnly", noStore, schemeController.getGovSchemeStateNameOnly);
router.get("/getSchemeTitlesByState", noStore, schemeController.getGovSchemeTitlesByState);
router.get("/getSchemeByState", noStore, schemeController.getGovSchemeByState);
router.get("/slug/:slug", noStore, schemeController.getGovSchemeBySlug);
router.get("/:id", noStore, schemeController.getGovSchemeById);

// UPDATE
router.put("/:id", schemeController.updateGovScheme);

// DELETE
router.delete("/:id", schemeController.deleteGovScheme);

module.exports = router;