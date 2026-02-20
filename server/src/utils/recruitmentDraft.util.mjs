import * as cheerio from "cheerio";

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function toLower(value) {
  return clean(value).toLowerCase();
}

function toNumber(value) {
  const m = clean(value).match(/-?\d[\d,]*/);
  if (!m) return 0;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseDate(value) {
  const raw = clean(value).replace(/(\d)(st|nd|rd|th)\b/gi, "$1");
  if (!raw) return "";

  let m = raw.match(/\b(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})\b/);
  if (m) {
    return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
  }

  m = raw.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[1])).padStart(2, "0")}`;
  }

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function splitList(value) {
  const raw = clean(value);
  if (!raw) return [];
  const items = raw
    .replace(/\s*\|\s*/g, ",")
    .replace(/\s*;\s*/g, ",")
    .split(/,\s*/)
    .map((x) => clean(x))
    .filter(Boolean);
  return Array.from(new Set(items.map((x) => x.toLowerCase()))).map(
    (k) => items.find((x) => x.toLowerCase() === k),
  );
}

function createBase(title = "", sourceUrl = "") {
  return {
    recruitment: {
      title: clean(title),
      advertisementNumber: "",
      organization: { name: "", shortName: "", website: "", type: "Other" },
      importantDates: {
        notificationDate: "",
        postDate: "",
        applicationStartDate: "",
        applicationLastDate: "",
        feePaymentLastDate: "",
        correctionDate: "",
        preExamDate: "",
        mainsExamDate: "",
        examDate: "",
        admitCardDate: "",
        resultDate: "",
        answerKeyReleaseDate: "",
        finalAnswerKeyDate: "",
        documentVerificationDate: "",
        counsellingDate: "",
        meritListDate: "",
      },
      vacancyDetails: {
        totalPosts: 0,
        positions: [],
        categoryWise: {
          general: 0,
          obc: 0,
          sc: 0,
          st: 0,
          ewsExemption: 0,
          ph: 0,
          other: {},
        },
        districtWise: [],
      },
      applicationFee: {
        general: 0,
        ewsObc: 0,
        scSt: 0,
        female: 0,
        ph: 0,
        correctionCharge: 0,
        currency: "INR",
        paymentMode: [],
        exemptions: "",
      },
      ageLimit: {
        minimumAge: 0,
        maximumAge: 0,
        asOn: "",
        ageRelaxation: { scSt: 0, obc: 0, ph: 0, exServicemen: 0, other: {} },
        categoryWise: {
          ur: { male: 0, female: 0 },
          obc: { male: 0, female: 0 },
          sc: { male: 0, female: 0 },
          st: { male: 0, female: 0 },
        },
      },
      eligibility: {
        educationQualification: "",
        streamRequired: "",
        minimumPercentage: 0,
        experienceRequired: "",
        specialRequirements: [],
      },
      physicalStandards: {
        male: { height: "", chest: "", weight: "", eyesight: "" },
        female: { height: "", weight: "", eyesight: "" },
      },
      physicalEfficiencyTest: {
        male: { distance: "", duration: "" },
        female: { distance: "", duration: "" },
      },
      selectionProcess: [],
      importantLinks: {
        applyOnline: "",
        officialNotification: "",
        officialWebsite: "",
        syllabus: "",
        examPattern: "",
        admitCard: "",
        resultLink: "",
        answerKey: "",
        documentVerificationNotice: "",
        faq: "",
        other: {},
      },
      documentation: [],
      status: "Active",
      sourceUrl: clean(sourceUrl),
      additionalInfo: "",
      extraFields: {
        unmappedKeyValues: {},
        links: [],
        keyValues: [],
      },
      content: {
        originalSummary: "",
        whoShouldApply: [],
        keyHighlights: [],
        applicationSteps: [],
        selectionProcessSummary: "",
        documentsChecklist: [],
        feeSummary: "",
        importantNotes: [],
        faq: [],
      },
    },
  };
}

function classifyLink(text = "", url = "") {
  const seed = `${toLower(text)} ${toLower(url)}`;
  if (seed.includes("apply") || seed.includes("registration") || seed.includes("online form")) return "applyOnline";
  if (seed.includes("notification") || seed.includes(".pdf")) return "officialNotification";
  if (seed.includes("official website") || seed.includes("homepage")) return "officialWebsite";
  if (seed.includes("syllabus")) return "syllabus";
  if (seed.includes("exam pattern")) return "examPattern";
  if (seed.includes("admit card") || seed.includes("hall ticket")) return "admitCard";
  if (seed.includes("result")) return "resultLink";
  if (seed.includes("answer key")) return "answerKey";
  if (seed.includes("document verification")) return "documentVerificationNotice";
  if (seed.includes("faq")) return "faq";
  return "";
}

function pickKeyValues($, root) {
  const out = [];
  const seen = new Set();

  const push = (key, value) => {
    const k = clean(key).replace(/[:\-]+$/g, "");
    const v = clean(value);
    if (!k || !v) return;
    const id = `${k.toLowerCase()}|${v.toLowerCase()}`;
    if (seen.has(id)) return;
    seen.add(id);
    out.push({ key: k, value: v });
  };

  root.find("tr").each((_, tr) => {
    const cells = [];
    $(tr)
      .find("th,td")
      .each((__, td) => {
        const t = clean($(td).text());
        if (t) cells.push(t);
      });
    if (cells.length === 2) push(cells[0], cells[1]);
  });

  root.find("li,p").each((_, el) => {
    const text = clean($(el).text());
    if (!text || text.length > 220) return;
    const idx = text.indexOf(":");
    if (idx <= 1 || idx >= 100) return;
    push(text.slice(0, idx), text.slice(idx + 1));
  });

  return out;
}

function setDate(dates, field, raw) {
  if (!field || dates[field]) return false;
  const d = parseDate(raw);
  dates[field] = d || clean(raw);
  return true;
}

function setStatus(recruitment) {
  const now = new Date();
  const start = parseDate(recruitment.importantDates.applicationStartDate);
  const end = parseDate(recruitment.importantDates.applicationLastDate);
  if (start) {
    const sd = new Date(`${start}T00:00:00.000Z`);
    if (!Number.isNaN(sd.getTime()) && sd > now) {
      recruitment.status = "Upcoming";
      return;
    }
  }
  if (end) {
    const ed = new Date(`${end}T00:00:00.000Z`);
    if (!Number.isNaN(ed.getTime()) && ed < now) {
      recruitment.status = "Closed";
      return;
    }
  }
  recruitment.status = "Active";
}

export function buildDraftRecruitmentFromHtml({ html = "", title = "", sourceUrl = "" } = {}) {
  const input = String(html || "").trim();
  if (!input) throw new Error("html is empty");

  const $ = cheerio.load(input, { decodeEntities: false });
  const root = $(".sa-content").length ? $(".sa-content").first() : $("body");
  const mainTitle = clean($(".sa-hero h1").first().text()) || clean($("h1").first().text()) || clean(title);
  const payload = createBase(mainTitle, sourceUrl);
  const recruitment = payload.recruitment;
  const keyValues = pickKeyValues($, root);
  const text = clean(root.text());

  root.find("a[href]").each((_, a) => {
    const textLabel = clean($(a).text());
    const href = clean($(a).attr("href"));
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) return;
    const abs = (() => {
      try {
        return new URL(href, sourceUrl || "https://example.com").toString();
      } catch {
        return "";
      }
    })();
    if (!abs) return;
    recruitment.extraFields.links.push({ text: textLabel, url: abs });
    const slot = classifyLink(textLabel, abs);
    if (slot && !recruitment.importantLinks[slot]) recruitment.importantLinks[slot] = abs;
  });

  for (const row of keyValues) {
    recruitment.extraFields.keyValues.push(row);
    const k = toLower(row.key);
    const v = row.value;

    if ((k.includes("advt") || k.includes("advertisement") || k.includes("notification")) && (k.includes("no") || k.includes("number"))) {
      if (!recruitment.advertisementNumber) recruitment.advertisementNumber = v;
      continue;
    }
    if (k.includes("organization") || k.includes("department") || k.includes("board") || k.includes("authority")) {
      if (!recruitment.organization.name) recruitment.organization.name = v;
      continue;
    }
    if ((k.includes("official website") || k === "website") && !recruitment.organization.website) {
      recruitment.organization.website = v;
      continue;
    }
    if (k.includes("post date")) {
      setDate(recruitment.importantDates, "postDate", v);
      continue;
    }
    if (k.includes("notification") && k.includes("date")) {
      setDate(recruitment.importantDates, "notificationDate", v);
      continue;
    }
    if ((k.includes("apply") || k.includes("application")) && (k.includes("start") || k.includes("begin") || k.includes("from"))) {
      setDate(recruitment.importantDates, "applicationStartDate", v);
      continue;
    }
    if ((k.includes("apply") || k.includes("application")) && (k.includes("last") || k.includes("deadline") || k.includes("closing"))) {
      setDate(recruitment.importantDates, "applicationLastDate", v);
      continue;
    }
    if (k.includes("exam") && k.includes("date")) {
      setDate(recruitment.importantDates, "examDate", v);
      continue;
    }
    if (k.includes("admit card")) {
      setDate(recruitment.importantDates, "admitCardDate", v);
      continue;
    }
    if (k.includes("result")) {
      setDate(recruitment.importantDates, "resultDate", v);
      continue;
    }
    if (k.includes("answer key")) {
      setDate(recruitment.importantDates, "answerKeyReleaseDate", v);
      continue;
    }
    if (k.includes("total post") || k.includes("vacancies") || k.includes("total vacancy")) {
      const n = toNumber(v);
      if (n > 0) recruitment.vacancyDetails.totalPosts = n;
      continue;
    }
    if (k.includes("minimum age")) {
      recruitment.ageLimit.minimumAge = toNumber(v);
      continue;
    }
    if (k.includes("maximum age")) {
      recruitment.ageLimit.maximumAge = toNumber(v);
      continue;
    }
    if (k.includes("as on") && k.includes("age")) {
      recruitment.ageLimit.asOn = parseDate(v) || v;
      continue;
    }
    if (k.includes("qualification") || k.includes("education")) {
      if (!recruitment.eligibility.educationQualification) recruitment.eligibility.educationQualification = v;
      continue;
    }
    if (k.includes("selection process") || k.includes("mode of selection")) {
      recruitment.selectionProcess = splitList(v);
      continue;
    }
    if (k.includes("document")) {
      recruitment.documentation = splitList(v);
      continue;
    }
    if (k.includes("application fee") || k.includes("fee")) {
      const n = toNumber(v);
      if (n > 0) {
        if (k.includes("general")) recruitment.applicationFee.general = n;
        else if (k.includes("obc") || k.includes("ews")) recruitment.applicationFee.ewsObc = n;
        else if (k.includes("sc") || k.includes("st")) recruitment.applicationFee.scSt = n;
      }
      continue;
    }

    const extraKey = k.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (extraKey) recruitment.extraFields.unmappedKeyValues[extraKey] = v;
  }

  if (!recruitment.advertisementNumber) {
    const m = text.match(/\bAdvt\.?\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/.\-]+)/i);
    if (m?.[1]) recruitment.advertisementNumber = clean(m[1]);
  }
  if (!recruitment.vacancyDetails.totalPosts) {
    const m = text.match(/\b(?:Total\s*Posts?|Vacanc(?:y|ies))\s*[:\-]?\s*([0-9][0-9,]*)/i);
    if (m?.[1]) recruitment.vacancyDetails.totalPosts = toNumber(m[1]);
  }

  recruitment.content.originalSummary = text.split(" ").slice(0, 90).join(" ");
  recruitment.content.keyHighlights = [
    recruitment.vacancyDetails.totalPosts ? `Total posts: ${recruitment.vacancyDetails.totalPosts}` : "",
    recruitment.importantDates.applicationLastDate
      ? `Last date: ${recruitment.importantDates.applicationLastDate}`
      : "",
  ].filter(Boolean);
  recruitment.content.documentsChecklist = recruitment.documentation;
  recruitment.content.selectionProcessSummary = recruitment.selectionProcess.length
    ? `Selection includes ${recruitment.selectionProcess.join(", ")}.`
    : "";
  setStatus(recruitment);

  if (!recruitment.organization.website && sourceUrl) {
    try {
      recruitment.organization.website = new URL(sourceUrl).origin;
    } catch {
      recruitment.organization.website = "";
    }
  }
  if (!recruitment.importantLinks.officialWebsite && recruitment.organization.website) {
    recruitment.importantLinks.officialWebsite = recruitment.organization.website;
  }

  return payload;
}
