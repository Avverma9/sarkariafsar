import { Router } from "express";
import {
  getAllGovSchemesController,
  getGovSchemeByStateController,
  getGovSchemeController,
  getGovSchemeStateNamesController,
  patchGovSchemeController,
  postGovSchemeController,
  seedGovSchemeController,
} from "../controller/govscheme.controller.mjs";

const router = Router();

// List schemes (with filters) or create new scheme.
router.get("/", getGovSchemeController);
router.post("/", postGovSchemeController);
router.post("/seed", seedGovSchemeController);
router.get("/getAllSchemes", getAllGovSchemesController);
router.get("/getSchemeStateNameOnly", getGovSchemeStateNamesController);
router.get("/getSchemeByState", getGovSchemeByStateController);

// Get single scheme or patch existing scheme by id.
router.get("/:id", getGovSchemeController);
router.patch("/:id", patchGovSchemeController);

export default router;
