// ---------------------------------------------------------
// UTILITY FUNCTIONS (डेटा को सुरक्षित तरीके से हैंडल करने के लिए)
// ---------------------------------------------------------

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function parseInput(raw) {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (raw && typeof raw === "object" && raw.jsonData) {
    return raw.jsonData;
  }
  return raw;
}

function pickJob(payload, jobIndex = 0) {
  const jobs = asArray(payload?.jobs);
  return jobs.length > 0 ? (jobs[jobIndex] || jobs[0]) : payload;
}

function splitLabelValue(text) {
  if (!isNonEmptyString(text)) return { label: "", value: "" };
  
  // ':' या '-' के आधार पर स्प्लिट करना 
  const separatorIndex = text.indexOf(":");
  if (separatorIndex !== -1) {
    return {
      label: text.slice(0, separatorIndex).trim(),
      value: text.slice(separatorIndex + 1).trim()
    };
  }
  const dashIndex = text.indexOf(" - ");
  if (dashIndex !== -1) {
    return {
      label: text.slice(0, dashIndex).trim(),
      value: text.slice(dashIndex + 3).trim()
    };
  }
  return { label: text.trim(), value: "" };
}

function extractYear(title) {
  const match = String(title || "").match(/20\d{2}/);
  return match ? match[0] : "";
}

function deriveHeroTitles(title) {
  const safeTitle = String(title || "").trim();
  if (!safeTitle) return { headingMain: "Sarkari Update", headingAccent: "Recruitment" };

  const markerMatch = safeTitle.match(
    /(Recruitment|Joining Order|Admit Card|Result|Marks|Online Form|Score Card|Syllabus|Answer Key|Counselling|Exam Date|Notice)/i
  );
  if (!markerMatch) return { headingMain: safeTitle, headingAccent: "Recruitment" };

  const marker = markerMatch[0];
  const markerIndex = safeTitle.toLowerCase().indexOf(marker.toLowerCase());
  return {
    headingMain: safeTitle.slice(0, markerIndex).trim() || safeTitle,
    headingAccent: marker,
  };
}

// ---------------------------------------------------------
// DEEP PARSING FUNCTIONS (हर एक लाइन को निकालने के लिए)
// ---------------------------------------------------------

// 1. DATES PARSER: सभी Dates को अलग-अलग हिस्सों में बाँटेगा
function parseDatesDeep(datesArr) {
  const parsed = {
    rawDates: [], startDate: "", endDate: "", feeLastDate: "", correctionDate: "",
    exams: [], admitCards: [], results: [], others: []
  };

  datesArr.forEach(d => {
    const { label, value } = splitLabelValue(d);
    parsed.rawDates.push({ label, value });
    const lbl = label.toLowerCase();

    if (lbl.includes("start") || lbl.includes("begin")) parsed.startDate = value;
    else if (lbl.includes("last date") || lbl.includes("end date")) {
      if (lbl.includes("fee") || lbl.includes("pay")) parsed.feeLastDate = value;
      else parsed.endDate = value;
    }
    else if (lbl.includes("correction") || lbl.includes("edit")) parsed.correctionDate = value;
    else if (lbl.includes("exam") || lbl.includes("cbt") || lbl.includes("pet") || lbl.includes("pst") || lbl.includes("interview")) {
      parsed.exams.push({ title: label, date: value });
    }
    else if (lbl.includes("admit card") || lbl.includes("hall ticket") || lbl.includes("call letter")) {
      parsed.admitCards.push({ title: label, date: value });
    }
    else if (lbl.includes("result") || lbl.includes("score") || lbl.includes("marks") || lbl.includes("merit") || lbl.includes("answer key")) {
      parsed.results.push({ title: label, date: value });
    }
    else {
      parsed.others.push({ title: label, date: value });
    }
  });
  return parsed;
}

// 2. FEES PARSER: Category Wise फीस और Payment Methods अलग करेगा
function parseFeesDeep(feesArr) {
  const parsed = { rawFees: [], categories: [], paymentModes: [], notes: [] };

  feesArr.forEach(f => {
    const { label, value } = splitLabelValue(f);
    parsed.rawFees.push({ label, value });
    const lowerF = f.toLowerCase();

    if (value.includes("₹") || value.toLowerCase().includes("rs") || lowerF.includes("fee") || value.includes("/-")) {
      parsed.categories.push({ category: label, amount: value || "0" });
    } else if (lowerF.includes("mode") || lowerF.includes("debit") || lowerF.includes("credit") || lowerF.includes("net") || lowerF.includes("upi")) {
      parsed.paymentModes.push(f);
    } else {
      parsed.notes.push(f);
    }
  });
  return parsed;
}

// 3. AGE PARSER: Min, Max, Relaxation और Age Limit Date निकालेगा
function parseAgeDeep(ageArr) {
  const parsed = { rawAge: [], minimumAge: "N/A", maximumAge: "N/A", ageAsOn: "N/A", relaxations: [] };

  ageArr.forEach(a => {
    const { label, value } = splitLabelValue(a);
    parsed.rawAge.push({ label, value });
    const lbl = label.toLowerCase();

    if (lbl.includes("minimum")) parsed.minimumAge = value || label;
    else if (lbl.includes("maximum")) {
      parsed.relaxations.push(a); // Male/Female अलग-अलग हो सकते हैं
      if (parsed.maximumAge === "N/A") parsed.maximumAge = value || label;
    } 
    else if (lbl.includes("as on")) parsed.ageAsOn = value || label;
    else parsed.relaxations.push(a);
  });
  return parsed;
}

// 4. LINKS CATEGORIZER: 20-30 Links को ग्रुप करेगा ताकि UI साफ़ दिखे
function parseLinksDeep(linksArr) {
  const grouped = {
    apply: [], admitCard: [], result: [], answerKey: [],
    notification: [], official: [], others: [], allRawLinks: linksArr
  };

  linksArr.forEach(link => {
    if (!link || !link.url) return;
    const lbl = String(link.label).toLowerCase();

    if (lbl.includes("apply") || lbl.includes("registration") || lbl.includes("login") || lbl.includes("form")) grouped.apply.push(link);
    else if (lbl.includes("admit card") || lbl.includes("hall ticket") || lbl.includes("call letter")) grouped.admitCard.push(link);
    else if (lbl.includes("result") || lbl.includes("score") || lbl.includes("marks") || lbl.includes("merit") || lbl.includes("cut off") || lbl.includes("cutoff")) grouped.result.push(link);
    else if (lbl.includes("answer key") || lbl.includes("question paper")) grouped.answerKey.push(link);
    else if (lbl.includes("notification") || lbl.includes("advertisement") || lbl.includes("notice") || lbl.includes("schedule") || lbl.includes("date") || lbl.includes("extend")) grouped.notification.push(link);
    else if (lbl.includes("official") && lbl.includes("website")) grouped.official.push(link);
    else grouped.others.push(link);
  });
  return grouped;
}

// 5. TABLE CATEGORIZER: District Wise, Category Wise, Syllabus सबको अलग करेगा
function parseTablesDeep(tablesArr) {
  const categorized = {
    vacancyTables: [], eligibilityTables: [], selectionTables: [],
    syllabusTables: [], faqTables: [], socialTables: [], otherTables: [],
    allRawTables: tablesArr
  };

  tablesArr.forEach(table => {
    const headersStr = asArray(table.headers).join(" ").toLowerCase();

    if (headersStr.includes("whatsapp") || headersStr.includes("telegram") || headersStr.includes("social")) categorized.socialTables.push(table);
    else if (headersStr.includes("eligibility") || headersStr.includes("qualification") || headersStr.includes("degree")) categorized.eligibilityTables.push(table);
    else if (headersStr.includes("selection") || headersStr.includes("mode of") || headersStr.includes("process")) categorized.selectionTables.push(table);
    else if (headersStr.includes("syllabus") || headersStr.includes("pattern") || headersStr.includes("scheme")) categorized.syllabusTables.push(table);
    else if (headersStr.includes("question") || headersStr.includes("answer") || headersStr.includes("faq")) categorized.faqTables.push(table);
    else if (headersStr.includes("post name") || headersStr.includes("vacancy") || headersStr.includes("total") || headersStr.includes("category") || headersStr.includes("district")) categorized.vacancyTables.push(table);
    else categorized.otherTables.push(table);
  });
  return categorized;
}

function parseNumericValue(value) {
  const token = String(value || "")
    .replace(/,/g, "")
    .match(/\d+/);

  if (!token) {
    return null;
  }

  const parsed = Number(token[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractCountFromText(value) {
  const match = String(value || "").match(
    /([\d,]+)\s*(?:post|posts|position|positions|vacanc(?:y|ies))/i,
  );

  if (!match?.[1]) {
    return null;
  }

  return parseNumericValue(match[1]);
}

function isTotalIndicatorRow(row) {
  return Object.values(row || {}).some((cell) =>
    String(cell || "")
      .toLowerCase()
      .includes("total"),
  );
}

function getSummedVacanciesFromTables(vacancyTables) {
  const countLabelPattern =
    /(no\.?\s*of\s*post|total\s*post|total\s*vacanc|vacanc(?:y|ies)|no\.?\s*posts?|posts?|seat(?:s)?)/i;
  const tableSums = [];

  for (const table of asArray(vacancyTables)) {
    const rows = asArray(table?.rows);

    if (rows.length === 0) {
      continue;
    }

    const candidateKeys = new Set();

    rows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => {
        if (countLabelPattern.test(String(key || ""))) {
          candidateKeys.add(key);
        }
      });
    });

    const firstRowKeys = Object.keys(rows[0] || {});
    asArray(table?.headers).forEach((header, index) => {
      if (countLabelPattern.test(String(header || "")) && firstRowKeys[index]) {
        candidateKeys.add(firstRowKeys[index]);
      }
    });

    const labelRow = rows.find((row) =>
      Object.values(row || {}).some((cell) => countLabelPattern.test(String(cell || ""))),
    );

    if (labelRow) {
      Object.entries(labelRow).forEach(([key, cell]) => {
        if (countLabelPattern.test(String(cell || ""))) {
          candidateKeys.add(key);
        }
      });
    }

    if (candidateKeys.size === 0) {
      continue;
    }

    let tableSum = 0;
    let numericRows = 0;

    rows.forEach((row) => {
      if (isTotalIndicatorRow(row)) {
        return;
      }

      let rowValue = null;

      for (const key of candidateKeys) {
        const cellValue = row?.[key];

        if (countLabelPattern.test(String(cellValue || ""))) {
          continue;
        }

        const parsed = parseNumericValue(cellValue);

        if (parsed !== null) {
          rowValue = parsed;
          break;
        }
      }

      if (rowValue !== null) {
        tableSum += rowValue;
        numericRows += 1;
      }
    });

    if (numericRows > 0 && tableSum > 0) {
      tableSums.push(tableSum);
    }
  }

  if (tableSums.length === 0) {
    return null;
  }

  return Math.max(...tableSums);
}

function getTablesForVacancyExtraction(tablesData) {
  return [
    ...asArray(tablesData?.vacancyTables),
    ...asArray(tablesData?.eligibilityTables),
    ...asArray(tablesData?.otherTables),
  ];
}

function cleanSelectionStep(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/([A-Za-z])\(/g, "$1 (")
    .replace(/\s+\)/g, ")")
    .replace(/[|,;:-]+$/g, "")
    .trim();
}

function uniqNonEmpty(items) {
  const seen = new Set();
  const result = [];

  asArray(items).forEach((item) => {
    const cleaned = cleanSelectionStep(item);
    const normalizedKey = cleaned.toLowerCase();

    if (!cleaned || cleaned.length < 3 || seen.has(normalizedKey)) {
      return;
    }

    seen.add(normalizedKey);
    result.push(cleaned);
  });

  return result;
}

function parseSelectionStepsDeep(tablesData) {
  const selectionTables = asArray(tablesData?.selectionTables);

  if (selectionTables.length === 0) {
    return [];
  }

  const rawSelectionText = selectionTables
    .flatMap((table) => asArray(table?.rows))
    .flatMap((row) => Object.values(row || {}))
    .filter((value) => isNonEmptyString(value))
    .join(" | ");

  const normalizedText = cleanSelectionStep(rawSelectionText);

  if (!normalizedText) {
    return [];
  }

  const knownStepPattern =
    /Shortlisting(?:\s*\([^)]*\))?|Written Examination|Written Exam|Physical\s*\/\s*Skill\s*Test(?:\s*\([^)]*\))?|Physical Efficiency Test\s*(?:\(PET\))?|Physical Standard Test\s*(?:\(PST\))?|Skill Test(?:\s*\([^)]*\))?|Document Verification|Medical Examination|Medical Test|Interview|Merit List|Final Selection|Typing Test|Trade Test/gi;

  const knownMatches = uniqNonEmpty(
    Array.from(normalizedText.matchAll(knownStepPattern)).map((match) => match?.[0] || ""),
  );

  if (knownMatches.length > 0) {
    return knownMatches;
  }

  const segmentsBySeparators = uniqNonEmpty(
    normalizedText.split(/\s*(?:\||,|;|->|=>|•|\u2022)\s*/),
  );

  if (segmentsBySeparators.length > 1) {
    return segmentsBySeparators;
  }

  const segmentsByKeywords = uniqNonEmpty(
    normalizedText.split(
      /\s+(?=(?:Written|Physical|Document|Medical|Interview|Merit|Shortlisting|Typing|Trade|Final)\b)/i,
    ),
  );

  if (segmentsByKeywords.length > 0) {
    return segmentsByKeywords;
  }

  return [];
}

// 6. TOTAL VACANCY EXTRACTOR (Super Smart)
// 6. TOTAL VACANCY EXTRACTOR (Ultra Smart)
function getOverallTotalVacancies(tablesData, jobTitle = "", shortInfo = "") {
  const candidateTables = getTablesForVacancyExtraction(tablesData);
  
  // Step 1: सबसे पहले टेबल के Headers में ढूँढें (जैसे "Vacancy Details Total : 1206 Post")
  for (const table of candidateTables) {
    const headerStr = asArray(table.headers).join(" ").toLowerCase();
    // अगर हेडर में "total :" या "total:" या "total vacancy" जैसा कुछ है और उसके साथ नंबर है
    const headerMatch = headerStr.match(/total\s*:?\s*(\d+)/i) || headerStr.match(/(\d+)\s*post/i) || headerStr.match(/(\d+)\s*vacanc/i);
    if (headerMatch && headerMatch[1]) {
      return headerMatch[1];
    }
  }

  // Step 2: अगर Headers में नहीं मिला, तो रोज़ (Rows) के अंदर ढूँढें 
  for (const table of candidateTables) {
    for (const row of asArray(table.rows)) {
      const vals = Object.values(row).map(v => String(v).toLowerCase());
      const keys = Object.keys(row).map(k => String(k).toLowerCase());
      
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].includes("total") || vals[i].includes("total") || keys[i] === "no. of post" || keys[i] === "no of post") {
          const possibleValue = row["Total Post"] || row["No. Of Post"] || row["No. of Post"] || row["Total Vacancy"] || row[Object.keys(row)[i]];
          // अगर वैल्यू में नंबर है, तो रिटर्न करें
          if (possibleValue && /\d/.test(possibleValue)) {
            return possibleValue;
          }
        }
      }
    }
  }

  // Step 3: Count columns से rows sum करना (No. Of Post / Total Post / Vacancy style tables)
  const summedVacancies = getSummedVacanciesFromTables(candidateTables);
  if (summedVacancies !== null) {
    return String(summedVacancies);
  }

  // Step 4: Title text से निकालना (जैसे "(22,195 Posts)")
  const titleCount = extractCountFromText(jobTitle);
  if (titleCount !== null) {
    return String(titleCount);
  }

  // Step 5: ShortInfo text से निकालना (जैसे "This recruitment is for 1206 positions")
  const shortInfoCount = extractCountFromText(shortInfo);
  if (shortInfoCount !== null) {
    return String(shortInfoCount);
  }

  // Step 6: Legacy short-info patterns (backward compatibility)
  if (shortInfo) {
    const shortInfoMatch =
      shortInfo.match(/for\s*([\d,]+)\s*position/i) ||
      shortInfo.match(/([\d,]+)\s*vacanc/i);
    if (shortInfoMatch?.[1]) {
      const parsed = parseNumericValue(shortInfoMatch[1]);
      if (parsed !== null) {
        return String(parsed);
      }
    }
  }

  return "N/A";
}


// ---------------------------------------------------------
// MAIN EXPORT FUNCTION (The Ultimate Formatter)
// ---------------------------------------------------------

export function formatPostDetail(rawResponse, options = {}) {
  const payload = parseInput(rawResponse);
  const job = pickJob(payload, options.jobIndex || 0);

  // 1. Raw Data Extraction
  const title = String(job?.title || "Sarkari Update");
  const shortInfo = String(job?.shortInfo || "");
  const importantDates = asArray(job?.importantDates);
  const applicationFee = asArray(job?.applicationFee);
  const ageLimit = asArray(job?.ageLimit);
  const vacancyTables = asArray(job?.vacancyDetails);
  const importantLinks = asArray(job?.importantLinks);
  const otherDetails = asArray(job?.otherDetails);

  // 2. Deep Parsing into Categories (ZERO DATA LOSS)
  const datesData = parseDatesDeep(importantDates);
  const feeData = parseFeesDeep(applicationFee);
  const ageData = parseAgeDeep(ageLimit);
  const linksData = parseLinksDeep(importantLinks);
  const tablesData = parseTablesDeep(vacancyTables);
  const selectionSteps = parseSelectionStepsDeep(tablesData);
  const { headingMain, headingAccent } = deriveHeroTitles(title);

  // 3. Construct Quick Stats for Top Level View
  const quickStats = {
    totalVacancies: getOverallTotalVacancies(tablesData, title, shortInfo),
    startDate: datesData.startDate || "Not specified",
    endDate: datesData.endDate || "Not specified",
    examDate: datesData.exams.length > 0 ? datesData.exams[0].date : "Will be notified",
    admitCardDate: datesData.admitCards.length > 0 ? datesData.admitCards[0].date : "Before Exam",
    resultDate: datesData.results.length > 0 ? datesData.results[0].date : "Will be updated",
    generalFee: feeData.categories.find(c => c.category.toLowerCase().includes("gen"))?.amount || "Check Notice",
    minAge: ageData.minimumAge,
    maxAge: ageData.maximumAge,
  };

  // 4. Returning Full Structured Data Object
  return {
    // A. Hero Section
    header: {
      title,
      headingMain,
      headingAccent,
      badge: `Active Recruitment ${extractYear(title) || "Live"}`,
      shortInfo,
    },
    
    // B. Stats Section (Overview)
    quickStats,

    // C. Highly Structured Core Data (UI Mapping के लिए बेस्ट)
    details: {
      dates: datesData,            // इसमें exams array, admitCards array सब अलग हैं
      fees: feeData,               // Category wise fees array 
      ageLimit: ageData,           // Age As On, Relaxations array
      selectionSteps,
    },

    // D. Smart Tables Categorization (कोई टेबल नहीं छूटेगी)
    tables: tablesData,

    // E. Categorized Links (UI में Tabs या Sections बनाने के लिए)
    links: linksData,

    // F. Other Information Section
    otherInfo: otherDetails.map(d => ({
      section: String(d.section || ""),
      items: asArray(d.details || d.items)
    })),

    // G. Fallback / Raw Data (तसल्ली के लिए ताकि कुछ भी मिस न हो)
    rawBackupData: {
      importantDates,
      applicationFee,
      ageLimit,
      vacancyDetails: vacancyTables,
      importantLinks,
      otherDetails
    }
  };
}

// ---------------------------------------------------------
// URL HELPERS 
// ---------------------------------------------------------

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function getSlugFromJobUrl(jobUrl) {
  if (!isNonEmptyString(jobUrl)) return "";
  try {
    const parts = new URL(jobUrl).pathname.split("/").filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : "";
  } catch {
    return "";
  }
}

function createStableUrlHash(value) {
  const input = String(value || "");

  if (!input) {
    return "";
  }

  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36).slice(0, 8);
}

export function buildCanonicalKey({ title, jobUrl } = {}) {
  const fromUrl = slugify(getSlugFromJobUrl(jobUrl));
  const urlHash = createStableUrlHash(jobUrl);

  if (fromUrl && urlHash) {
    return `${fromUrl}-${urlHash}`;
  }

  if (fromUrl) {
    return fromUrl;
  }

  const fromTitle = slugify(title);
  const titleHash = createStableUrlHash(title);

  if (fromTitle && titleHash) {
    return `${fromTitle}-${titleHash}`;
  }

  return fromTitle || "post-detail";
}
