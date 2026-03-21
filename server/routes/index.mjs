import { Router } from "express";
import govSchemeRouter from "./govscheme.routes.mjs";
import blogRouter from "./blogs.routes.mjs";
import sectionRouter from "./section.routes.mjs";
import govJobsRouter from "./govjobs.router.mjs";

const router = Router();

router.use("/gov-schemes", govSchemeRouter);
router.use("/blog", blogRouter);
router.use("/section", sectionRouter);
router.use("/jobs", govJobsRouter);

export default router;
