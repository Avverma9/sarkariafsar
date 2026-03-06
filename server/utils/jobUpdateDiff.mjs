const DEFAULT_MAX_CHANGES = Number.parseInt(
  String(process.env.JOB_UPDATE_EMAIL_MAX_CHANGES || "25"),
  10
);
const MAX_VALUE_PREVIEW_LENGTH = 1600;

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === "[object Object]";

const isPrimitiveValue = (value) =>
  value === null ||
  value === undefined ||
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean";

const stableStringify = (value) => {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    const parts = keys.map(
      (key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`
    );
    return `{${parts.join(",")}}`;
  }

  return JSON.stringify(String(value));
};

const areDeepEqual = (left, right) => stableStringify(left) === stableStringify(right);

const clampPreview = (value = "") => {
  const stringValue = String(value || "");
  if (stringValue.length <= MAX_VALUE_PREVIEW_LENGTH) return stringValue;
  return `${stringValue.slice(0, MAX_VALUE_PREVIEW_LENGTH)}...`;
};

const formatValuePreview = (value) => {
  if (value === undefined) return "(missing)";
  if (value === null) return "null";
  if (typeof value === "string") return clampPreview(value);
  return clampPreview(JSON.stringify(value, null, 2));
};

const toRootField = (path = "") => {
  const parts = String(path || "").split(/\.|\[/).filter(Boolean);
  return parts[0] || "content";
};

const pushChange = (changes, path, before, after, state) => {
  changes.push({
    path: String(path || "").trim() || "content",
    field: toRootField(path),
    state,
    before,
    after,
    beforePreview: formatValuePreview(before),
    afterPreview: formatValuePreview(after),
  });
};

const diffValues = (before, after, path, changes, state) => {
  if (areDeepEqual(before, after)) return;

  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const sortedKeys = [...keys].sort((left, right) => left.localeCompare(right));
    for (const key of sortedKeys) {
      const nextPath = path ? `${path}.${key}` : key;
      diffValues(before[key], after[key], nextPath, changes, state);
    }
    return;
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const arraysArePrimitive =
      before.every(isPrimitiveValue) && after.every(isPrimitiveValue);

    if (arraysArePrimitive && before.length <= 25 && after.length <= 25) {
      pushChange(changes, path, before, after, state);
      return;
    }

    pushChange(changes, path, before, after, state);
    return;
  }

  pushChange(changes, path, before, after, state);
};

const toComparableMeta = (detail = null) => ({
  title: String(detail?.title || "").trim(),
  pageTitle: String(detail?.pageTitle || "").trim(),
  canonicalUrl: String(detail?.canonicalUrl || "").trim(),
  metaDescription: String(detail?.metaDescription || "").trim(),
  section: String(detail?.section || "").trim(),
  sourceSectionUrl: String(detail?.sourceSectionUrl || "").trim(),
});

export const createJobUpdateDiff = ({
  previousDetail = null,
  currentDetail = null,
  maxChanges = DEFAULT_MAX_CHANGES,
} = {}) => {
  const safeMaxChanges = Number.isFinite(Number(maxChanges))
    ? Math.max(1, Number(maxChanges))
    : DEFAULT_MAX_CHANGES;

  const allChanges = [];
  diffValues(
    toComparableMeta(previousDetail),
    toComparableMeta(currentDetail),
    "",
    allChanges,
    "meta"
  );
  diffValues(
    previousDetail?.jsonData ?? null,
    currentDetail?.jsonData ?? null,
    "",
    allChanges,
    "content"
  );

  const changes = allChanges.slice(0, safeMaxChanges);
  const omittedChangeCount = Math.max(0, allChanges.length - changes.length);
  const changedFields = [...new Set(changes.map((change) => change.field))];

  return {
    changedFields,
    changeCount: allChanges.length,
    omittedChangeCount,
    changes,
  };
};

export default {
  createJobUpdateDiff,
};
