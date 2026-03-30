const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog');
const { cacheMiddleware } = require('../utils/cache');

// CREATE
router.post('/add', blogController.addBlog);

// READ
router.get('/', cacheMiddleware(60), blogController.getAllBlogs);
router.get('/id/:id', cacheMiddleware(120), blogController.getBlogById);
router.get('/slug/:slug', cacheMiddleware(120), blogController.getBlogBySlug);

// UPDATE
router.put('/id/:id', blogController.updateBlog);
router.put('/slug/:slug', blogController.updateBlogBySlug);

// DELETE
router.delete('/id/:id', blogController.deleteBlog);
router.delete('/slug/:slug', blogController.deleteBlogBySlug);

module.exports = router;