const Blog = require('../models/blog');
const JobPost = require('../models/post');
const GovScheme = require('../models/schemes');

const generateSlug = (text = '') => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

exports.searchWithTitle = async (req, res) => {
  try {
    const { title } = req.query;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'title must be at least 3 characters long',
      });
    }

    const searchText = title.trim();
    const regex = new RegExp(searchText, 'i');

    const [blogs, schemes, posts] = await Promise.all([
      Blog.find(
        { title: { $regex: regex } },
        { title: 1, slug: 1 }
      ).lean(),

      GovScheme.find(
        { schemeTitle: { $regex: regex } },
        { schemeTitle: 1 }
      ).lean(),

      JobPost.find(
        { title: { $regex: regex } },
        { title: 1, slug: 1 }
      ).lean(),
    ]);

    const blogResults = blogs.map((item) => ({
      title: item.title,
      type: 'blog',
      slug: item.slug,
    }));

    const schemeResults = schemes.map((item) => ({
      title: item.schemeTitle,
      type: 'scheme',
      slug: generateSlug(item.schemeTitle),
    }));

    const postResults = posts.map((item) => ({
      title: item.title,
      type: 'post',
      slug: item.slug,
    }));

    const data = [...blogResults, ...schemeResults, ...postResults];

    return res.status(200).json({
      success: true,
      message: 'Search results fetched successfully',
      data,
    });
  } catch (error) {
    console.error('searchWithTitle error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to search data',
    });
  }
};