const express = require("express");
const router = express.Router();


const schemeController = require("../controllers/schemes"); 

// CREATE
router.post("/add", schemeController.addGovScheme);

// READ
router.get("/", schemeController.getAllGovSchemes);
router.get("/:id", schemeController.getGovSchemeById);

// UPDATE
router.put("/:id", schemeController.updateGovScheme);

// DELETE
router.delete("/:id", schemeController.deleteGovScheme);

module.exports = router;