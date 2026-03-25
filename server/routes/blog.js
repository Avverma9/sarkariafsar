const express = require('express');
const router = express.Router();

const blogController = require('../controllers/blog');

// CREATE
router.post('/add', blogController.addBlog);

// READ
router.get('/', blogController.getAllBlogs);
router.get('/id/:id', blogController.getBlogById);
router.get('/slug/:slug', blogController.getBlogBySlug);

// UPDATE
router.put('/id/:id', blogController.updateBlog);
router.put('/slug/:slug', blogController.updateBlogBySlug);

// DELETE
router.delete('/id/:id', blogController.deleteBlog);
router.delete('/slug/:slug', blogController.deleteBlogBySlug);

module.exports = router;