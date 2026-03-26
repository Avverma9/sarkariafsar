const express = require("express");
const router = express.Router();


const schemeController = require("../controllers/schemes"); 

// CREATE
router.post("/add", schemeController.addGovScheme);

// READ
router.get("/", schemeController.getAllGovSchemes);
// extra helper endpoints
router.get("/getSchemeStateNameOnly", schemeController.getGovSchemeStateNameOnly);
router.get("/getSchemeByState", schemeController.getGovSchemeByState);
router.get("/slug/:slug", schemeController.getGovSchemeBySlug);
router.get("/:id", schemeController.getGovSchemeById);

// UPDATE
router.put("/:id", schemeController.updateGovScheme);

// DELETE
router.delete("/:id", schemeController.deleteGovScheme);

module.exports = router;