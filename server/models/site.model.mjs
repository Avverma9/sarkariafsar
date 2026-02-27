import mongoose from "mongoose";

const SITE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};

const DEFAULT_SITES = [
  {
    siteName: "Sarkari Result",
    siteUrl: "https://sarkariresult.com.cm/",
    status: SITE_STATUS.ACTIVE,
  },
  {
    siteName: "Sarkari Exam",
    siteUrl: "https://www.sarkariexam.com/",
    status: SITE_STATUS.INACTIVE,
  },
  {
    siteName: "Rojgar Result",
    siteUrl: "https://www.rojgarresult.com/",
    status: SITE_STATUS.INACTIVE,
  },
];

const normalizeHost = (hostname = "") =>
  String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");

const normalizeSiteUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const parsed = new URL(raw);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Invalid siteUrl protocol");
  }

  parsed.hash = "";
  parsed.search = "";
  parsed.pathname = "/";
  return parsed.toString();
};

export const getNormalizedHostFromUrl = (value = "") => {
  try {
    const parsed = new URL(value);
    return normalizeHost(parsed.hostname);
  } catch {
    return "";
  }
};

const siteSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      required: true,
      trim: true,
    },
    siteUrl: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedHost: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: [SITE_STATUS.ACTIVE, SITE_STATUS.INACTIVE],
      default: SITE_STATUS.INACTIVE,
      lowercase: true,
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
);

siteSchema.pre("validate", function normalizeSiteDocument(next) {
  try {
    this.siteUrl = normalizeSiteUrl(this.siteUrl || "");
    this.normalizedHost = getNormalizedHostFromUrl(this.siteUrl);
    this.status = String(this.status || SITE_STATUS.INACTIVE)
      .trim()
      .toLowerCase();
    this.siteName = String(this.siteName || "").trim();

    if (!this.siteName) {
      throw new Error("siteName is required");
    }
    if (!this.siteUrl || !this.normalizedHost) {
      throw new Error("Invalid siteUrl");
    }
    if (![SITE_STATUS.ACTIVE, SITE_STATUS.INACTIVE].includes(this.status)) {
      throw new Error("status must be active or inactive");
    }

    next();
  } catch (error) {
    next(error);
  }
});

const Site = mongoose.models.Site || mongoose.model("Site", siteSchema, "sites");

const toResponseShape = (doc) => ({
  id: String(doc._id),
  siteName: doc.siteName,
  siteUrl: doc.siteUrl,
  normalizedHost: doc.normalizedHost,
  status: doc.status,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const normalizeInput = ({ siteName = "", siteUrl = "", status = SITE_STATUS.INACTIVE } = {}) => {
  const normalizedUrl = normalizeSiteUrl(siteUrl);
  const normalizedHost = getNormalizedHostFromUrl(normalizedUrl);
  const normalizedStatus = String(status || SITE_STATUS.INACTIVE)
    .trim()
    .toLowerCase();

  if (!siteName || !String(siteName).trim()) {
    throw new Error("siteName is required");
  }
  if (!normalizedUrl) {
    throw new Error("siteUrl is required");
  }
  if (![SITE_STATUS.ACTIVE, SITE_STATUS.INACTIVE].includes(normalizedStatus)) {
    throw new Error("status must be active or inactive");
  }

  return {
    siteName: String(siteName).trim(),
    siteUrl: normalizedUrl,
    normalizedHost,
    status: normalizedStatus,
  };
};

export const seedDefaultSites = async () => {
  for (const site of DEFAULT_SITES) {
    const payload = normalizeInput(site);

    await Site.updateOne(
      { normalizedHost: payload.normalizedHost },
      {
        $setOnInsert: payload,
      },
      { upsert: true }
    );
  }
};

export const upsertSite = async ({ siteName = "", siteUrl = "", status = SITE_STATUS.INACTIVE } = {}) => {
  const payload = normalizeInput({ siteName, siteUrl, status });

  const existing = await Site.findOne({ normalizedHost: payload.normalizedHost });
  if (existing) {
    existing.siteName = payload.siteName;
    existing.siteUrl = payload.siteUrl;
    existing.status = payload.status;
    await existing.save();
    return { created: false, site: toResponseShape(existing) };
  }

  const created = await Site.create(payload);
  return { created: true, site: toResponseShape(created) };
};

export const listSites = async ({ status = "" } = {}) => {
  const query = {};
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();

  if (normalizedStatus) {
    if (![SITE_STATUS.ACTIVE, SITE_STATUS.INACTIVE].includes(normalizedStatus)) {
      throw new Error("status must be active or inactive");
    }
    query.status = normalizedStatus;
  }

  const data = await Site.find(query).sort({ siteName: 1 }).lean();
  return data.map(toResponseShape);
};

export const getActiveSites = async () => listSites({ status: SITE_STATUS.ACTIVE });

export const siteModel = {
  model: Site,
  status: SITE_STATUS,
  defaults: DEFAULT_SITES,
  seedDefaults: seedDefaultSites,
  upsert: upsertSite,
  list: listSites,
  getActiveSites,
  getNormalizedHostFromUrl,
};

export { Site, SITE_STATUS, DEFAULT_SITES, normalizeSiteUrl };

export default siteModel;
