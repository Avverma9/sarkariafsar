export function readMaybeJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

export function normalizePostDetails(payload) {
  let base = payload?.data ?? payload?.result ?? payload?.response ?? payload?.post ?? payload;
  if (Array.isArray(base)) base = base[0] || {};
  const parsedBase = readMaybeJson(base) || base || {};
  const parsedFormatted = readMaybeJson(parsedBase?.formattedData) || parsedBase?.formattedData;

  const recruitment =
    parsedBase?.recruitment ||
    parsedFormatted?.recruitment ||
    parsedBase?.content?.recruitment ||
    (parsedBase?.importantDates ? parsedBase : null) ||
    {};

  return { raw: parsedBase, recruitment };
}
