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
  const normalizedRaw =
    parsedFormatted && typeof parsedFormatted === "object" && !Array.isArray(parsedFormatted)
      ? { ...parsedBase, ...parsedFormatted }
      : parsedBase;

  const recruitment =
    normalizedRaw?.recruitment ||
    parsedFormatted?.recruitment ||
    normalizedRaw?.content?.recruitment ||
    (normalizedRaw?.importantDates ? normalizedRaw : null) ||
    {};

  return { raw: normalizedRaw, recruitment };
}
