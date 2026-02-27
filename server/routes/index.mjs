import { Router } from "express";
import siteRouter from "./site.routes.mjs";
import govSchemeRouter from "./govscheme.routes.mjs";

const router = Router();

router.use("/site", siteRouter);
router.use("/gov-schemes", govSchemeRouter);

export default router;
