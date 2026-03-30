const express = require("express");
const router = express.Router();
const schemeController = require("../controllers/schemes");
const { cacheMiddleware } = require("../utils/cache");

// CREATE
router.post("/add", schemeController.addGovScheme);

// READ
router.get("/", cacheMiddleware(60), schemeController.getAllGovSchemes);
// extra helper endpoints
router.get("/getSchemeStateNameOnly", cacheMiddleware(300), schemeController.getGovSchemeStateNameOnly);
router.get("/getSchemeByState", cacheMiddleware(120), schemeController.getGovSchemeByState);
router.get("/slug/:slug", cacheMiddleware(120), schemeController.getGovSchemeBySlug);
router.get("/:id", cacheMiddleware(120), schemeController.getGovSchemeById);

// UPDATE
router.put("/:id", schemeController.updateGovScheme);

// DELETE
router.delete("/:id", schemeController.deleteGovScheme);

module.exports = router;