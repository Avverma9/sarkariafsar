const SECTION_TO_MEGA_TITLE = {
  "latest job": "Latest Gov Jobs",
  "latest jobs": "Latest Gov Jobs",
  "admit card": "Admit Cards",
  "admit cards": "Admit Cards",
  result: "Recent Results",
  results: "Recent Results",
  admission: "Admission Form",
  admissions: "Admission Form",
  "answer key": "Answer Keys",
  "answer keys": "Answer Keys",
  "previous year paper": "Previous Year Paper",
  "previous year papers": "Previous Year Paper",
};

function toText(value) {
  return String(value || "").trim();
}

function resolveMegaTitle(sectionTitle) {
  const key = toText(sectionTitle).toLowerCase();
  return SECTION_TO_MEGA_TITLE[key] || toText(sectionTitle);
}

export function normalizeSectionsData(rawData) {
  const data = Array.isArray(rawData) ? rawData : [];
  if (data.length === 0) return [];

  const hasNestedSections = data.some((item) => Array.isArray(item?.sections));
  if (hasNestedSections) {
    const normalized = [];
    for (const site of data) {
      const sections = Array.isArray(site?.sections) ? site.sections : [];
      for (const section of sections) {
        const sectionTitle = toText(section?.title);
        if (!sectionTitle) continue;
        const megaTitle = resolveMegaTitle(sectionTitle);
        normalized.push({
          title: megaTitle,
          megaTitle,
          sectionTitle,
          sectionUrl: toText(section?.url),
          siteName: toText(site?.name),
          siteUrl: toText(site?.url),
        });
      }
    }
    return normalized;
  }

  return data
    .map((item) => {
      const title = toText(item?.title);
      const megaTitle = toText(item?.megaTitle) || resolveMegaTitle(title);
      if (!title && !megaTitle) return null;
      return {
        ...item,
        title: title || megaTitle,
        megaTitle: megaTitle || title,
      };
    })
    .filter(Boolean);
}
