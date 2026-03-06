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
import { createApiCacheMiddleware } from "../utils/apiCache.mjs";

const router = Router();

// List schemes (with filters) or create new scheme.
router.get(
  "/",
  createApiCacheMiddleware({ namespace: "gov-schemes:list", ttlSeconds: 600 }),
  getGovSchemeController
);
router.post("/", postGovSchemeController);
router.post("/seed", seedGovSchemeController);
router.get(
  "/getAllSchemes",
  createApiCacheMiddleware({ namespace: "gov-schemes:all", ttlSeconds: 600 }),
  getAllGovSchemesController
);
router.get(
  "/getSchemeStateNameOnly",
  createApiCacheMiddleware({ namespace: "gov-schemes:states", ttlSeconds: 1800 }),
  getGovSchemeStateNamesController
);
router.get(
  "/getSchemeByState",
  createApiCacheMiddleware({ namespace: "gov-schemes:by-state", ttlSeconds: 600 }),
  getGovSchemeByStateController
);

// Get single scheme or patch existing scheme by id.
router.get(
  "/:id",
  createApiCacheMiddleware({ namespace: "gov-schemes:item", ttlSeconds: 600 }),
  getGovSchemeController
);
router.patch("/:id", patchGovSchemeController);

export default router;
