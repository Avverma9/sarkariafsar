import mongoose from "mongoose";
import JobDetails from "../models/jobdetails.model.mjs";
import Blog from "../models/blogs.model.mjs";
import { GovScheme } from "../models/govscheme.model.mjs";
import { prepareNormalizedPayload, syncJobPosts, syncSingleJobPost } from "../utils/job-sync.mjs";

let ensuredIndexesPromise = null;

const getValue = (req, key, fallback = undefined) => {
  if (req?.body && req.body[key] !== undefined) return req.body[key];
  if (req?.query && req.query[key] !== undefined) return req.query[key];
  if (req?.params && req.params[key] !== undefined) return req.params[key];
  return fallback;
};

const toInteger = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

const toObject = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
};

const mergeDeepObjects = (baseValue, patchValue) => {
  if (Array.isArray(patchValue)) {
    return [...patchValue];
  }

  if (!patchValue || typeof patchValue !== "object") {
    return patchValue;
  }

  const base = toObject(baseValue);
  const patch = toObject(patchValue);
  const merged = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    if (Array.isArray(value)) {
      merged[key] = [...value];
      continue;
    }

    if (value && typeof value === "object") {
      merged[key] = mergeDeepObjects(base[key], value);
      continue;
    }

    merged[key] = value;
  }

  return merged;
};

const hasOwn = (value, key) =>
  Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);

const syncAliasPair = (target, patch, leftKey, rightKey) => {
  if (hasOwn(patch, leftKey)) {
    target[rightKey] = patch[leftKey];
  }
  if (hasOwn(patch, rightKey)) {
    target[leftKey] = patch[rightKey];
  }
};

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getRequestPayload = (req) => {
  const body = req?.body;

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.posts)) return body.posts;
  if (body?.post && typeof body.post === "object") return body.post;
  return body;
};

const toResponse = (doc) => {
  if (!doc) return null;

  const job =
    typeof doc.toObject === "function"
      ? doc.toObject({ versionKey: false })
      : { ...doc };

  delete job._id;
  delete job.aiMonitoring;

  return {
    id: String(doc?._id || ""),
    ...job,
  };
};

const toReminderResponse = (doc) => ({
  id: String(doc?._id || ""),
  postType: String(doc?.postType || "job"),
  lifecycleStage: String(doc?.lifecycleStage || ""),
  status: String(doc?.status || ""),
  slug: String(doc?.slug || ""),
  title: String(doc?.jobtitle || doc?.title || ""),
  sectionName: String(doc?.sectionName || ""),
  sectionCanonicalUrl: String(doc?.sectionCanonicalUrl || ""),
  applyLastDate: doc?.applyLastDate || null,
});

const toSearchResponse = ({ type = "", doc = null } = {}) => {
  if (!doc) return null;

  if (type === "job") {
    return {
      type: "job",
      id: String(doc?._id || ""),
      title: String(doc?.jobtitle || doc?.title || ""),
      slug: String(doc?.slug || ""),
      status: String(doc?.status || ""),
      sectionName: String(doc?.sectionName || ""),
      sectionCanonicalUrl: String(doc?.sectionCanonicalUrl || ""),
      date: doc?.applyLastDate || doc?.postDate || null,
    };
  }

  if (type === "blog") {
    return {
      type: "blog",
      id: String(doc?._id || ""),
      title: String(doc?.title || ""),
      slug: String(doc?.slug || ""),
      category: String(doc?.category || ""),
      author: String(doc?.author || ""),
      date: doc?.publishedAt || doc?.createdAt || null,
    };
  }

  return {
    type: "scheme",
    id: String(doc?._id || ""),
    title: String(doc?.schemeTitle || doc?.title || ""),
    slug: "",
    category: String(doc?.schemetype || ""),
    state: String(doc?.state || ""),
    city: String(doc?.city || ""),
    date: doc?.schemeLastDate || doc?.schemeStartDate || doc?.updatedAt || null,
  };
};

const resolveJobQuery = (req) => {
  const id = String(getValue(req, "id", "")).trim();
  const slug = String(getValue(req, "slug", "")).trim();
  const sectionCanonicalUrl = String(getValue(req, "sectionCanonicalUrl", "")).trim();

  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("invalid id");
    }
    return { _id: id };
  }

  if (slug) {
    return { slug };
  }

  if (sectionCanonicalUrl) {
    return { sectionCanonicalUrl };
  }

  throw new Error("id or slug or sectionCanonicalUrl is required");
};

const ensureJobIndexes = async () => {
  if (ensuredIndexesPromise) {
    return ensuredIndexesPromise;
  }

  ensuredIndexesPromise = (async () => {
    try {
      await JobDetails.collection.dropIndex("sectionCanonicalUrl_1");
    } catch {
      // Old index may not exist yet.
    }

    try {
      await JobDetails.collection.dropIndex("slug_1");
    } catch {
      // Unique slug index may still be fine, but syncIndexes will recreate as needed.
    }

    try {
      await JobDetails.syncIndexes();
    } catch (error) {
      console.error("[jobs] syncIndexes warning:", error?.message || error);
    }
  })();

  return ensuredIndexesPromise;
};

export const addJob = async (req, res, next) => {
  try {
    await ensureJobIndexes();
    const body = getRequestPayload(req);

    if (Array.isArray(body)) {
      if (body.length === 0) {
        throw new Error("payload is required");
      }
      const result = await syncJobPosts(body);
      const counts = result.reduce(
        (accumulator, entry) => {
          accumulator[entry.action] = (accumulator[entry.action] || 0) + 1;
          return accumulator;
        },
        {}
      );

      return res.status(201).json({
        success: true,
        message: "Jobs synced successfully",
        created: Number(counts.created || 0),
        updated: Number(counts.updated || 0),
        cloned: Number(counts.cloned || 0),
        ignoredClosed: Number(counts.ignored_closed || 0),
        ignoredExpired: Number(counts.ignored_expired || 0),
      });
    }

    const result = await syncSingleJobPost(body);

    return res.status(201).json({
      success: true,
      message: `Job ${result.action} successfully`,
      action: result.action,
      job: toResponse(result.job),
    });
  } catch (error) {
    return next(error);
  }
};

export const getJob = async (req, res, next) => {
  try {
    const hasIdentifier = Boolean(
      String(getValue(req, "id", "")).trim() ||
        String(getValue(req, "slug", "")).trim()
    );

    if (hasIdentifier) {
      const query = resolveJobQuery(req);
      const job = await JobDetails.findOne(query);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      return res.status(200).json({
        success: true,
        job: toResponse(job),
      });
    }

    const sectionName = String(getValue(req, "sectionName", "")).trim();
    const sectionCanonicalUrl = String(getValue(req, "sectionCanonicalUrl", "")).trim();
    const search = String(getValue(req, "search", "")).trim();
    const active = String(getValue(req, "active", "")).trim().toLowerCase();
    const page = Math.max(1, toInteger(getValue(req, "page"), 1));
    const limit = Math.max(1, Math.min(100, toInteger(getValue(req, "limit"), 20)));
    const query = {};

    if (sectionName) {
      query.sectionName = new RegExp(`^${escapeRegExp(sectionName)}$`, "i");
    }
    if (sectionCanonicalUrl) {
      query.sectionCanonicalUrl = sectionCanonicalUrl;
    }
    if (search) {
      query.$or = [
        { jobtitle: new RegExp(escapeRegExp(search), "i") },
        { title: new RegExp(escapeRegExp(search), "i") },
        { slug: new RegExp(escapeRegExp(search), "i") },
        { recruitmentKey: new RegExp(escapeRegExp(search), "i") },
      ];
    }
    if (active === "true") {
      query.isActive = true;
    }
    if (active === "false") {
      query.isActive = false;
    }

    const [total, jobs] = await Promise.all([
      JobDetails.countDocuments(query),
      JobDetails.find(query)
        .sort({ postDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      jobs: jobs.map(toResponse),
    });
  } catch (error) {
    return next(error);
  }
};

export const getJobReminder = async (req, res, next) => {
  try {
    const days = Math.max(1, Math.min(365, toInteger(getValue(req, "days"), 7)));
    const limit = Math.max(1, Math.min(200, toInteger(getValue(req, "limit"), 50)));
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + days);

    const jobs = await JobDetails.find({
      applyLastDate: {
        $gte: now,
        $lte: expiryDate,
      },
    })
      .sort({ applyLastDate: 1, postDate: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      days,
      total: jobs.length,
      jobs: jobs.map(toReminderResponse),
    });
  } catch (error) {
    return next(error);
  }
};

export const searchPosts = async (req, res, next) => {
  try {
    const queryText = String(getValue(req, "q", getValue(req, "title", ""))).trim();
    const limit = Math.max(1, Math.min(50, toInteger(getValue(req, "limit"), 10)));

    if (!queryText) {
      throw new Error("q or title is required");
    }

    const pattern = new RegExp(escapeRegExp(queryText), "i");

    const [jobs, blogs, schemes] = await Promise.all([
      JobDetails.find({
        $or: [
          { jobtitle: pattern },
          { title: pattern },
          { slug: pattern },
          { sectionName: pattern },
          { recruitmentKey: pattern },
        ],
      })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(limit),
      Blog.find({
        $or: [
          { title: pattern },
          { slug: pattern },
          { excerpt: pattern },
          { category: pattern },
          { tags: pattern },
        ],
      })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(limit),
      GovScheme.find({
        $or: [
          { schemeTitle: pattern },
          { schemetype: pattern },
          { state: pattern },
          { city: pattern },
          { aboutScheme: pattern },
        ],
      })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(limit),
    ]);

    const results = [
      ...jobs.map((doc) => toSearchResponse({ type: "job", doc })),
      ...blogs.map((doc) => toSearchResponse({ type: "blog", doc })),
      ...schemes.map((doc) => toSearchResponse({ type: "scheme", doc })),
    ];

    return res.status(200).json({
      success: true,
      query: queryText,
      total: results.length,
      counts: {
        jobs: jobs.length,
        blogs: blogs.length,
        schemes: schemes.length,
      },
      results,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const query = resolveJobQuery(req);
    const existing = await JobDetails.findOne(query);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const body = getRequestPayload(req);
    const mergedPayload = mergeDeepObjects(
      mergeDeepObjects(existing.toObject({ versionKey: false }), toObject(body || {})),
      body?.post ? toObject(body.post) : {}
    );
    syncAliasPair(mergedPayload, toObject(body || {}), "advertisementNumber", "advertisement_number");
    syncAliasPair(mergedPayload, toObject(body || {}), "conductingAuthority", "conducting_authority");
    delete mergedPayload._id;
    delete mergedPayload.createdAt;
    delete mergedPayload.updatedAt;

    const payload = await prepareNormalizedPayload(mergedPayload, {
      mode: "manual",
    });
    existing.set(payload);
    await existing.save();

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      job: toResponse(existing),
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const query = resolveJobQuery(req);
    const deleted = await JobDetails.findOneAndDelete(query);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
      job: toResponse(deleted),
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  addJob,
  getJob,
  getJobReminder,
  searchPosts,
  updateJob,
  deleteJob,
};
