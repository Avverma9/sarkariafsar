const mongoose = require("mongoose");
const GovScheme  = require( "../models/schemes");
const { applyNoIndexFlag } = require("../utils/thinContentCheck");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeString = (value) => {
  if (typeof value !== "string") return value;
  return value.trim();
};

const normalizeDuplicateValue = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").toLowerCase();
};

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function hasDuplicateScheme({ schemeTitle = "", state = "", excludeId = null }) {
  const normalizedTitle = normalizeDuplicateValue(schemeTitle);
  const normalizedState = normalizeDuplicateValue(state);

  if (!normalizedTitle) return false;

  const query = {
    schemeTitle: { $regex: `^${escapeRegExp(String(schemeTitle || "").trim())}$`, $options: "i" },
    state: { $regex: `^${escapeRegExp(String(state || "").trim())}$`, $options: "i" },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await GovScheme.findOne(query).select("_id").lean();
  return Boolean(existing);
}

async function findSchemeByTitleState({ schemeTitle = "", state = "" }) {
  if (!String(schemeTitle || "").trim()) return null;

  return GovScheme.findOne({
    schemeTitle: { $regex: `^${escapeRegExp(String(schemeTitle || "").trim())}$`, $options: "i" },
    state: { $regex: `^${escapeRegExp(String(state || "").trim())}$`, $options: "i" },
  });
}

const normalizeStringArray = (arr = []) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sanitizeGovSchemeData = (input = {}) => {
  const data = { ...input };

  if ("schemeTitle" in data) data.schemeTitle = normalizeString(data.schemeTitle);
  if ("schemetype" in data) data.schemetype = normalizeString(data.schemetype);
  if ("process" in data) data.process = normalizeString(data.process);
  if ("state" in data) data.state = normalizeString(data.state);
  if ("city" in data) data.city = normalizeString(data.city);
  if ("applyLink" in data) data.applyLink = normalizeString(data.applyLink);
  if ("aboutScheme" in data) data.aboutScheme = normalizeString(data.aboutScheme);
  if ("officialSourceUrl" in data) data.officialSourceUrl = normalizeString(data.officialSourceUrl);
  if ("authorName" in data) data.authorName = normalizeString(data.authorName);
  if ("authorProfileUrl" in data) data.authorProfileUrl = normalizeString(data.authorProfileUrl);
  if ("authorBio" in data) data.authorBio = normalizeString(data.authorBio);

  if ("requiredDocs" in data) {
    data.requiredDocs = normalizeStringArray(data.requiredDocs);
  }

  if ("schemeStartDate" in data) {
    data.schemeStartDate = parseDateOrNull(data.schemeStartDate);
  }

  if ("schemeLastDate" in data) {
    data.schemeLastDate = parseDateOrNull(data.schemeLastDate);
  }

  return data;
};

const OFFICIAL_SOURCE_REGEX = /\.(gov\.in|nic\.in)(\/|$)/i;

const validateCreatePayload = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "Valid data object is required";
  }

  if (!data.schemeTitle || !String(data.schemeTitle).trim()) {
    return "schemeTitle is required";
  }

  if ("requiredDocs" in data && !Array.isArray(data.requiredDocs)) {
    return "requiredDocs must be an array";
  }

  // Mandatory official source for govt schemes
  if (!data.officialSourceUrl || !String(data.officialSourceUrl).trim()) {
    return "officialSourceUrl is required (must be a .gov.in or .nic.in link)";
  }
  if (!OFFICIAL_SOURCE_REGEX.test(data.officialSourceUrl)) {
    return "officialSourceUrl must be an official .gov.in or .nic.in link";
  }

  return null;
};

const validateUpdatePayload = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "Valid update data is required";
  }

  if ("schemeTitle" in data && !String(data.schemeTitle || "").trim()) {
    return "schemeTitle cannot be empty";
  }

  if ("requiredDocs" in data && !Array.isArray(data.requiredDocs)) {
    return "requiredDocs must be an array";
  }

  // Validate officialSourceUrl if provided during update
  if ("officialSourceUrl" in data && data.officialSourceUrl) {
    if (!OFFICIAL_SOURCE_REGEX.test(data.officialSourceUrl)) {
      return "officialSourceUrl must be an official .gov.in or .nic.in link";
    }
  }

  return null;
};

const handleMongooseError = (error, res, label) => {
  console.error(label, error);

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

// CREATE
exports.addGovScheme = async (req, res) => {
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

      const sanitizedDocs = data.map((item) => sanitizeGovSchemeData(item));

      for (const item of sanitizedDocs) {
        const validationError = validateCreatePayload(item);
        if (validationError) {
          return res.status(400).json({
            success: false,
            message: validationError,
          });
        }
      }

      const createdDocs = [];
      const patchedDocs = [];

      for (const item of sanitizedDocs) {
        const existing = await findSchemeByTitleState({
          schemeTitle: item.schemeTitle,
          state: item.state,
        });

        if (existing) {
          Object.assign(existing, {
            ...item,
            createdAt: existing.createdAt,
          });
          const saved = await existing.save();
          patchedDocs.push(saved);
        } else {
          const created = await GovScheme.create(item);
          createdDocs.push(created);
        }
      }

      return res.status(201).json({
        success: true,
        message: `${createdDocs.length} schemes created, ${patchedDocs.length} schemes patched successfully`,
        data: {
          created: createdDocs,
          patched: patchedDocs,
        },
      });
    }

    const sanitizedData = sanitizeGovSchemeData(data);
    const validationError = validateCreatePayload(sanitizedData);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const existing = await findSchemeByTitleState({
      schemeTitle: sanitizedData.schemeTitle,
      state: sanitizedData.state,
    });

    if (existing) {
      Object.assign(existing, {
        ...sanitizedData,
        createdAt: existing.createdAt,
      });
      const patched = await existing.save();

      return res.status(200).json({
        success: true,
        message: "Scheme already existed and was patched successfully",
        data: patched,
      });
    }

    const createdDoc = await GovScheme.create(sanitizedData);

    return res.status(201).json({
      success: true,
      message: "Scheme created successfully",
      data: createdDoc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Add gov scheme error:");
  }
};

// READ ALL
exports.getAllGovSchemes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      state,
      city,
      schemetype,
      search,
      sortBy = "createdAt",
      order = "desc",
      upcoming,
      expired,
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = {};

    if (state) filter.state = state.trim();
    if (city) filter.city = city.trim();
    if (schemetype) filter.schemetype = schemetype.trim();

    if (search) {
      filter.$or = [
        { schemeTitle: { $regex: search, $options: "i" } },
        { schemetype: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { process: { $regex: search, $options: "i" } },
        { aboutScheme: { $regex: search, $options: "i" } },
      ];
    }

    const now = new Date();

    if (upcoming === "true") {
      filter.schemeLastDate = { $gte: now };
    }

    if (expired === "true") {
      filter.schemeLastDate = { $lt: now };
    }

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "schemeTitle",
      "schemeStartDate",
      "schemeLastDate",
      "state",
      "city",
      "schemetype",
    ];

    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      GovScheme.find(filter)
        .sort({ [finalSortBy]: sortOrder })
        .skip(skip)
        .limit(parsedLimit),
      GovScheme.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Schemes fetched successfully",
      data: items,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    return handleMongooseError(error, res, "Get all gov schemes error:");
  }
};

// READ BY ID
exports.getGovSchemeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid scheme ID",
      });
    }

    const doc = await GovScheme.findById(id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Scheme not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Scheme fetched successfully",
      data: doc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Get gov scheme by ID error:");
  }
};

exports.getGovSchemeBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || !String(slug).trim()) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    const value = String(slug).trim();

    const doc = isValidObjectId(value)
      ? await GovScheme.findOne({ $or: [{ _id: value }, { slug: value }] })
      : await GovScheme.findOne({ slug: value });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Scheme not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Scheme fetched successfully",
      data: doc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Get gov scheme by slug error:");
  }
};

// UPDATE
exports.updateGovScheme = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid scheme ID",
      });
    }

    const validationError = validateUpdatePayload(data);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const sanitizedData = sanitizeGovSchemeData(data);

    const currentDoc = await GovScheme.findById(id).lean();
    if (!currentDoc) {
      return res.status(404).json({
        success: false,
        message: "Scheme not found",
      });
    }

    const nextTitle = "schemeTitle" in sanitizedData ? sanitizedData.schemeTitle : currentDoc.schemeTitle;
    const nextState = "state" in sanitizedData ? sanitizedData.state : currentDoc.state;

    if (await hasDuplicateScheme({ schemeTitle: nextTitle, state: nextState, excludeId: id })) {
      return res.status(409).json({
        success: false,
        message: `Scheme already exists: ${nextTitle} (${nextState || "Unknown"})`,
      });
    }

    const updatedDoc = await GovScheme.findByIdAndUpdate(id, sanitizedData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Scheme updated successfully",
      data: updatedDoc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Update gov scheme error:");
  }
};

// DELETE
exports.deleteGovScheme = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid scheme ID",
      });
    }

    const deletedDoc = await GovScheme.findByIdAndDelete(id);

    if (!deletedDoc) {
      return res.status(404).json({
        success: false,
        message: "Scheme not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Scheme deleted successfully",
      data: deletedDoc,
    });
  } catch (error) {
    return handleMongooseError(error, res, "Delete gov scheme error:");
  }
};

// NOTE: `getGovSchemeBySlug` is implemented earlier (supports ObjectId or slug).
// The earlier implementation intentionally handles both `_id` and `slug` values.
// Keep that single implementation to avoid duplicated handlers.

// GET unique state names for schemes
exports.getGovSchemeStateNameOnly = async (req, res) => {
  try {
    // Use distinct to get unique state values and filter out empty strings
    const states = await GovScheme.distinct('state', { state: { $ne: '' } });
    const cleaned = states
      .filter((s) => typeof s === 'string' && s.trim())
      .map((s) => s.trim())
      .sort((a, b) => a.localeCompare(b));

    return res.status(200).json({
      success: true,
      message: 'Scheme states fetched successfully',
      data: cleaned,
    });
  } catch (error) {
    return handleMongooseError(error, res, 'Get scheme state names error:');
  }
};

// GET schemes filtered by state (supports pagination + sorting)
exports.getGovSchemeByState = async (req, res) => {
  try {
    const {
      state,
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      upcoming,
      expired,
    } = req.query;

    if (!state || !String(state).trim()) {
      return res.status(400).json({ success: false, message: 'state query parameter is required' });
    }

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = { state: String(state).trim() };

    if (search) {
      filter.$or = [
        { schemeTitle: { $regex: search, $options: 'i' } },
        { schemetype: { $regex: search, $options: 'i' } },
        { process: { $regex: search, $options: 'i' } },
        { aboutScheme: { $regex: search, $options: 'i' } },
      ];
    }

    const now = new Date();

    if (upcoming === 'true') filter.schemeLastDate = { $gte: now };
    if (expired === 'true') filter.schemeLastDate = { $lt: now };

    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'schemeTitle',
      'schemeStartDate',
      'schemeLastDate',
      'state',
      'city',
      'schemetype',
    ];

    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      GovScheme.find(filter).sort({ [finalSortBy]: sortOrder }).skip(skip).limit(parsedLimit),
      GovScheme.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Schemes fetched successfully',
      data: items,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    return handleMongooseError(error, res, 'Get schemes by state error:');
  }
};

// ─── Sitemap endpoint — only slug + updatedAt (lightweight) ───
exports.getSitemapSchemes = async (req, res) => {
  try {
    const docs = await GovScheme.find({}, "slug updatedAt").lean();
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    return handleMongooseError(error, res, 'Sitemap schemes error:');
  }
};

// GET all schemes grouped by state with title array
exports.getGovSchemeTitlesByState = async (req, res) => {
  try {
    const docs = await GovScheme.find({}, 'schemeTitle state').lean();
    const grouped = new Map();

    for (const doc of docs) {
      const state = String(doc.state || '').trim() || 'Unknown';
      const title = String(doc.schemeTitle || '').trim();

      if (!grouped.has(state)) {
        grouped.set(state, []);
      }

      if (title) {
        grouped.get(state).push(title);
      }
    }

    const data = Array.from(grouped.entries())
      .map(([state, schemes]) => ({
        state,
        schemes: Array.from(new Set(schemes)).sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => a.state.localeCompare(b.state));

    return res.status(200).json({
      success: true,
      message: 'Scheme titles grouped by state fetched successfully',
      data,
    });
  } catch (error) {
    return handleMongooseError(error, res, 'Get scheme titles by state error:');
  }
};