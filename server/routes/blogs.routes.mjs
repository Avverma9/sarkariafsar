import express from "express";
import { addBlog, getBlog } from "../controller/blogs.controller.mjs";

const router = express.Router();

router.get("/get-all-blogs", getBlog);
router.get("/get-all-blogs/:slug", getBlog);
router.post("/add-blog", addBlog);

export default router;
