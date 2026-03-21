import express from 'express'
import { addBlog } from '../controller/blogs.controller.mjs'

const router = express.Router()

router.post('/add-blog',addBlog)

export default router