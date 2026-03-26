const mongoose = require("mongoose");
const JobPost = require("../models/post");
const { postData } = require("../bulk-post");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeString = (value) => {
  if (typeof value !== "string") return value;
  return value.trim();
};

const normalizeStringArray = (arr = []) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const generateSlug = (text = "") => {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;

  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      out[key] = value.trim();
    } else if (Array.isArray(value)) {
      out[key] = value.map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") return sanitizeObject(item);
        return item;
      });
    } else if (value && typeof value === "object") {
      out[key] = sanitizeObject(value);
    } else {
      out[key] = value;
    }
  }
  return out;
};

const sanitizeJobPostData = (input = {}, { isUpdate = false } = {}) => {
  const data = sanitizeObject({ ...input });

  if ("title" in data) data.title = normalizeString(data.title);
  if ("jobtitle" in data) data.jobtitle = normalizeString(data.jobtitle);
  if ("category" in data) data.category = normalizeString(data.category);
  if ("sectionName" in data) data.sectionName = normalizeString(data.sectionName);
  if ("sectionCanonicalUrl" in data) {
    data.sectionCanonicalUrl = normalizeString(data.sectionCanonicalUrl);
  }
  if ("language" in data) data.language = normalizeString(data.language);
  if ("status" in data) data.status = normalizeString(data.status);
  if ("dedupeKey" in data) data.dedupeKey = normalizeString(data.dedupeKey);
  if ("advertisement_number" in data) {
    data.advertisement_number = normalizeString(data.advertisement_number);
  }
  if ("advertisementNumber" in data) {
    data.advertisementNumber = normalizeString(data.advertisementNumber);
  }
  if ("conducting_authority" in data) {
    data.conducting_authority = normalizeString(data.conducting_authority);
  }
  if ("conductingAuthority" in data) {
    data.conductingAuthority = normalizeString(data.conductingAuthority);
  }
  if ("disclaimer" in data) data.disclaimer = normalizeString(data.disclaimer);

  if ("tags" in data) {
    data.tags = normalizeStringArray(data.tags);
  }

  if ("slug" in data && typeof data.slug === "string") {
    data.slug = generateSlug(data.slug);
  }

  if (!isUpdate && !data.slug && data.title) {
    data.slug = generateSlug(data.title);
  }

  if ("applyLastDate" in data && data.applyLastDate) {
    const parsedDate = new Date(data.applyLastDate);
    if (!Number.isNaN(parsedDate.getTime())) {
      data.applyLastDate = parsedDate;
    } else {
      delete data.applyLastDate;
    }
  }

  return data;
};

const validateCreatePayload = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "Valid data object is required";
  }

  const requiredFields = [ "title"];
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === "string" && !data[field].trim())) {
      return `${field} is required`;
    }
  }

  if (!data.slug && !data.title) {
    return "slug or title is required";
  }

  return null;
};

const validateUpdatePayload = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "Valid update data is required";
  }
  return null;
};

const handleMongooseError = (error, res, fallbackLabel) => {
  console.error(fallbackLabel, error);

  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `${duplicateField} already exists`,
    });
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || "Validation failed",
      errors: messages,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid data format",
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
  });
};

async function createJobPost(jobData) {
  const doc = new JobPost(jobData);
  return await doc.save();
}

// CREATE
exports.addJobPost = async (req, res) => {
  try {
    // Prefer request body data; fall back to bundled `postData` for seeding
    const { data: bodyData } = req.body || {};
    const data = bodyData !== undefined ? bodyData : postData;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Data is required",
      });
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Data array cannot be empty",
        });
      }

      const rawDocs = data.map((item) => item?.post || item);

      const sanitizedDocs = rawDocs.map((item) => sanitizeJobPostData(item));

      for (const item of sanitizedDocs) {
        const validationError = validateCreatePayload(item);
        if (validationError) {
          return res.status(400).json({
            success: false,
            message: validationError,
          });
        }
      }

      const createdDocs = await JobPost.insertMany(sanitizedDocs, {
        ordered: false,
      });

      return res.status(201).json({
        success: true,
        message: `${createdDocs.length} job posts created successfully`,
        data: createdDocs,
      });
    }

    const rawDoc = data?.post || data;
    const sanitizedData = sanitizeJobPostData(rawDoc);
    const validationError = validateCreatePayload(sanitizedData);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const createdDoc = await createJobPost(sanitizedData);

    return res.status(201).json({
      success: true,
      message: "Job post created successfully",
      data: createdDoc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Add job post error:");
  }
};
exports.getExpiringJobPostsReminder = async (req, res) => {
  try {
    const { days , page , limit , category, sectionCanonicalUrl } = req.query;

    const parsedDays = parseInt(days, 10);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const skip = (parsedPage - 1) * parsedLimit;

    if (Number.isNaN(parsedDays) || parsedDays < 0) {
      return res.status(400).json({
        success: false,
        message: "days must be a valid non-negative number",
      });
    }

    const now = new Date();

    // today start
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    // target day end
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parsedDays);
    endDate.setHours(23, 59, 59, 999);

    const filter = {
      applyLastDate: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (category) {
      filter.category = String(category).trim();
    }

    if (sectionCanonicalUrl) {
      filter.sectionCanonicalUrl = String(sectionCanonicalUrl).trim();
    }

    const [posts, total] = await Promise.all([
      JobPost.find(filter)
        .sort({ applyLastDate: 1 })
        .skip(skip)
        .limit(parsedLimit),
      JobPost.countDocuments(filter),
    ]);

    const enrichedPosts = posts.map((post) => {
      const applyDate = post.applyLastDate ? new Date(post.applyLastDate) : null;

      let daysLeft = null;
      if (applyDate) {
        const tempApplyDate = new Date(applyDate);
        tempApplyDate.setHours(23, 59, 59, 999);

        daysLeft = Math.ceil(
          (tempApplyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      return {
        ...post.toObject(),
        daysLeft,
      };
    });

    return res.status(200).json({
      success: true,
      message: `Found ${total} job posts expiring within ${parsedDays} day(s)`,
      data: enrichedPosts,
      reminder: {
        days: parsedDays,
        from: startDate,
        to: endDate,
        totalExpiringPosts: total,
      },
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error("Get expiring job posts reminder error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch expiring job posts",
    });
  }
};
// READ ALL
exports.getAllJobPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      language,
      tag,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (language) filter.language = language;
    if (tag) filter.tags = tag;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { jobtitle: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { dedupeKey: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { advertisement_number: { $regex: search, $options: "i" } },
        { advertisementNumber: { $regex: search, $options: "i" } },
        { conducting_authority: { $regex: search, $options: "i" } },
        { conductingAuthority: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "applyLastDate",
      "title",
      "category",
      "status",
    ];

    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      JobPost.find(filter)
        .sort({ [finalSortBy]: sortOrder })
        .skip(skip)
        .limit(parsedLimit),
      JobPost.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Job posts fetched successfully",
      data: items,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    return handleMongooseError(error, res, "Get all job posts error:");
  }
};

// READ BY ID
exports.getJobPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job post ID",
      });
    }

    const doc = await JobPost.findById(id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job post fetched successfully",
      data: doc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Get job post by ID error:");
  }
};

// READ BY SLUG
exports.getJobPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || !String(slug).trim()) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    const normalizedSlug = generateSlug(slug);
    const doc = await JobPost.findOne({ slug: normalizedSlug });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job post fetched successfully",
      data: doc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Get job post by slug error:");
  }
};

// READ BY DEDUPE KEY
exports.getJobPostByDedupeKey = async (req, res) => {
  try {
    const { dedupeKey } = req.params;

    if (!dedupeKey || !String(dedupeKey).trim()) {
      return res.status(400).json({
        success: false,
        message: "dedupeKey is required",
      });
    }

    const doc = await JobPost.findOne({ dedupeKey: dedupeKey.trim() });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job post fetched successfully",
      data: doc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Get job post by dedupeKey error:");
  }
};

// UPDATE BY ID
exports.updateJobPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job post ID",
      });
    }

    const validationError = validateUpdatePayload(data);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const sanitizedData = sanitizeJobPostData(data, { isUpdate: true });

    const updatedDoc = await JobPost.findByIdAndUpdate(id, sanitizedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedDoc) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job post updated successfully",
      data: updatedDoc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Update job post error:");
  }
};

// UPDATE BY SLUG
exports.updateJobPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data } = req.body;

    if (!slug || !String(slug).trim()) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    const validationError = validateUpdatePayload(data);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const sanitizedData = sanitizeJobPostData(data, { isUpdate: true });

    const updatedDoc = await JobPost.findOneAndUpdate(
      { slug: generateSlug(slug) },
      sanitizedData,
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job post updated successfully",
      data: updatedDoc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Update job post by slug error:");
  }
};

// DELETE BY ID
exports.deleteJobPost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job post ID",
      });
    }

    const deletedDoc = await JobPost.findByIdAndDelete(id);

    if (!deletedDoc) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job post deleted successfully",
      data: deletedDoc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Delete job post error:");
  }
};

// DELETE BY SLUG
exports.deleteJobPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || !String(slug).trim()) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    const deletedDoc = await JobPost.findOneAndDelete({
      slug: generateSlug(slug),
    });

    if (!deletedDoc) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job post deleted successfully",
      data: deletedDoc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Delete job post by slug error:");
  }
};



exports.getPostsWithSection = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      language,
      sectionCanonicalUrl,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const matchStage = {};

    if (category) matchStage.category = String(category).trim();
    if (status) matchStage.status = String(status).trim();
    if (language) matchStage.language = String(language).trim();
    if (sectionCanonicalUrl) {
      matchStage.sectionCanonicalUrl = String(sectionCanonicalUrl).trim();
    }

    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: "i" } },
        { jobtitle: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { sectionName: { $regex: search, $options: "i" } },
        { sectionCanonicalUrl: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "applyLastDate",
      "title",
      "category",
      "status",
      "sectionName",
    ];

    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const pipeline = [
      { $match: matchStage },

      // First try join by canonical URL
      {
        $lookup: {
          from: "jobsections",
          localField: "sectionCanonicalUrl",
          foreignField: "canonicalUrl",
          as: "sectionByCanonical",
        },
      },

      // Fallback join by section name
      {
        $lookup: {
          from: "jobsections",
          localField: "sectionName",
          foreignField: "name",
          as: "sectionByName",
        },
      },

      // Pick sectionByCanonical first, otherwise sectionByName
      {
        $addFields: {
          section: {
            $ifNull: [
              { $arrayElemAt: ["$sectionByCanonical", 0] },
              { $arrayElemAt: ["$sectionByName", 0] },
            ],
          },
        },
      },

      {
        $project: {
          sectionByCanonical: 0,
          sectionByName: 0,
        },
      },

      { $sort: { [finalSortBy]: sortOrder } },
      { $skip: skip },
      { $limit: parsedLimit },
    ];

    const countPipeline = [{ $match: matchStage }, { $count: "total" }];

    const [posts, countResult] = await Promise.all([
      JobPost.aggregate(pipeline),
      JobPost.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      message: "Job posts with section fetched successfully",
      data: posts,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error("Get posts with section error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch posts with section",
    });
  }
};

exports.getPostListBySectionCanonicalUrl = async (req, res) => {
  try {
    const { sectionCanonicalUrl } = req.params;
    const { page = 1, limit = 50, search, order = "desc" } = req.query;

    if (!sectionCanonicalUrl || !String(sectionCanonicalUrl).trim()) {
      return res.status(400).json({
        success: false,
        message: "sectionCanonicalUrl is required",
      });
    }

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const skip = (parsedPage - 1) * parsedLimit;
    const normalizedSectionCanonicalUrl = String(sectionCanonicalUrl).trim();

    const filter = {
      sectionCanonicalUrl: normalizedSectionCanonicalUrl,
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const sortOrder = order === "asc" ? 1 : -1;

    const sortStage = { updatedAt: sortOrder, createdAt: sortOrder };
    const pipeline = [
      { $match: filter },
      { $sort: sortStage },
      {
        $group: {
          _id: {
            slug: "$slug",
            sourceUrl: "$sourceUrl",
          },
          doc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: sortStage },
      {
        $project: {
          title: 1,
          slug: 1,
          sectionName: 1,
          sectionCanonicalUrl: 1,
          sourceUrl: 1,
          updatedAt: 1,
        },
      },
      { $skip: skip },
      { $limit: parsedLimit },
    ];

    const countPipeline = [
      { $match: filter },
      {
        $group: {
          _id: {
            slug: "$slug",
            sourceUrl: "$sourceUrl",
          },
        },
      },
      { $count: "total" },
    ];

    const [posts, countResult] = await Promise.all([
      JobPost.aggregate(pipeline),
      JobPost.aggregate(countPipeline),
    ]);
    const total = countResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      message: "Job post list fetched successfully",
      data: posts,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error("Get post list by section canonicalUrl error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch job post list",
    });
  }
};
