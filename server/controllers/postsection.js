const mongoose = require("mongoose");
const JobSection = require("../models/postsection");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const toCanonicalUrl = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const normalizeString = (value) => {
  if (typeof value !== "string") return value;
  return value.trim();
};

const sanitizeJobSectionData = (input = {}, { isUpdate = false } = {}) => {
  const data = { ...input };

  if ("name" in data) {
    data.name = normalizeString(data.name);
  }

  if ("status" in data) {
    data.status = normalizeString(data.status)?.toLowerCase();
  }

  if ("canonicalUrl" in data && typeof data.canonicalUrl === "string") {
    data.canonicalUrl = toCanonicalUrl(data.canonicalUrl);
  }

  if ("aliases" in data) {
    data.aliases = Array.isArray(data.aliases)
      ? data.aliases
          .map((item) => normalizeString(item))
          .filter(Boolean)
      : [];
  }

  if ("sourceSectionName" in data) {
    data.sourceSectionName = normalizeString(data.sourceSectionName);
  }

  if ("sourceSectionUrl" in data) {
    data.sourceSectionUrl = normalizeString(data.sourceSectionUrl);
  }

  if (!isUpdate && !data.canonicalUrl && data.name) {
    data.canonicalUrl = toCanonicalUrl(data.name);
  }

  return data;
};

const validateCreatePayload = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "Valid data object is required";
  }

  if (!data.name || !String(data.name).trim()) {
    return "name is required";
  }

  if (data.status && !["active", "inactive"].includes(data.status)) {
    return "status must be either active or inactive";
  }

  return null;
};

const validateUpdatePayload = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "Valid update data is required";
  }

  if ("name" in data && !String(data.name || "").trim()) {
    return "name cannot be empty";
  }

  if ("status" in data && !["active", "inactive"].includes(String(data.status).trim().toLowerCase())) {
    return "status must be either active or inactive";
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

async function createJobSection(sectionData) {
  const doc = new JobSection(sectionData);
  return await doc.save();
}

// CREATE
exports.addJobSection = async (req, res) => {
  try {
    const { data } = req.body;

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

      const sanitizedDocs = data.map((item) => sanitizeJobSectionData(item));

      for (const item of sanitizedDocs) {
        const validationError = validateCreatePayload(item);
        if (validationError) {
          return res.status(400).json({
            success: false,
            message: validationError,
          });
        }
      }

      const createdDocs = await JobSection.insertMany(sanitizedDocs, { ordered: true });

      return res.status(201).json({
        success: true,
        message: `${createdDocs.length} job sections created successfully`,
        data: createdDocs,
      });
    }

    const sanitizedData = sanitizeJobSectionData(data);
    const validationError = validateCreatePayload(sanitizedData);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const createdDoc = await createJobSection(sanitizedData);

    return res.status(201).json({
      success: true,
      message: "Job section created successfully",
      data: createdDoc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Add job section error:");
  }
};

// READ ALL
exports.getAllJobSections = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = {};

    if (status) {
      filter.status = String(status).trim().toLowerCase();
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { canonicalUrl: { $regex: search, $options: "i" } },
        { aliases: { $elemMatch: { $regex: search, $options: "i" } } },
      ];
    }

    const allowedSortFields = ["createdAt", "updatedAt", "name", "status", "canonicalUrl"];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      JobSection.find(filter)
        .sort({ [finalSortBy]: sortOrder })
        .skip(skip)
        .limit(parsedLimit),
      JobSection.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Job sections fetched successfully",
      data: items,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    return handleMongooseError(error, res, "Get all job sections error:");
  }
};

// READ BY ID
exports.getJobSectionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job section ID",
      });
    }

    const doc = await JobSection.findById(id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Job section not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job section fetched successfully",
      data: doc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Get job section by ID error:");
  }
};

// READ BY CANONICAL URL
exports.getJobSectionByCanonicalUrl = async (req, res) => {
  try {
    const { canonicalUrl } = req.params;

    if (!canonicalUrl || !String(canonicalUrl).trim()) {
      return res.status(400).json({
        success: false,
        message: "canonicalUrl is required",
      });
    }

    const normalizedCanonicalUrl = toCanonicalUrl(canonicalUrl);
    const doc = await JobSection.findOne({ canonicalUrl: normalizedCanonicalUrl });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Job section not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job section fetched successfully",
      data: doc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Get job section by canonicalUrl error:");
  }
};

// UPDATE BY ID
exports.updateJobSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job section ID",
      });
    }

    const validationError = validateUpdatePayload(data);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const existingDoc = await JobSection.findById(id);

    if (!existingDoc) {
      return res.status(404).json({
        success: false,
        message: "Job section not found",
      });
    }

    const sanitizedData = sanitizeJobSectionData(data, { isUpdate: true });

    if ("name" in sanitizedData && !("canonicalUrl" in sanitizedData)) {
      sanitizedData.canonicalUrl = toCanonicalUrl(sanitizedData.name);
    }

    const updatedDoc = await JobSection.findByIdAndUpdate(id, sanitizedData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Job section updated successfully",
      data: updatedDoc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Update job section error:");
  }
};

// UPDATE BY CANONICAL URL
exports.updateJobSectionByCanonicalUrl = async (req, res) => {
  try {
    const { canonicalUrl } = req.params;
    const { data } = req.body;

    if (!canonicalUrl || !String(canonicalUrl).trim()) {
      return res.status(400).json({
        success: false,
        message: "canonicalUrl is required",
      });
    }

    const validationError = validateUpdatePayload(data);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const sanitizedData = sanitizeJobSectionData(data, { isUpdate: true });

    if ("name" in sanitizedData && !("canonicalUrl" in sanitizedData)) {
      sanitizedData.canonicalUrl = toCanonicalUrl(sanitizedData.name);
    }

    const updatedDoc = await JobSection.findOneAndUpdate(
      { canonicalUrl: toCanonicalUrl(canonicalUrl) },
      sanitizedData,
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({
        success: false,
        message: "Job section not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job section updated successfully",
      data: updatedDoc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Update job section by canonicalUrl error:");
  }
};

// DELETE BY ID
exports.deleteJobSection = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job section ID",
      });
    }

    const deletedDoc = await JobSection.findByIdAndDelete(id);

    if (!deletedDoc) {
      return res.status(404).json({
        success: false,
        message: "Job section not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job section deleted successfully",
      data: deletedDoc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Delete job section error:");
  }
};

// DELETE BY CANONICAL URL
exports.deleteJobSectionByCanonicalUrl = async (req, res) => {
  try {
    const { canonicalUrl } = req.params;

    if (!canonicalUrl || !String(canonicalUrl).trim()) {
      return res.status(400).json({
        success: false,
        message: "canonicalUrl is required",
      });
    }

    const deletedDoc = await JobSection.findOneAndDelete({
      canonicalUrl: toCanonicalUrl(canonicalUrl),
    });

    if (!deletedDoc) {
      return res.status(404).json({
        success: false,
        message: "Job section not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job section deleted successfully",
      data: deletedDoc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Delete job section by canonicalUrl error:");
  }
};
