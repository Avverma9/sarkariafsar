function toText(value) {
  return String(value || "").trim();
}

export function omitSearchParams(searchParams = {}, keysToOmit = []) {
  const omit = new Set(keysToOmit.map((key) => toText(key)));
  const entries = Object.entries(searchParams || {});
  const cleaned = {};
  let hadOmittedKey = false;

  for (const [rawKey, rawValue] of entries) {
    const key = toText(rawKey);
    if (!key) continue;

    if (omit.has(key)) {
      hadOmittedKey = true;
      continue;
    }

    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    const text = toText(value);
    if (!text) continue;
    cleaned[key] = text;
  }

  return { cleaned, hadOmittedKey };
}

export function toQueryString(searchParams = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams || {})) {
    const cleanedKey = toText(key);
    const cleanedValue = toText(value);
    if (!cleanedKey || !cleanedValue) continue;
    params.set(cleanedKey, cleanedValue);
  }
  return params.toString();
}
