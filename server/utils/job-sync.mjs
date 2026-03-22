import JobDetails from "../models/jobdetails.model.mjs";
import { attachJobAiMonitoring } from "../ai/ai.js";
import resolveJobSection from "./job-section-resolver.mjs";
import { buildHumanStatus } from "./job-status.mjs";
import { normalizeJobInput, toComparableText } from "./job-normalize.mjs";
import {
  buildLifecycleMetadata,
  buildRecruitmentKey,
  inferPostType,
  shouldIgnoreExpiredCandidate,
} from "./job-family.mjs";

const STAGE_CLONE_EXCLUDED_FIELDS = new Set([
  "_id",
  "__v",
  "dedupeKey",
  "slug",
  "aiMonitoring",
  "createdAt",
  "updatedAt",
  "postType",
  "lifecycleStage",
  "isActive",
  "statusReason",
  "sourceDomain",
  "sourceUrl",
  "direct_links",
  "derivedFromPostId",
  "sectionName",
  "sectionCanonicalUrl",
  "status",
  "applyLastDate",
]);

const toObject = (value) => {
  if (!value) return {};
  if (typeof value?.toObject === "function") {
    return value.toObject({ versionKey: false });
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return { ...value };
  }
  return {};
};

const mergeObjects = (base = {}, incoming = {}) => ({
  ...base,
  ...incoming,
});

const normalizeTitle = (value = "") => String(value || "").trim();
const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value?.toString === "function") {
    const converted = value.toString();
    return converted && converted !== "[object Object]" ? converted : null;
  }
  return null;
};

const ensureStageTitle = ({ title = "", postType = "job" } = {}) => {
  const normalized = normalizeTitle(title);
  if (!normalized) return "";
  if (postType === "job") return normalized;
  if (new RegExp(postType.replace(/_/g, "\\s*"), "i").test(normalized)) return normalized;

  if (postType === "admit_card") return `${normalized} - Admit Card`;
  if (postType === "result") return `${normalized} - Result`;
  if (postType === "answer_key") return `${normalized} - Answer Key`;
  if (postType === "admission") return `${normalized} - Admission`;
  if (postType === "corrigendum") return `${normalized} - Corrigendum`;
  return normalized;
};

const buildRegex = (value = "") => new RegExp(`^${String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

const buildFamilyQuery = (payload = {}) => {
  const recruitmentKey = String(payload.recruitmentKey || buildRecruitmentKey(payload)).trim();
  const advertisementNumber = String(
    payload.advertisement_number || payload.advertisementNumber || ""
  ).trim();
  const strongConditions = [];

  if (recruitmentKey) {
    strongConditions.push({ recruitmentKey });
  }
  if (advertisementNumber) {
    strongConditions.push({ advertisement_number: buildRegex(advertisementNumber) });
    strongConditions.push({ advertisementNumber: buildRegex(advertisementNumber) });
  }

  if (strongConditions.length > 0) {
    if (strongConditions.length === 1) return strongConditions[0];
    return { $or: strongConditions };
  }

  const titleComparable = toComparableText(payload.jobtitle || payload.title || "");
  const conditions = [];
  if (titleComparable) {
    const titlePattern = new RegExp(String(titleComparable).replace(/\s+/g, ".*"), "i");
    conditions.push({ jobtitle: titlePattern });
    conditions.push({ title: titlePattern });
  }

  if (conditions.length === 0) return null;
  if (conditions.length === 1) return conditions[0];
  return { $or: conditions };
};

const findExistingFamily = async (payload = {}) => {
  const query = buildFamilyQuery(payload);
  if (!query) return [];
  return JobDetails.find(query).sort({ createdAt: 1, updatedAt: -1 });
};

const isDuplicateKeyError = (error) =>
  Number(error?.code) === 11000 || /duplicate key/i.test(String(error?.message || ""));

const findExistingUniqueMatch = async (payload = {}) => {
  const conditions = [];

  if (payload.dedupeKey) {
    conditions.push({ dedupeKey: String(payload.dedupeKey).trim() });
  }
  if (payload.sourceUrl) {
    conditions.push({ sourceUrl: String(payload.sourceUrl).trim() });
  }
  if (payload.slug && payload.postType) {
    conditions.push({
      slug: String(payload.slug).trim(),
      postType: String(payload.postType).trim(),
    });
  }

  if (conditions.length === 0) return null;
  return JobDetails.findOne(conditions.length === 1 ? conditions[0] : { $or: conditions });
};

const findExactStageMatch = (familyDocs = [], payload = {}) => {
  const targetType = String(payload.postType || inferPostType(payload) || "job").trim();
  const targetSourceUrl = String(payload.sourceUrl || "").trim();
  const targetSlug = String(payload.slug || "").trim();
  const targetDedupeKey = String(payload.dedupeKey || "").trim();

  const sameType = familyDocs.filter((doc) => String(doc?.postType || "job").trim() === targetType);
  if (sameType.length === 0) return null;

  if (targetSourceUrl) {
    const bySource = sameType.find((doc) => String(doc?.sourceUrl || "").trim() === targetSourceUrl);
    if (bySource) return bySource;
  }
  if (targetSlug) {
    const bySlug = sameType.find((doc) => String(doc?.slug || "").trim() === targetSlug);
    if (bySlug) return bySlug;
  }
  if (targetDedupeKey) {
    const byDedupe = sameType.find((doc) => String(doc?.dedupeKey || "").trim() === targetDedupeKey);
    if (byDedupe) return byDedupe;
  }

  return sameType.length === 1 ? sameType[0] : null;
};

const selectCloneBase = (familyDocs = []) => {
  const exactJob = familyDocs.find((doc) => String(doc?.postType || "job").trim() === "job");
  return exactJob || familyDocs[0] || null;
};

const buildBaseClonePayload = (doc) => {
  const source = toObject(doc);
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => !STAGE_CLONE_EXCLUDED_FIELDS.has(key))
  );
};

const prepareNormalizedPayload = async (rawPayload = {}) => {
  const lifecycleMetadata = buildLifecycleMetadata(rawPayload);
  const title = ensureStageTitle({
    title: rawPayload.jobtitle || rawPayload.title || "",
    postType: lifecycleMetadata.postType,
  });
  const section =
    rawPayload.sectionName && rawPayload.sectionCanonicalUrl
      ? {
          name: String(rawPayload.sectionName).trim(),
          canonicalUrl: String(rawPayload.sectionCanonicalUrl).trim(),
        }
      : await resolveJobSection({
          postType: lifecycleMetadata.postType,
          title,
          status: rawPayload.status || "",
        });

  const nextPayload = {
    ...rawPayload,
    ...lifecycleMetadata,
    sectionName: section.name,
    sectionCanonicalUrl: section.canonicalUrl,
    title,
    jobtitle: title,
    status: buildHumanStatus({
      postType: lifecycleMetadata.postType,
      applyLastDate: rawPayload.applyLastDate,
      currentStatus: rawPayload.status,
    }),
  };

  if (!nextPayload.recruitmentKey) {
    nextPayload.recruitmentKey = buildRecruitmentKey(nextPayload);
  }

  return attachJobAiMonitoring(normalizeJobInput(nextPayload));
};

const buildStageClonePayload = async ({ baseDoc = null, incomingPayload = {} } = {}) => {
  const inherited = baseDoc ? buildBaseClonePayload(baseDoc) : {};
  const mergedOfficialLinks = mergeObjects(inherited.official_links || {}, incomingPayload.official_links || {});
  const mergedDirectLinks = mergeObjects(inherited.direct_links || {}, incomingPayload.direct_links || {});
  const mergedPayload = {
    ...inherited,
    ...incomingPayload,
    official_links: mergedOfficialLinks,
    direct_links: mergedDirectLinks,
    derivedFromPostId: toIdString(baseDoc?._id),
  };

  return prepareNormalizedPayload(mergedPayload);
};

const updateFamilyLifecycle = async ({ familyDocs = [], nextPostType = "job" } = {}) => {
  if (nextPostType === "job" || familyDocs.length === 0) return;

  const lifecycleMap = {
    admit_card: "admit_card_phase",
    result: "result_phase",
    answer_key: "answer_key_phase",
    admission: "admission_phase",
  };

  const nextStage = lifecycleMap[nextPostType];
  if (!nextStage) return;

  const baseJobs = familyDocs.filter((doc) => String(doc?.postType || "job") === "job");
  if (baseJobs.length === 0) return;

  await Promise.all(
    baseJobs.map((doc) =>
      JobDetails.updateOne(
        { _id: doc._id },
        {
          $set: {
            lifecycleStage: "application_closed",
            isActive: false,
            statusReason: `Recruitment lifecycle moved to ${nextStage}.`,
          },
        }
      )
    )
  );
};

const syncSingleJobPost = async (rawPayload = {}, { dryRun = false } = {}) => {
  if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
    throw new Error("job payload is required");
  }

  const normalizedIncoming = await prepareNormalizedPayload(rawPayload);
  const familyDocs = await findExistingFamily(normalizedIncoming);
  const exactMatch = findExactStageMatch(familyDocs, normalizedIncoming);

  if (exactMatch) {
    const merged = {
      ...toObject(exactMatch),
      ...normalizedIncoming,
      aiMonitoring: undefined,
    };
    delete merged._id;
    delete merged.createdAt;
    delete merged.updatedAt;
    const payload = await prepareNormalizedPayload(merged);

    if (dryRun) {
      return {
        action: "updated",
        job: {
          ...payload,
          _id: exactMatch._id,
        },
        familyCount: familyDocs.length,
        dryRun: true,
        persisted: false,
      };
    }

    const doc = await JobDetails.findOneAndUpdate(
      { _id: exactMatch._id },
      { $set: payload },
      { new: true, runValidators: true }
    );

    return {
      action: "updated",
      job: doc,
      familyCount: familyDocs.length,
    };
  }

  if (familyDocs.length > 0 && normalizedIncoming.postType !== "job") {
    const baseDoc = selectCloneBase(familyDocs);
    const payload = await buildStageClonePayload({
      baseDoc,
      incomingPayload: normalizedIncoming,
    });

    if (dryRun) {
      return {
        action: "cloned",
        job: payload,
        familyCount: familyDocs.length + 1,
        dryRun: true,
        persisted: false,
      };
    }

    const doc = await JobDetails.create(payload);
    await updateFamilyLifecycle({
      familyDocs,
      nextPostType: payload.postType,
    });

    return {
      action: "cloned",
      job: doc,
      familyCount: familyDocs.length + 1,
    };
  }

  if (shouldIgnoreExpiredCandidate(normalizedIncoming)) {
    return {
      action: "ignored_expired",
      job: dryRun ? normalizedIncoming : null,
      familyCount: familyDocs.length,
      dryRun,
      persisted: false,
    };
  }

  if (dryRun) {
    return {
      action: "created",
      job: normalizedIncoming,
      familyCount: familyDocs.length + 1,
      dryRun: true,
      persisted: false,
    };
  }

  let doc;
  try {
    doc = await JobDetails.create(normalizedIncoming);
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    const existing = await findExistingUniqueMatch(normalizedIncoming);
    if (!existing) throw error;

    const merged = {
      ...toObject(existing),
      ...normalizedIncoming,
      aiMonitoring: undefined,
    };
    delete merged._id;
    delete merged.createdAt;
    delete merged.updatedAt;

    const payload = await prepareNormalizedPayload(merged);
    doc = await JobDetails.findOneAndUpdate(
      { _id: existing._id },
      { $set: payload },
      { new: true, runValidators: true }
    );

    return {
      action: "updated",
      job: doc,
      familyCount: familyDocs.length || 1,
      duplicateRecovered: true,
    };
  }

  return {
    action: "created",
    job: doc,
    familyCount: familyDocs.length + 1,
  };
};

const syncJobPosts = async (payloads = [], options = {}) => {
  const items = Array.isArray(payloads) ? payloads : [payloads];
  const results = [];

  for (const payload of items) {
    results.push(await syncSingleJobPost(payload, options));
  }

  return results;
};

export {
  buildFamilyQuery,
  buildStageClonePayload,
  findExistingFamily,
  findExactStageMatch,
  prepareNormalizedPayload,
  selectCloneBase,
  syncJobPosts,
  syncSingleJobPost,
  updateFamilyLifecycle,
};

export default {
  buildFamilyQuery,
  buildStageClonePayload,
  findExistingFamily,
  findExactStageMatch,
  prepareNormalizedPayload,
  selectCloneBase,
  syncJobPosts,
  syncSingleJobPost,
  updateFamilyLifecycle,
};


