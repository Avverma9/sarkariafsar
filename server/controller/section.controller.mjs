import mongoose from "mongoose";
import JobSection, { toCanonicalUrl } from "../models/section.model.mjs";
import JobDetails from "../models/jobdetails.model.mjs";

const DEFAULT_SECTION_SEED = [
  { name: "Recent Admit Cards", status: "active" },
  { name: "Latest Gov Jobs", status: "active" },
  { name: "Results", status: "active" },
  { name: "Admission", status: "active" },
];

const getValue = (req, key, fallback = undefined) => {
  if (req?.body && req.body[key] !== undefined) return req.body[key];
  if (req?.query && req.query[key] !== undefined) return req.query[key];
  if (req?.params && req.params[key] !== undefined) return req.params[key];
  return fallback;
};

const toObject = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
};

const toInteger = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toPayload = (value = {}) => {
  const payload = toObject(value);
  const name = String(payload.name || "").trim();
  const status = String(payload.status || "active").trim().toLowerCase() || "active";
  const canonicalUrl = String(payload.canonicalUrl || "").trim() || toCanonicalUrl(name);

  if (!name) {
    throw new Error("name is required");
  }

  if (!["active", "inactive"].includes(status)) {
    throw new Error("status is invalid");
  }

  return {
    name,
    status,
    canonicalUrl,
  };
};

const toResponse = (doc) => ({
  id: String(doc?._id || ""),
  name: String(doc?.name || ""),
  status: String(doc?.status || ""),
  canonicalUrl: String(doc?.canonicalUrl || ""),
  createdAt: doc?.createdAt || null,
  updatedAt: doc?.updatedAt || null,
});

const toJobResponse = (doc) => {
  return {
    status: String(doc?.status || ""),
    slug: String(doc?.slug || ""),
    title: String(doc?.jobtitle || doc?.title || ""),
    applyLastDate: doc?.applyLastDate || null,
  };
};

const resolveSectionQuery = (req) => {
  const id = String(getValue(req, "id", "")).trim();
  const canonicalUrl = String(getValue(req, "canonicalUrl", "")).trim();

  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("invalid id");
    }
    return { _id: id };
  }

  if (canonicalUrl) {
    return { canonicalUrl };
  }

  throw new Error("id or canonicalUrl is required");
};

export const addSections = async (req, res, next) => {
  try {
    const body = req?.body;

    if (Array.isArray(body)) {
      const operations = body.map((item) => {
        const payload = toPayload(item);
        return {
          updateOne: {
            filter: { canonicalUrl: payload.canonicalUrl },
            update: { $set: payload },
            upsert: true,
          },
        };
      });

      if (operations.length === 0) {
        throw new Error("payload is required");
      }

      const result = await JobSection.bulkWrite(operations, { ordered: false });
      const sections = await JobSection.find({
        canonicalUrl: { $in: operations.map((item) => item.updateOne.filter.canonicalUrl) },
      }).sort({ name: 1 });

      return res.status(201).json({
        success: true,
        message: "Sections synced successfully",
        created: Number(result.upsertedCount || 0),
        updated: Number(result.modifiedCount || 0),
        total: sections.length,
        sections: sections.map(toResponse),
      });
    }

    const payload = toPayload(body);
    const section = await JobSection.findOneAndUpdate(
      { canonicalUrl: payload.canonicalUrl },
      { $set: payload },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(201).json({
      success: true,
      message: "Section saved successfully",
      section: toResponse(section),
    });
  } catch (error) {
    return next(error);
  }
};

export const seedSections = async (req, res, next) => {
  try {
    const operations = DEFAULT_SECTION_SEED.map((item) => {
      const payload = toPayload(item);
      return {
        updateOne: {
          filter: { canonicalUrl: payload.canonicalUrl },
          update: { $set: payload },
          upsert: true,
        },
      };
    });

    const result = await JobSection.bulkWrite(operations, { ordered: false });
    const sections = await JobSection.find({
      canonicalUrl: { $in: operations.map((item) => item.updateOne.filter.canonicalUrl) },
    }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Default sections seeded successfully",
      created: Number(result.upsertedCount || 0),
      updated: Number(result.modifiedCount || 0),
      total: sections.length,
      sections: sections.map(toResponse),
    });
  } catch (error) {
    return next(error);
  }
};

export const getSection = async (req, res, next) => {
  try {
    const hasIdentifier = Boolean(
      String(getValue(req, "id", "")).trim() ||
        String(getValue(req, "canonicalUrl", "")).trim()
    );

    if (hasIdentifier) {
      const query = resolveSectionQuery(req);
      const section = await JobSection.findOne(query);

      if (!section) {
        return res.status(404).json({
          success: false,
          message: "Section not found",
        });
      }

      return res.status(200).json({
        success: true,
        section: toResponse(section),
      });
    }

    const status = String(getValue(req, "status", "")).trim().toLowerCase();
    const search = String(getValue(req, "search", "")).trim();
    const query = {};

    if (status) {
      query.status = status;
    }
    if (search) {
      query.name = new RegExp(escapeRegExp(search), "i");
    }

    const sections = await JobSection.find(query).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      total: sections.length,
      sections: sections.map(toResponse),
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllSectionAndJobList = async (req, res, next) => {
  try {
    const status = String(getValue(req, "status", "active")).trim().toLowerCase() || "active";
    const search = String(getValue(req, "search", "")).trim();
    const activeJobsOnly = String(getValue(req, "activeJobsOnly", "")).trim().toLowerCase();
    const sectionLimit = Math.max(1, Math.min(100, toInteger(getValue(req, "sectionLimit"), 20)));
    const jobLimit = Math.max(1, Math.min(100, toInteger(getValue(req, "jobLimit"), 10)));
    const sectionQuery = {};

    if (status) {
      sectionQuery.status = status;
    }

    if (search) {
      sectionQuery.name = new RegExp(escapeRegExp(search), "i");
    }

    const sections = await JobSection.find(sectionQuery)
      .sort({ name: 1 })
      .limit(sectionLimit);

    const canonicalUrls = sections
      .map((section) => String(section?.canonicalUrl || "").trim())
      .filter(Boolean);

    const jobQuery = {};
    if (canonicalUrls.length > 0) {
      jobQuery.sectionCanonicalUrl = { $in: canonicalUrls };
    }
    if (activeJobsOnly === "true") {
      jobQuery.applyLastDate = { $gte: new Date() };
    }
    if (activeJobsOnly === "false") {
      jobQuery.applyLastDate = { $lt: new Date() };
    }

    const jobs = canonicalUrls.length > 0
      ? await JobDetails.find(jobQuery).sort({ postDate: -1, createdAt: -1 })
      : [];

    const jobsBySection = new Map();
    for (const job of jobs) {
      const key = String(job?.sectionCanonicalUrl || "").trim();
      if (!key) continue;

      const existing = jobsBySection.get(key) || [];
      if (existing.length < jobLimit) {
        existing.push(job);
      }
      jobsBySection.set(key, existing);
    }

    const sectionsWithJobs = sections.map((section) => {
      const canonicalUrl = String(section?.canonicalUrl || "").trim();
      const sectionJobs = jobsBySection.get(canonicalUrl) || [];

      return {
        sectionName: String(section?.name || ""),
        sectionCanonicalUrl: canonicalUrl,
        jobs: sectionJobs.map(toJobResponse),
      };
    });

    return res.status(200).json({
      success: true,
      total: sectionsWithJobs.length,
      filters: {
        status,
        search,
        activeJobsOnly: activeJobsOnly || "all",
        sectionLimit,
        jobLimit,
      },
      sections: sectionsWithJobs,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateSection = async (req, res, next) => {
  try {
    const query = resolveSectionQuery(req);
    const existing = await JobSection.findOne(query);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const body = toObject(req?.body || {});
    const nextName = body.name !== undefined ? String(body.name || "").trim() : existing.name;
    const nextStatus =
      body.status !== undefined
        ? String(body.status || "").trim().toLowerCase()
        : existing.status;

    const payload = toPayload({
      name: nextName,
      status: nextStatus,
      canonicalUrl:
        body.canonicalUrl !== undefined
          ? String(body.canonicalUrl || "").trim()
          : existing.canonicalUrl || toCanonicalUrl(nextName),
    });

    existing.name = payload.name;
    existing.status = payload.status;
    existing.canonicalUrl = payload.canonicalUrl;
    await existing.save();

    return res.status(200).json({
      success: true,
      message: "Section updated successfully",
      section: toResponse(existing),
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteSection = async (req, res, next) => {
  try {
    const query = resolveSectionQuery(req);
    const deleted = await JobSection.findOneAndDelete(query);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Section deleted successfully",
      section: toResponse(deleted),
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  addSections,
  seedSections,
  getSection,
  getAllSectionAndJobList,
  updateSection,
  deleteSection,
};
