import express from "express";
import {
  addJob,
  deleteJob,
  getJob,
  getJobReminder,
  searchPosts,
  updateJob,
} from "../controller/jobs.controller.mjs";

const router = express.Router();

router.get("/reminder", getJobReminder);
router.get("/search", searchPosts);
router.get("/", getJob);
router.get("/get-post-details/:slug", getJob);
router.post("/add-job", addJob);
router.post("/", addJob);
router.patch("/:id", updateJob);
router.patch("/", updateJob);
router.delete("/:id", deleteJob);
router.delete("/", deleteJob);

export default router;
