import mongoose from "mongoose";

const JOB_SECTION_KEYS = {
  NEW_JOBS: "new_jobs",
  ADMIT_CARD: "admit_card",
  RESULTS: "results",
  ADMISSION: "admission",
};

const DEFAULT_JOB_SECTIONS = [
  {
    key: JOB_SECTION_KEYS.NEW_JOBS,
    name: "New Jobs",
    aliases: [
      "newjobs",
      "new job",
      "new jobs",
      "latest job",
      "latest form",
      "top online form",
      "hot job",
    ],
    urls: [
      "https://www.sarkariexam.com/category/top-online-form/",
      "https://www.sarkariexam.com/category/hot-job/",
      "https://sarkariresult.com.cm/latest-jobs/",
      "https://www.rojgarresult.com/recruitments/",
    ],
  },
  {
    key: JOB_SECTION_KEYS.ADMIT_CARD,
    name: "Admit Card",
    aliases: ["admitcard", "admit card"],
    urls: [
      "https://www.sarkariexam.com/category/admit-card/",
      "https://sarkariresult.com.cm/admit-card/",
      "https://www.rojgarresult.com/admit-card/",
    ],
  },
  {
    key: JOB_SECTION_KEYS.RESULTS,
    name: "Results",
    aliases: ["result", "results", "exam result", "latest result", "answer key", "answer keys"],
    urls: [
      "https://www.sarkariexam.com/category/exam-result/",
      "https://www.sarkariexam.com/category/answer-keys/",
      "https://sarkariresult.com.cm/result/",
      "https://sarkariresult.com.cm/answer-key/",
      "https://www.rojgarresult.com/latest-result/",
      "https://www.rojgarresult.com/answer-key/",
    ],
  },
  {
    key: JOB_SECTION_KEYS.ADMISSION,
    name: "Admission",
    aliases: ["admission", "admissions"],
    urls: [
      "https://sarkariresult.com.cm/admission/",
      "https://www.rojgarresult.com/admission-rojgarresult/",
    ],
  },
];

const normalizeSectionKey = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^\w]/g, "")
    .replace(/^_+|_+$/g, "");

const toUniqueStringArray = (values = []) => {
  if (!Array.isArray(values)) return [];

  const output = [];
  const seen = new Set();

  for (const value of values) {
    const clean = String(value || "").trim();
    if (!clean) continue;
    if (seen.has(clean.toLowerCase())) continue;
    seen.add(clean.toLowerCase());
    output.push(clean);
  }

  return output;
};

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toUrlArray = (values = []) =>
  toUniqueStringArray(values).filter((value) => /^https?:\/\//i.test(value));

const normalizeAliases = (values = []) =>
  toUniqueStringArray(values)
    .map((value) => normalizeSectionKey(value))
    .filter(Boolean);

const buildReadableName = (key = "") =>
  key
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ")
    .trim();

const jobSectionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    aliases: {
      type: [String],
      default: [],
    },
    urls: {
      type: [String],
      default: [],
    },
    isManual: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

jobSectionSchema.pre("validate", function normalizeSectionDocument(next) {
  const normalizedKey = normalizeSectionKey(this.key || this.name);
  this.key = normalizedKey;
  this.name = String(this.name || buildReadableName(normalizedKey || "")).trim();
  this.aliases = normalizeAliases(this.aliases);
  this.urls = toUrlArray(this.urls);
  next();
});

const JobSection =
  mongoose.models.JobSection || mongoose.model("JobSection", jobSectionSchema, "job_sections");

const toResponseShape = (doc) => ({
  id: String(doc._id),
  key: doc.key,
  name: doc.name,
  aliases: [...(doc.aliases || [])],
  urls: [...(doc.urls || [])],
  isManual: Boolean(doc.isManual),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const mergeArrays = (...arrays) => {
  const joined = [];
  for (const array of arrays) {
    if (!Array.isArray(array)) continue;
    joined.push(...array);
  }
  return toUniqueStringArray(joined);
};

const normalizeInput = ({ name = "", key = "", aliases = [], urls = [], isManual = true } = {}) => {
  const normalizedKey = normalizeSectionKey(key || name);
  const normalizedName = String(name || buildReadableName(normalizedKey)).trim();

  if (!normalizedKey) {
    throw new Error("name or key is required");
  }

  return {
    key: normalizedKey,
    name: normalizedName,
    aliases: normalizeAliases(aliases),
    urls: toUrlArray(urls),
    isManual: Boolean(isManual),
  };
};

export const seedDefaultJobSections = async () => {
  for (const section of DEFAULT_JOB_SECTIONS) {
    const payload = normalizeInput({ ...section, isManual: false });
    await JobSection.updateOne(
      { key: payload.key },
      {
        $setOnInsert: {
          name: payload.name,
          aliases: payload.aliases,
          urls: payload.urls,
          isManual: false,
        },
      },
      { upsert: true }
    );
  }
};

export const upsertJobSection = async ({
  name = "",
  key = "",
  aliases = [],
  urls = [],
  isManual = true,
} = {}) => {
  const payload = normalizeInput({ name, key, aliases, urls, isManual });

  const existing = await JobSection.findOne({ key: payload.key });
  if (existing) {
    existing.name = payload.name || existing.name;
    existing.aliases = normalizeAliases(mergeArrays(existing.aliases, payload.aliases));
    existing.urls = toUrlArray(mergeArrays(existing.urls, payload.urls));
    existing.isManual = existing.isManual || payload.isManual;
    await existing.save();

    return { created: false, section: toResponseShape(existing) };
  }

  const created = await JobSection.create(payload);
  return { created: true, section: toResponseShape(created) };
};

export const listJobSections = async () => {
  const data = await JobSection.find({}).sort({ name: 1 }).lean();
  return data.map(toResponseShape);
};

export const findJobSectionByInput = async (section = "") => {
  const raw = String(section || "").trim();
  if (!raw) return null;

  const normalized = normalizeSectionKey(raw);
  const escaped = escapeRegExp(raw);

  const doc = await JobSection.findOne({
    $or: [{ key: normalized }, { aliases: normalized }, { name: { $regex: `^${escaped}$`, $options: "i" } }],
  }).lean();

  return doc ? toResponseShape(doc) : null;
};

export const getJobSectionUrls = async (section = "") => {
  const found = await findJobSectionByInput(section);
  return found ? [...found.urls] : [];
};

export const jobSectionsModel = {
  keys: JOB_SECTION_KEYS,
  defaults: DEFAULT_JOB_SECTIONS,
  model: JobSection,
  seedDefaults: seedDefaultJobSections,
  upsert: upsertJobSection,
  list: listJobSections,
  findBySection: findJobSectionByInput,
  getUrlsBySection: getJobSectionUrls,
};

export { JobSection, JOB_SECTION_KEYS, DEFAULT_JOB_SECTIONS, normalizeSectionKey };

export default jobSectionsModel;
