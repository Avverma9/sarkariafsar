import express from "express";
import {
  changeStatus,
  getApiKey,
  getModel,
  setApiKey,
  setApiKeysBulk,
  setModel,
} from "../controllers/gemini.controller.mjs";

const router = express.Router();

router.get("/models", getModel);
router.post("/models", setModel);
router.patch("/models/status", changeStatus);

router.get("/keys", getApiKey);
router.post("/keys", setApiKey);
router.post("/keys/bulk", setApiKeysBulk);

export default router;