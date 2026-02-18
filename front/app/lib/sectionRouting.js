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
      megaTitle: cleanedTitle || "Admit Card",
      label: labelFromInput || "Admit Card",
    };
  }

  if (normalized.includes("answer key")) {
    return {
      basePath: "/answer-key",
      megaTitle: cleanedTitle || "Answer Key",
      label: labelFromInput || "Answer Key",
    };
  }

  if (normalized.includes("result")) {
    return {
      basePath: "/results",
      megaTitle: cleanedTitle || "Recent Results",
      label: labelFromInput || "Recent Results",
    };
  }

  if (
    (normalized.includes("latest") && normalized.includes("job")) ||
    normalized.includes("recruitment") ||
    normalized.includes("vacancy")
  ) {
    return {
      basePath: "/latest-jobs",
      megaTitle: cleanedTitle || "Latest Gov Jobs",
      label: labelFromInput || "Latest Gov Jobs",
    };
  }

  return {
    basePath: "/latest-jobs",
    megaTitle: cleanedTitle || "Latest Gov Jobs",
    label: cleanedTitle ? humanize(cleanedTitle) : "Latest Gov Jobs",
  };
}

export function buildSectionHref(sectionTitle) {
  const resolved = resolveSectionRoute(sectionTitle);
  const params = new URLSearchParams({
    megaTitle: resolved.megaTitle,
  });
  return `${resolved.basePath}?${params.toString()}`;
}
