import { Router } from "express";
import govSchemeRouter from "./govscheme.routes.mjs";
import blogRouter from './blogs.routes.mjs'
const router = Router();

router.use("/gov-schemes", govSchemeRouter);
router.use('/blog',blogRouter)

export default router;
