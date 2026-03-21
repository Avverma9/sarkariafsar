const DEFAULT_CLIENT_CACHE = "no-store";

function uniqueStrings(values = []) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
}

export function buildJsonFetchOptions({
  method = "GET",
  headers = {},
  revalidate,
  tags = [],
  ...restOptions
} = {}) {
  const normalizedMethod = String(method || "GET").toUpperCase();
  const resolvedHeaders = new Headers(headers);
  const hasBody =
    restOptions.body !== undefined &&
    restOptions.body !== null &&
    restOptions.body !== "";

  if (hasBody && !resolvedHeaders.has("Content-Type")) {
    resolvedHeaders.set("Content-Type", "application/json");
  }

  const fetchOptions = {
    method: normalizedMethod,
    ...restOptions,
  };

  if ([...resolvedHeaders.keys()].length > 0) {
    fetchOptions.headers = Object.fromEntries(resolvedHeaders.entries());
  }

  if (typeof window === "undefined") {
    if (typeof revalidate === "number") {
      const existingNext =
        fetchOptions.next && typeof fetchOptions.next === "object"
          ? fetchOptions.next
          : {};
      const mergedTags = uniqueStrings([
        ...(Array.isArray(existingNext.tags) ? existingNext.tags : []),
        ...tags,
      ]);

      fetchOptions.next = {
        ...existingNext,
        revalidate,
        ...(mergedTags.length > 0 ? { tags: mergedTags } : {}),
      };
      delete fetchOptions.cache;
    } else if (!("cache" in fetchOptions)) {
      fetchOptions.cache = "no-store";
    }

    return fetchOptions;
  }

  if (!("cache" in fetchOptions)) {
    fetchOptions.cache = DEFAULT_CLIENT_CACHE;
  }

  return fetchOptions;
}
