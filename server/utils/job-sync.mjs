import JobDetails from "../models/jobdetails.model.mjs";
import { attachJobAiMonitoring } from "../ai/ai.js";
import resolveJobSection from "./job-section-resolver.mjs";
import { buildHumanStatus } from "./job-status.mjs";
import { normalizeJobInput, toComparableText } from "./job-normalize.mjs";
import {
  buildLifecycleMetadata,
  buildRecruitmentKey,
  getIgnoredJobAction,
  inferPostType,
} from "./job-family.mjs";

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

const normalizeTitle = (value = "") => String(value || "").trim();
const toHexIdFromBufferLike = (value) => {
  const raw =
    value instanceof Uint8Array
      ? value
      : Array.isArray(value)
        ? Uint8Array.from(value)
        : value?.buffer instanceof Uint8Array
          ? value.buffer
          : Array.isArray(value?.buffer)
            ? Uint8Array.from(value.buffer)
            : null;

  if (!raw || raw.length !== 12) return null;
  return Buffer.from(raw).toString("hex");
};

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  const fromBufferLike = toHexIdFromBufferLike(value);
  if (fromBufferLike) return fromBufferLike;
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

const prepareNormalizedPayload = async (
  rawPayload = {},
  { mode = "automated" } = {}
) => {
  const isManualMode = String(mode || "").trim() === "manual";
  const lifecycleMetadata = buildLifecycleMetadata(rawPayload);
  const manualTitle = normalizeTitle(rawPayload.title || rawPayload.jobtitle || "");
  const manualJobTitle = normalizeTitle(rawPayload.jobtitle || rawPayload.title || "");
  const title = isManualMode
    ? manualTitle || manualJobTitle
    : ensureStageTitle({
        title: rawPayload.jobtitle || rawPayload.title || "",
        postType: lifecycleMetadata.postType,
      });
  const jobtitle = isManualMode ? manualJobTitle || title : title;
  const section =
    rawPayload.sectionName && rawPayload.sectionCanonicalUrl
      ? {
          name: String(rawPayload.sectionName).trim(),
          canonicalUrl: String(rawPayload.sectionCanonicalUrl).trim(),
        }
      : await resolveJobSection({
          postType: lifecycleMetadata.postType,
          title: jobtitle || title,
          status: rawPayload.status || "",
        });

  const nextPayload = {
    ...rawPayload,
    ...lifecycleMetadata,
    sectionName: section.name,
    sectionCanonicalUrl: section.canonicalUrl,
    title: title || jobtitle,
    jobtitle: jobtitle || title,
    status: buildHumanStatus({
      postType: lifecycleMetadata.postType,
      applyLastDate: rawPayload.applyLastDate,
      currentStatus: rawPayload.status,
      title: title || jobtitle,
    }),
    derivedFromPostId: toIdString(rawPayload.derivedFromPostId),
  };

  if (!nextPayload.recruitmentKey) {
    nextPayload.recruitmentKey = buildRecruitmentKey(nextPayload);
  }

  return attachJobAiMonitoring(
    normalizeJobInput(nextPayload, {
      preserveExplicitNullApplyLastDate: isManualMode,
    })
  );
};

const buildNewDetectionResult = ({ job = {}, familyCount = 0, dryRun = false } = {}) => ({
  action: "new_detected",
  job,
  familyCount,
  dryRun,
  persisted: false,
});

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
    return buildNewDetectionResult({
      job: normalizedIncoming,
      familyCount: familyDocs.length + 1,
      dryRun,
    });
  }

  const ignoredJobAction = getIgnoredJobAction(normalizedIncoming);
  if (ignoredJobAction) {
    return {
      action: ignoredJobAction,
      job: dryRun ? normalizedIncoming : null,
      familyCount: familyDocs.length,
      dryRun,
      persisted: false,
    };
  }

  if (!dryRun) {
    const existing = await findExistingUniqueMatch(normalizedIncoming);
    if (existing) {
      const merged = {
        ...toObject(existing),
        ...normalizedIncoming,
        aiMonitoring: undefined,
      };
      delete merged._id;
      delete merged.createdAt;
      delete merged.updatedAt;

      const payload = await prepareNormalizedPayload(merged);
      const doc = await JobDetails.findOneAndUpdate(
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
  }

  return buildNewDetectionResult({
    job: normalizedIncoming,
    familyCount: familyDocs.length + 1,
    dryRun,
  });
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
  findExistingFamily,
  findExactStageMatch,
  prepareNormalizedPayload,
  syncJobPosts,
  syncSingleJobPost,
};

export default {
  buildFamilyQuery,
  findExistingFamily,
  findExactStageMatch,
  prepareNormalizedPayload,
  syncJobPosts,
  syncSingleJobPost,
};


