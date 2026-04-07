const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog');

const noStore = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};

// CREATE
router.post('/add', blogController.addBlog);

// READ
router.get('/', noStore, blogController.getAllBlogs);
router.get('/id/:id', noStore, blogController.getBlogById);
router.get('/slug/:slug', noStore, blogController.getBlogBySlug);

// UPDATE
router.put('/id/:id', blogController.updateBlog);
router.put('/slug/:slug', blogController.updateBlogBySlug);

// DELETE
router.delete('/id/:id', blogController.deleteBlog);
router.delete('/slug/:slug', blogController.deleteBlogBySlug);

module.exports = router;