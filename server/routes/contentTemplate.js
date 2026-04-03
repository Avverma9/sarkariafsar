const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/contentTemplate");
const { cacheMiddleware } = require("../utils/cache");

router.get("/", ctrl.listTemplates);
router.get("/preview", cacheMiddleware(60), ctrl.previewContent);
router.get("/:templateId", ctrl.getTemplate);
router.post("/", ctrl.createTemplate);
router.put("/:templateId", ctrl.updateTemplate);
router.delete("/:templateId", ctrl.deleteTemplate);

module.exports = router;
 