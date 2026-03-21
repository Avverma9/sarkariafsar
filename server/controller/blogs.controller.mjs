import { BLOG_POSTS } from "../blogData";
import Blog from "../models/blogs.model.mjs";

export const addBlog = async (req, res) => {
  try {
    // const data = req.body;  // Fixed destructuring
    const data = BLOG_POSTS

    if (Array.isArray(data)) {
      // Bulk insert: handles array of blog objects [web:41]
      const blogs = await Blog.create(data);
      return res.status(201).json({
        success: true,
        message: `${blogs.length} blogs added successfully`,
        insertedIds: blogs.map(b => b._id)
      });
    } else {
      // Single insert
      const blog = await Blog.create(data);
      return res.status(201).json({
        success: true,
        message: 'Blog added successfully',
        blogId: blog._id
      });
    }
  } catch (error) {
    console.error('Add blog error:', error);
    // Handle validation/dupe slug errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: 'Duplicate slug exists' });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
