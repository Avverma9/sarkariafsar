import mongoose from "mongoose";

const toCleanString = (value = "") => String(value || "").trim();

const toUniqueStringArray = (values = []) => {
  if (!Array.isArray(values)) return [];

  const output = [];
  const seen = new Set();
  for (const value of values) {
    const clean = toCleanString(value);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(clean);
  }
  return output;
};

const toRequiredDocsArray = (value = []) => {
  if (Array.isArray(value)) return toUniqueStringArray(value);
  if (typeof value === "string") {
    return toUniqueStringArray(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }
  return [];
};

const normalizeApplyLink = (value = "") => {
  const raw = toCleanString(value);
  if (!raw) return "";

  const parsed = new URL(raw);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Invalid applyLink protocol");
  }
  parsed.hash = "";
  return parsed.toString();
};

const toDateOrNull = (value, fieldName = "date") => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} is invalid date`);
  }
  return parsed;
};

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const govSchemeSchema = new mongoose.Schema(
  {
    schemeTitle: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    schemetype: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    requiredDocs: {
      type: [String],
      default: [],
    },
    process: {
      type: String,
      default: "",
      trim: true,
    },
    state: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    schemeStartDate: {
      type: Date,
      default: null,
      index: true,
    },
    schemeLastDate: {
      type: Date,
      default: null,
      index: true,
    },
    applyLink: {
      type: String,
      default: "",
      trim: true,
    },
    aboutScheme: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    strict: false,
    minimize: false,
    timestamps: true,
  }
);

govSchemeSchema.pre("validate", function normalizeGovSchemeDoc(next) {
  try {
    this.schemeTitle = toCleanString(this.schemeTitle || this.title || "");
    if (!this.schemeTitle) {
      throw new Error("schemeTitle is required");
    }

    this.requiredDocs = toRequiredDocsArray(this.requiredDocs || []);
    this.process = toCleanString(this.process || "");
    this.state = toCleanString(this.state || "");
    this.city = toCleanString(this.city || "");

    const normalizedStartDate = toDateOrNull(this.schemeStartDate, "schemeStartDate");
    if (normalizedStartDate !== undefined) this.schemeStartDate = normalizedStartDate;

    const normalizedLastDate = toDateOrNull(this.schemeLastDate, "schemeLastDate");
    if (normalizedLastDate !== undefined) this.schemeLastDate = normalizedLastDate;

    if (this.schemeStartDate && this.schemeLastDate && this.schemeStartDate > this.schemeLastDate) {
      throw new Error("schemeStartDate cannot be greater than schemeLastDate");
    }

    if (this.applyLink) {
      this.applyLink = normalizeApplyLink(this.applyLink);
    }

    next();
  } catch (error) {
    next(error);
  }
});

const GovScheme =
  mongoose.models.GovScheme ||
  mongoose.model("GovScheme", govSchemeSchema, "gov_schemes");

const toResponseShape = (doc) => {
  const source = doc?.toObject ? doc.toObject() : { ...(doc || {}) };
  const id = String(source._id);
  delete source._id;
  delete source.__v;
  return { id, ...source };
};

const extractSchemePayload = (payload = {}, { partial = false } = {}) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("payload must be an object");
  }

  const knownKeys = new Set([
    "schemeTitle",
    "title",
    "requiredDocs",
    "process",
    "state",
    "city",
    "schemeStartDate",
    "schemeLastDate",
    "applyLink",
  ]);

  const data = {};

  if (!partial || payload.schemeTitle !== undefined || payload.title !== undefined) {
    const schemeTitle = toCleanString(payload.schemeTitle || payload.title || "");
    if (!partial && !schemeTitle) {
      throw new Error("schemeTitle is required");
    }
    if (partial && (payload.schemeTitle !== undefined || payload.title !== undefined) && !schemeTitle) {
      throw new Error("schemeTitle cannot be empty");
    }
    if (schemeTitle) data.schemeTitle = schemeTitle;
  }

  if (!partial || payload.requiredDocs !== undefined) {
    data.requiredDocs = toRequiredDocsArray(payload.requiredDocs || []);
  }

  if (!partial || payload.process !== undefined) {
    data.process = toCleanString(payload.process || "");
  }

  if (!partial || payload.state !== undefined) {
    data.state = toCleanString(payload.state || "");
  }

  if (!partial || payload.city !== undefined) {
    data.city = toCleanString(payload.city || "");
  }

  if (!partial || payload.applyLink !== undefined) {
    const applyLink = toCleanString(payload.applyLink || "");
    data.applyLink = applyLink ? normalizeApplyLink(applyLink) : "";
  }

  if (!partial || payload.schemeStartDate !== undefined) {
    data.schemeStartDate = toDateOrNull(payload.schemeStartDate, "schemeStartDate");
  }

  if (!partial || payload.schemeLastDate !== undefined) {
    data.schemeLastDate = toDateOrNull(payload.schemeLastDate, "schemeLastDate");
  }

  if (
    data.schemeStartDate &&
    data.schemeLastDate &&
    data.schemeStartDate > data.schemeLastDate
  ) {
    throw new Error("schemeStartDate cannot be greater than schemeLastDate");
  }

  const extra = {};
  for (const [key, value] of Object.entries(payload)) {
    if (knownKeys.has(key)) continue;
    extra[key] = value;
  }

  return { data, extra };
};

export const createGovSchemeEntry = async (payload = {}) => {
  const { data, extra } = extractSchemePayload(payload, { partial: false });
  const created = await GovScheme.create({
    ...extra,
    ...data,
  });
  return toResponseShape(created);
};

export const listGovSchemeEntries = async ({
  title = "",
  state = "",
  city = "",
  page = 1,
  limit = 20,
} = {}) => {
  const safePage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
  const safeLimit = Number.isFinite(Number(limit))
    ? Math.max(1, Math.min(100, Number(limit)))
    : 20;

  const query = {};
  const normalizedTitle = toCleanString(title);
  const normalizedState = toCleanString(state);
  const normalizedCity = toCleanString(city);

  if (normalizedTitle) {
    query.schemeTitle = new RegExp(escapeRegExp(normalizedTitle), "i");
  }
  if (normalizedState) {
    query.state = new RegExp(`^${escapeRegExp(normalizedState)}$`, "i");
  }
  if (normalizedCity) {
    query.city = new RegExp(`^${escapeRegExp(normalizedCity)}$`, "i");
  }

  const [docs, total] = await Promise.all([
    GovScheme.find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    GovScheme.countDocuments(query),
  ]);

  return {
    total,
    page: safePage,
    limit: safeLimit,
    schemes: docs.map(toResponseShape),
  };
};

export const listAllGovSchemeEntries = async () => {
  const docs = await GovScheme.find({})
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  return docs.map(toResponseShape);
};

export const listGovSchemeStateNamesOnly = async () => {
  const states = await GovScheme.distinct("state", {
    state: { $nin: ["", null] },
  });

  const cleanedStates = states
    .map((item) => toCleanString(item))
    .filter(Boolean)
    .sort((left, right) =>
      left.localeCompare(right, "en", { sensitivity: "base" })
    );

  return toUniqueStringArray(cleanedStates);
};

export const listGovSchemeEntriesByState = async ({ state = "" } = {}) => {
  const normalizedState = toCleanString(state);
  if (!normalizedState) {
    throw new Error("state is required");
  }

  const query = {
    state: new RegExp(`^${escapeRegExp(normalizedState)}$`, "i"),
  };

  const docs = await GovScheme.find(query)
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  return docs.map(toResponseShape);
};

export const getGovSchemeEntryById = async (id = "") => {
  const normalizedId = toCleanString(id);
  if (!normalizedId) {
    throw new Error("id is required");
  }
  if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
    throw new Error("Invalid id");
  }

  const doc = await GovScheme.findById(normalizedId).lean();
  return doc ? toResponseShape(doc) : null;
};

export const patchGovSchemeEntryById = async ({ id = "", payload = {} } = {}) => {
  const normalizedId = toCleanString(id);
  if (!normalizedId) {
    throw new Error("id is required");
  }
  if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
    throw new Error("Invalid id");
  }

  const { data, extra } = extractSchemePayload(payload, { partial: true });
  const doc = await GovScheme.findById(normalizedId);
  if (!doc) return null;

  Object.assign(doc, extra, data);
  await doc.save();
  return toResponseShape(doc);
};

export const govSchemeModel = {
  model: GovScheme,
  createScheme: createGovSchemeEntry,
  listSchemes: listGovSchemeEntries,
  getAllSchemes: listAllGovSchemeEntries,
  getStateNamesOnly: listGovSchemeStateNamesOnly,
  getSchemesByState: listGovSchemeEntriesByState,
  getSchemeById: getGovSchemeEntryById,
  patchSchemeById: patchGovSchemeEntryById,
};

export { GovScheme, govSchemeSchema };

export default govSchemeModel;
