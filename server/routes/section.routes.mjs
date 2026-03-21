import { Router } from "express";
import {
  addSections,
  deleteSection,
  getAllSectionAndJobList,
  getSection,
  seedSections,
  updateSection,
} from "../controller/section.controller.mjs";

const router = Router();

router.get("/get-all-sections", getSection);
router.get("/get-all-sections-with-jobs", getAllSectionAndJobList);
router.post("/", addSections);
router.post("/seed", seedSections);
router.get("/:id", getSection);
router.patch("/:id", updateSection);
router.delete("/:id", deleteSection);

export default router;
