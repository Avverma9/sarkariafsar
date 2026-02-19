function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function humanize(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function resolveSectionRoute(sectionTitle) {
  const normalized = normalize(sectionTitle);
  const cleanedTitle = String(sectionTitle || "").trim();
  const labelFromInput = cleanedTitle ? humanize(cleanedTitle) : "";

  if (normalized.includes("admit card")) {
    return {
      basePath: "/admit-card",
      megaTitle: "Admit Cards",
      label: labelFromInput || "Admit Card",
      useQuery: false,
    };
  }

  if (normalized.includes("answer key")) {
    return {
      basePath: "/answer-key",
      megaTitle: "Answer Keys",
      label: labelFromInput || "Answer Key",
      useQuery: false,
    };
  }

  if (normalized.includes("result")) {
    return {
      basePath: "/results",
      megaTitle: "Recent Results",
      label: labelFromInput || "Recent Results",
      useQuery: false,
    };
  }

  if (
    (normalized.includes("latest") && normalized.includes("job")) ||
    normalized.includes("recruitment") ||
    normalized.includes("vacancy")
  ) {
    return {
      basePath: "/latest-jobs",
      megaTitle: "Latest Gov Jobs",
      label: labelFromInput || "Latest Gov Jobs",
      useQuery: false,
    };
  }

  return {
    basePath: "/latest-jobs",
    megaTitle: cleanedTitle || "Latest Gov Jobs",
    label: cleanedTitle ? humanize(cleanedTitle) : "Latest Gov Jobs",
    useQuery: Boolean(cleanedTitle),
  };
}

export function buildSectionHref(sectionTitle) {
  const resolved = resolveSectionRoute(sectionTitle);
  if (!resolved.useQuery) return resolved.basePath;
  if (!resolved.megaTitle) return resolved.basePath;
  const params = new URLSearchParams({
    megaTitle: resolved.megaTitle,
  });
  return `${resolved.basePath}?${params.toString()}`;
}
