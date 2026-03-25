const mongoose = require('mongoose');
const Blog = require('../models/blog');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeString = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

const normalizeStringArray = (arr = []) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
};

const generateSlug = (text = '') => {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const sanitizeSections = (sections = []) => {
  if (!Array.isArray(sections)) return [];

  return sections
    .filter((section) => section && typeof section === 'object')
    .map((section) => ({
      heading: normalizeString(section.heading),
      paragraphs: normalizeStringArray(section.paragraphs),
      bullets: normalizeStringArray(section.bullets)
    }))
    .filter((section) => section.heading);
};

const sanitizeBlogData = (input = {}, { isUpdate = false } = {}) => {
  const data = { ...input };

  if ('slug' in data && typeof data.slug === 'string') {
    data.slug = generateSlug(data.slug);
  }

  if (!isUpdate && !data.slug && typeof data.title === 'string') {
    data.slug = generateSlug(data.title);
  }

  if ('title' in data) data.title = normalizeString(data.title);
  if ('excerpt' in data) data.excerpt = normalizeString(data.excerpt);
  if ('readingTime' in data) data.readingTime = normalizeString(data.readingTime);
  if ('author' in data) data.author = normalizeString(data.author);
  if ('category' in data) data.category = normalizeString(data.category);
  if ('intro' in data) data.intro = normalizeString(data.intro);

  if ('tags' in data) {
    data.tags = normalizeStringArray(data.tags);
  }

  if ('sections' in data) {
    data.sections = sanitizeSections(data.sections);
  }

  if ('publishedAt' in data && data.publishedAt) {
    const parsedDate = new Date(data.publishedAt);
    if (!Number.isNaN(parsedDate.getTime())) {
      data.publishedAt = parsedDate;
    } else {
      delete data.publishedAt;
    }
  }

  return data;
};

const validateCreatePayload = (data) => {
  const requiredFields = [
    'slug',
    'title',
    'excerpt',
    'author',
    'category',
    'intro'
  ];

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      return `${field} is required`;
    }
  }

  if ('sections' in data && !Array.isArray(data.sections)) {
    return 'sections must be an array';
  }

  if (Array.isArray(data.sections)) {
    for (const section of data.sections) {
      if (!section.heading) {
        return 'Each section must have a heading';
      }
      if (section.paragraphs && !Array.isArray(section.paragraphs)) {
        return 'section.paragraphs must be an array';
      }
      if (section.bullets && !Array.isArray(section.bullets)) {
        return 'section.bullets must be an array';
      }
    }
  }

  return null;
};

const validateUpdatePayload = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return 'Valid update data is required';
  }

  if ('sections' in data && !Array.isArray(data.sections)) {
    return 'sections must be an array';
  }

  if (Array.isArray(data.sections)) {
    for (const section of data.sections) {
      if (!section || typeof section !== 'object') {
        return 'Each section must be an object';
      }
      if (!section.heading || !String(section.heading).trim()) {
        return 'Each section must have a heading';
      }
      if ('paragraphs' in section && !Array.isArray(section.paragraphs)) {
        return 'section.paragraphs must be an array';
      }
      if ('bullets' in section && !Array.isArray(section.bullets)) {
        return 'section.bullets must be an array';
      }
    }
  }

  return null;
};

const handleMongooseError = (error, res, fallbackMessage) => {
  console.error(fallbackMessage, error);

  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${duplicateField} already exists`
    });
  }

  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || 'Validation failed',
      errors: messages
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data format'
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
};

async function createBlog(blogData) {
  const blog = new Blog(blogData);
  return await blog.save();
}

exports.addBlog = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Data is required'
      });
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Data array cannot be empty'
        });
      }

      const sanitizedBlogs = data.map((item) => sanitizeBlogData(item));

      for (const blog of sanitizedBlogs) {
        const validationError = validateCreatePayload(blog);
        if (validationError) {
          return res.status(400).json({
            success: false,
            message: validationError
          });
        }
      }

      const blogs = await Blog.insertMany(sanitizedBlogs, { ordered: true });

      return res.status(201).json({
        success: true,
        message: `${blogs.length} blogs created successfully`,
        data: blogs
      });
    }

    const sanitizedData = sanitizeBlogData(data);
    const validationError = validateCreatePayload(sanitizedData);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const blog = await createBlog(sanitizedData);

    return res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog
    });
  } catch (error) {
    return handleMongooseError(error, res, 'Add blog error:');
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID'
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Blog fetched successfully',
      data: blog
    });
  } catch (error) {
    return handleMongooseError(error, res, 'Get blog by ID error:');
  }
};

exports.getAllBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      author,
      tag,
      search,
      sortBy = 'publishedAt',
      order = 'desc'
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (author) {
      filter.author = author;
    }

    if (tag) {
      filter.tags = tag;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { intro: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const allowedSortFields = ['publishedAt', 'createdAt', 'updatedAt', 'title'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'publishedAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ [finalSortBy]: sortOrder })
        .skip(skip)
        .limit(parsedLimit),
      Blog.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      message: 'Blogs fetched successfully',
      data: blogs,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    return handleMongooseError(error, res, 'Get all blogs error:');
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || !String(slug).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Slug is required'
      });
    }

    const normalizedSlug = generateSlug(slug);
    const blog = await Blog.findOne({ slug: normalizedSlug });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Blog fetched successfully',
      data: blog
    });
  } catch (error) {
    return handleMongooseError(error, res, 'Get blog by slug error:');
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID'
      });
    }

    const validationError = validateUpdatePayload(data);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const sanitizedData = sanitizeBlogData(data, { isUpdate: true });

    const updatedBlog = await Blog.findByIdAndUpdate(id, sanitizedData, {
      new: true,
      runValidators: true
    });

    if (!updatedBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog
    });
  } catch (error) {
    return handleMongooseError(error, res, 'Update blog error:');
  }
};

exports.updateBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data } = req.body;

    if (!slug || !String(slug).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Slug is required'
      });
    }

    const validationError = validateUpdatePayload(data);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const sanitizedData = sanitizeBlogData(data, { isUpdate: true });

    const updatedBlog = await Blog.findOneAndUpdate(
      { slug: generateSlug(slug) },
      sanitizedData,
      { new: true, runValidators: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog
    });
  } catch (error) {
    return handleMongooseError(error, res, 'Update blog by slug error:');
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID'
      });
    }

    const deletedBlog = await Blog.findByIdAndDelete(id);

    if (!deletedBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Blog deleted successfully',
      data: deletedBlog
    });
  } catch (error) {
    return handleMongooseError(error, res, 'Delete blog error:');
  }
};

exports.deleteBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || !String(slug).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Slug is required'
      });
    }

    const deletedBlog = await Blog.findOneAndDelete({
      slug: generateSlug(slug)
    });

    if (!deletedBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Blog deleted successfully',
      data: deletedBlog
    });
  } catch (error) {
    return handleMongooseError(error, res, 'Delete blog by slug error:');
  }
};