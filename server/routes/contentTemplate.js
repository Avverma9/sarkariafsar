const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/contentTemplate");

const noStore = (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
};

router.get("/", noStore, ctrl.listTemplates);
router.get("/preview", noStore, ctrl.previewContent);
router.get("/:templateId", noStore, ctrl.getTemplate);
router.post("/", ctrl.createTemplate);
router.put("/:templateId", ctrl.updateTemplate);
router.delete("/:templateId", ctrl.deleteTemplate);

module.exports = router;