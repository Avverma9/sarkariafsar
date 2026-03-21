import { BLOG_POSTS } from "../blogData.js";
import Blog from "../models/blogs.model.mjs";

export const addBlog = async (req, res) => {
  try {
    const requestBody = req?.body;
    const data =
      Array.isArray(requestBody) && requestBody.length > 0
        ? requestBody
        : requestBody && typeof requestBody === "object" && Object.keys(requestBody).length > 0
          ? requestBody
          : BLOG_POSTS;

    if (Array.isArray(data)) {
      const operations = data
        .filter((item) => item && typeof item === "object" && String(item.slug || "").trim())
        .map((item) => ({
          updateOne: {
            filter: { slug: String(item.slug).trim() },
            update: { $set: item },
            upsert: true,
          },
        }));

      if (operations.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No valid blog payload provided",
        });
      }

      const result = await Blog.bulkWrite(operations, { ordered: false });
      return res.status(201).json({
        success: true,
        message: "Blogs synced successfully",
        created: Number(result.upsertedCount || 0),
        updated: Number(result.modifiedCount || 0),
        matched: Number(result.matchedCount || 0),
      });
    } else {
      const slug = String(data?.slug || "").trim();
      if (!slug) {
        return res.status(400).json({
          success: false,
          error: "slug is required",
        });
      }

      const blog = await Blog.findOneAndUpdate(
        { slug },
        { $set: data },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );
      return res.status(201).json({
        success: true,
        message: "Blog synced successfully",
        blogId: blog._id,
      });
    }
  } catch (error) {
    console.error("Add blog error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: "Duplicate slug exists" });
    }
    res.status(500).json({ success: false, error: "Server error", details: error?.message || String(error) });
  }
};
export const getBlog = async (req, res) => {
  try {
    const slug = String(req?.params?.slug || "").trim();
    if (!slug) {
      const blogs = await Blog.find({}).sort({ publishedAt: -1, createdAt: -1 });
      return res.status(200).json({
        success: true,
        total: blogs.length,
        blogs,
      });
    }

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: "Blog not found",
      });
    }

    return res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    console.error("Get blog error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      details: error?.message || String(error),
    });
  }
};
