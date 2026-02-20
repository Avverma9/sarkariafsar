import * as cheerio from "cheerio";

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 1 — CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const TARGET_DOMAIN = "sarkariafsar.com";
const TARGET_BRAND  = "SarkariAfsar";
const TARGET_URL    = "https://sarkariafsar.com";

const COMPETITOR_DOMAINS = new Set([
  "sarkariresult.com.cm", "www.sarkariresult.com.cm",
  "sarkariexam.com",      "www.sarkariexam.com",
  "rojarresult.com",      "www.rojarresult.com",
  "rojgarresult.com",     "www.rojgarresult.com",
]);

const COMPETITOR_BRAND_PATTERNS = [
  /sarkari\s*result\.com\.cm/gi,
  /sarkariresult\.com\.cm/gi,
  /sarkari\s*result\s*\.com/gi,
  /sarkariexam\.com/gi,
  /rojgar\s*result\.com/gi,
  /rojar\s*result\.com/gi,
  /sarkarinaukri/gi,
  /sarkariresult\s+team/gi,
  /sarkari\s*result\s*team/gi,
];

const COMPETITOR_BRAND_TEXTS = [
  "sarkari result.com.cm", "sarkariresult.com.cm",
  "sarkariexam.com",       "rojgarresult.com",
  "rojarresult.com",       "sarkariresult team",
  "sarkarinaukri",         "sarkari result team",
  "sarkari result .com",
];

const NOISY_SELECTORS = [
  "script", "style", "noscript", "iframe", "object", "embed", "form",
  ".social-buttons", ".share-buttons", ".apply-button", ".social-button",
  "[class*='ads']",      "[id*='ads']",
  "[class*='banner']",   "[id*='banner']",
  "[class*='telegram']", "[id*='telegram']",
  "[class*='whatsapp']", "[id*='whatsapp']",
  ".adsbygoogle",        "[data-ad-slot]", "[data-ad-client]",
];

const APP_HINTS = [
  "play.google.com", "apps.apple.com",
  "download app",    "download our app",
  "download sarkariresult app", "download sarkarinaukri app",
  "get app", "mobile app", "app store", "install app",
  "get it on google", "available on app store",
  "official app", "sarkari result app", "sarkari exam app",
];

const SOCIAL_HINTS = [
  "whatsapp", "wa.me", "chat.whatsapp.com",
  "telegram", "t.me",  "telegram.me",
  "join whatsapp", "join telegram",
  "join our whatsapp", "join our telegram",
  "follow on telegram", "follow on whatsapp",
  "instagram", "follow now", "follow us",
  "follow on instagram", "follow us on instagram",
  "join instagram",
];

const COMPETITOR_PROMO_HINTS = [
  "through sarkari result official",
  "sarkari result official",
  "sarkariexam official",
  "sarkari exam official",
  "follow sarkariexam",
  "follow sarkari exam",
  "follow sarkari result",
];

const BLOCKED_PROMO_HINTS = [
  "meditate & get success",
  "meditate and get success",
  "join now",
  "join our whatsapp channel",
  "join our telegram channel",
];
const AUTHOR_TAG_LINE_REGEX = /^\s*(author|tags?)\s*:/i;
const AUTHOR_TAG_CELL_REGEX = /^\s*(author|tags?)\s*$/i;
const AUTHOR_TAG_LOOSE_REGEX = /\b(author|tags?)\s*:/i;
const SOURCE_META_LINE_REGEX = /^\s*(?:[^\w\s]+\s*)?(?:original\s+source|source)\s*:/i;
const PREPARED_BY_LINE_REGEX = /^\s*prepared\s+by\b/i;

const SIDEBAR_SECTION_HINTS = [
  "latest posts",     "related posts",
  "you may also check", "also check",
  "similar posts",    "recommended posts",
  "popular posts",    "trending posts",
  "check also",       "other posts",
];

// Sections jo side-by-side pair honge (2-column layout)
const PAIRED_SECTIONS = [
  ["dates",       "fee"],
  ["age",         "posts"],
  ["eligibility", "salary"],
  ["selection",   "docs"],
];

// Section detection config
const SECTION_CONFIGS = [
  {
    keys: ["important dates","key dates","exam dates","schedule","timeline"],
    icon: "📅", color: "#1a56db", gradFrom: "#1a56db", gradTo: "#3b82f6",
    label: "Important Dates", id: "dates",
  },
  {
    keys: ["application fee","fee details","fee structure","application fees","fee payment"],
    icon: "💳", color: "#d97706", gradFrom: "#d97706", gradTo: "#f59e0b",
    label: "Application Fee", id: "fee",
  },
  {
    keys: ["age limit","age relaxation","age criteria","age as on"],
    icon: "👤", color: "#7c3aed", gradFrom: "#7c3aed", gradTo: "#a855f7",
    label: "Age Limit", id: "age",
  },
  {
    keys: ["total post","total posts","vacancy details","post details","vacancies","post wise"],
    icon: "📊", color: "#059669", gradFrom: "#059669", gradTo: "#10b981",
    label: "Total Posts / Vacancy", id: "posts",
  },
  {
    keys: ["how to apply","application process","apply process","apply online","steps to apply"],
    icon: "📝", color: "#0891b2", gradFrom: "#0891b2", gradTo: "#06b6d4",
    label: "How to Apply", id: "apply",
  },
  {
    keys: ["selection process","selection criteria","selection procedure","merit list"],
    icon: "✅", color: "#16a34a", gradFrom: "#16a34a", gradTo: "#22c55e",
    label: "Selection Process", id: "selection",
  },
  {
    keys: ["important links","useful links","direct links","apply link","official links"],
    icon: "🔗", color: "#dc2626", gradFrom: "#dc2626", gradTo: "#ef4444",
    label: "Important Links", id: "links",
  },
  {
    keys: ["eligibility","educational qualification","qualification","education criteria","academic"],
    icon: "🎓", color: "#0284c7", gradFrom: "#0284c7", gradTo: "#0ea5e9",
    label: "Eligibility / Qualification", id: "eligibility",
  },
  {
    keys: ["documents required","required documents","documents needed","documents"],
    icon: "📋", color: "#9333ea", gradFrom: "#9333ea", gradTo: "#a855f7",
    label: "Required Documents", id: "docs",
  },
  {
    keys: ["notification details","short details","exam details","basic details"],
    icon: "ℹ️", color: "#0f766e", gradFrom: "#0f766e", gradTo: "#14b8a6",
    label: "Notification Details", id: "details",
  },
  {
    keys: ["salary","pay scale","emoluments","stipend","remuneration","ctc"],
    icon: "💰", color: "#b45309", gradFrom: "#b45309", gradTo: "#f59e0b",
    label: "Salary / Pay Scale", id: "salary",
  },
  {
    keys: ["syllabus","exam pattern","exam syllabus","paper pattern","marking scheme"],
    icon: "📚", color: "#6366f1", gradFrom: "#6366f1", gradTo: "#818cf8",
    label: "Syllabus / Exam Pattern", id: "syllabus",
  },
  {
    keys: ["admit card","hall ticket","call letter"],
    icon: "🪪", color: "#0369a1", gradFrom: "#0369a1", gradTo: "#0ea5e9",
    label: "Admit Card", id: "admit",
  },
  {
    keys: ["result","scorecard","merit","final answer key"],
    icon: "🏆", color: "#be185d", gradFrom: "#be185d", gradTo: "#ec4899",
    label: "Result / Scorecard", id: "result",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 2 — UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function normalizeSpace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeHost(value) {
  return String(value ?? "").trim().toLowerCase().replace(/^www\./, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isPdfLink(rawUrl, baseUrl = "") {
  try {
    const u = new URL(String(rawUrl ?? ""), baseUrl || TARGET_URL);
    return String(u.pathname ?? "").toLowerCase().endsWith(".pdf");
  } catch {
    return /\.pdf(\?|#|$)/i.test(String(rawUrl ?? ""));
  }
}

function hasAnyHint(value, hints = []) {
  const text = normalizeSpace(value).toLowerCase();
  if (!text) return false;
  return hints.some((x) => text.includes(String(x ?? "").toLowerCase()));
}

function hasBlockedPromoHint(value = "") {
  const text = normalizeSpace(value).toLowerCase();
  if (!text) return false;
  return BLOCKED_PROMO_HINTS.some((hint) => text.includes(hint));
}

function isCompetitorUrl(rawUrl = "", baseUrl = "") {
  const value = String(rawUrl ?? "").trim();
  if (
    !value ||
    value.startsWith("#") ||
    value.startsWith("javascript:") ||
    value.startsWith("mailto:")
  ) return false;

  const normalizedInput = /^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(value)
    ? `https://${value}` : value;

  try {
    const resolved = new URL(normalizedInput, baseUrl || TARGET_URL);
    return COMPETITOR_DOMAINS.has(normalizeHost(resolved.hostname));
  } catch {
    return false;
  }
}

function hasCompetitorPromo(value = "") {
  const text = normalizeSpace(value).toLowerCase();
  if (!text) return false;
  if (COMPETITOR_PROMO_HINTS.some((hint) => text.includes(hint))) return true;
  const hasCompetitorMention =
    text.includes("sarkariresult") ||
    text.includes("sarkari result") ||
    text.includes("sarkariexam") ||
    text.includes("sarkari exam team");
  const hasCta =
    text.includes("follow") ||
    text.includes("join") ||
    text.includes("official") ||
    text.includes("download app") ||
    text.includes("get app");
  return hasCompetitorMention && hasCta;
}

function isAuthorOrTagLine(value = "") {
  const text = normalizeSpace(value);
  if (!text) return false;
  return (
    AUTHOR_TAG_LINE_REGEX.test(text) ||
    AUTHOR_TAG_CELL_REGEX.test(text) ||
    AUTHOR_TAG_LOOSE_REGEX.test(text)
  );
}

function isMetaFooterLine(value = "") {
  const text = normalizeSpace(value);
  if (!text) return false;
  return SOURCE_META_LINE_REGEX.test(text) || PREPARED_BY_LINE_REGEX.test(text);
}

function isCompetitorText(text = "") {
  const lower = normalizeSpace(text).toLowerCase();
  if (!lower) return false;
  return (
    COMPETITOR_BRAND_TEXTS.some((b) => lower.includes(b)) ||
    /sarkari\s*result/i.test(lower)
  );
}

function cleanCompetitorTextInHtml(html = "") {
  let result = String(html ?? "");
  for (const pattern of COMPETITOR_BRAND_PATTERNS) {
    result = result.replace(pattern, TARGET_BRAND);
  }
  COMPETITOR_BRAND_PATTERNS.forEach((r) => { r.lastIndex = 0; });
  return result;
}

function detectSectionConfig(text = "") {
  const lower = normalizeSpace(text).toLowerCase();
  for (const cfg of SECTION_CONFIGS) {
    if (cfg.keys.some((k) => lower.includes(k))) return cfg;
  }
  return null;
}

function isSidebarSection(text = "") {
  const lower = normalizeSpace(text).toLowerCase();
  return SIDEBAR_SECTION_HINTS.some((h) => lower.includes(h));
}

function dropNodePreservingText($, node) {
  if (!node?.length) return;
  const parent = node.parent();
  node.remove();
  if (
    parent?.length &&
    !normalizeSpace(parent.text()) &&
    !parent.find("img,table,video,a").length
  ) parent.remove();
}

function stripUnsafeAttributes($, root) {
  root.find("*").each((_, el) => {
    const attrs = el.attribs ?? {};
    for (const key of Object.keys(attrs)) {
      const lower = String(key ?? "").toLowerCase();
      if (
        lower.startsWith("on") ||
        lower === "style" ||
        lower === "srcset" ||
        lower === "nonce" ||
        lower === "integrity" ||
        lower === "crossorigin"
      ) $(el).removeAttr(key);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 3 — LIST → TABLE CONVERSION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

function parseLiItem($, liEl) {
  const liNode  = $(liEl);
  const rawHtml = liNode.html() ?? "";
  const fullText = normalizeSpace(liNode.text());
  const hasLink  = liNode.find("a").length > 0;

  // Nested <ul>/<ol> inside li (e.g. Payment Mode sub-items)
  const nestedList = liNode.find("> ul, > ol").first();
  if (nestedList.length) {
    const clonedLi = liNode.clone();
    clonedLi.find("ul,ol").remove();
    const parentText = normalizeSpace(clonedLi.text());
    let nestedRows = "";
    nestedList.find("> li").each((_, subLi) => {
      const subText = normalizeSpace($(subLi).text());
      if (subText) nestedRows += `<li class="sa-sub-item">${$(subLi).html()}</li>`;
    });
    return {
      key:       parentText || null,
      valueHtml: nestedRows ? `<ul class="sa-nested-list">${nestedRows}</ul>` : "",
      hasLink,
      isNested:  true,
      fullText,
    };
  }

  // Strategy 1: <strong>/<b> as label
  const strongEl = liNode.find("> strong, > b").first();
  if (strongEl.length) {
    const keyText = normalizeSpace(strongEl.text());
    const cloned  = liNode.clone();
    cloned.find("> strong, > b").first().remove();
    const valHtml = cloned.html()?.trim() ?? "";
    if (keyText) {
      return { key: keyText, valueHtml: valHtml, hasLink, isNested: false, fullText };
    }
  }

  // Strategy 2: Colon split
  const colonIdx = fullText.indexOf(":");
  if (colonIdx > 1 && colonIdx < 70) {
    const key    = fullText.substring(0, colonIdx).trim();
    const val    = fullText.substring(colonIdx + 1).trim();
    const rawVal = rawHtml.substring(rawHtml.indexOf(":") + 1).trim();
    if (key && val) {
      return { key, valueHtml: rawVal || val, hasLink, isNested: false, fullText };
    }
  }

  // Strategy 3: Plain statement
  return { key: null, valueHtml: rawHtml, hasLink, isNested: false, fullText };
}

// Single-column section card (for sections that are NOT paired)
function convertListToSectionCard($, listEl, sectionCfg) {
  const items = [];
  listEl.find("> li").each((_, li) => items.push(parseLiItem($, li)));
  if (!items.length) return null;

  const { icon, gradFrom, gradTo, label, id } = sectionCfg;
  let tbodyHtml = "";

  for (const item of items) {
    if (item.key) {
      tbodyHtml += `
      <tr>
        <td class="sa-info-key">${escapeHtml(item.key)}</td>
        <td class="sa-info-val">${item.valueHtml}</td>
      </tr>`;
    } else {
      tbodyHtml += `
      <tr>
        <td colspan="2" class="sa-info-full">${item.valueHtml}</td>
      </tr>`;
    }
  }

  return `
<div class="sa-section-card" id="sec-${id}">
  <div class="sa-section-head" style="background:linear-gradient(90deg,${gradFrom},${gradTo})">
    <span class="sa-section-icon">${icon}</span>
    <span class="sa-section-title">${label}</span>
  </div>
  <div class="sa-table-wrap">
    <table class="sa-table sa-info-table">
      <tbody>${tbodyHtml}
      </tbody>
    </table>
  </div>
</div>`;
}

// Side-by-side 2-column table (screenshot jaisi design)
function buildSideBySideTable($, list1, list2, cfg1, cfg2) {
  const items1 = [];
  list1.find("> li").each((_, li) => items1.push(parseLiItem($, li)));
  const items2 = [];
  list2.find("> li").each((_, li) => items2.push(parseLiItem($, li)));
  if (!items1.length && !items2.length) return null;

  function renderBullets(items) {
    let html = "";
    for (const item of items) {
      if (item.isNested && item.key) {
        html += `<li><strong>${escapeHtml(item.key)}</strong>${item.valueHtml}</li>`;
      } else if (item.key) {
        html += `<li><strong>${escapeHtml(item.key)}</strong> : <span class="sa-side-val">${item.valueHtml}</span></li>`;
      } else {
        html += `<li>${item.valueHtml}</li>`;
      }
    }
    return html;
  }

  return `
<div class="sa-side-wrap" id="sec-${cfg1.id}-${cfg2.id}">
  <table class="sa-side-table">
    <tbody>
      <tr>
        <th class="sa-side-th">
          <span class="sa-side-icon">${cfg1.icon}</span> ${cfg1.label}
        </th>
        <th class="sa-side-th">
          <span class="sa-side-icon">${cfg2.icon}</span> ${cfg2.label}
        </th>
      </tr>
      <tr>
        <td class="sa-side-td">
          <ul class="sa-side-list">${renderBullets(items1)}</ul>
        </td>
        <td class="sa-side-td">
          <ul class="sa-side-list">${renderBullets(items2)}</ul>
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 4 — INTELLIGENT SECTION RESTRUCTURING
// ═══════════════════════════════════════════════════════════════════════════

// Helper: given a heading-like node, walk forward siblings to find a ul/ol
function findNextList($, startNode) {
  let sibling = startNode.next();
  let tries   = 0;
  while (sibling.length && tries < 5) {
    tries++;
    const tag = (sibling.get(0)?.tagName ?? "").toLowerCase();
    if (tag === "ul" || tag === "ol") return sibling;
    if (!normalizeSpace(sibling.text()))  sibling = sibling.next();
    else break;
  }
  return null;
}

function collectSectionEntries($, root) {
  const entries = []; // { anchorNode, listNode, cfg }
  const visited = new WeakSet();

  // 4A: h1–h6 headings
  root.find("h1,h2,h3,h4,h5,h6").each((_, el) => {
    const hNode = $(el);
    const cfg   = detectSectionConfig(normalizeSpace(hNode.text()));
    if (!cfg) return;
    const listNode = findNextList($, hNode);
    if (!listNode || visited.has(listNode.get(0))) return;
    visited.add(listNode.get(0));
    entries.push({ anchorNode: hNode, listNode, cfg });
  });

  // 4B: <p> with only a <strong>/<b> child acting as section header
  root.find("p,div").each((_, el) => {
    const node   = $(el);
    const strong = node.find("> strong, > b").first();
    if (!strong.length) return;
    const cloned  = node.clone();
    cloned.find("strong,b").first().remove();
    if (normalizeSpace(cloned.text())) return; // has other text
    const cfg = detectSectionConfig(normalizeSpace(strong.text()));
    if (!cfg) return;
    const listNode = findNextList($, node);
    if (!listNode || visited.has(listNode.get(0))) return;
    visited.add(listNode.get(0));
    entries.push({ anchorNode: node, listNode, cfg });
  });

  // 4C: Fallback — <ul>/<ol> preceded by a node with section keyword text
  root.find("ul,ol").each((_, el) => {
    if (visited.has(el)) return;
    const listNode = $(el);
    const prev     = listNode.prev();
    if (!prev.length) return;
    const cfg = detectSectionConfig(normalizeSpace(prev.text()));
    if (!cfg) return;
    if (visited.has(el)) return;
    visited.add(el);
    entries.push({ anchorNode: prev, listNode, cfg });
  });

  return entries;
}

function restructureSections($, root) {
  const entries  = collectSectionEntries($, root);
  const usedIds  = new Set();
  const usedEls  = new WeakSet();

  // ── PASS 1: Try to pair sections side-by-side ──────────────────────────
  for (const [id1, id2] of PAIRED_SECTIONS) {
    const e1 = entries.find((e) => e.cfg.id === id1 && !usedIds.has(e.cfg.id));
    const e2 = entries.find((e) => e.cfg.id === id2 && !usedIds.has(e.cfg.id));
    if (!e1 || !e2) continue;

    const tableHtml = buildSideBySideTable($, e1.listNode, e2.listNode, e1.cfg, e2.cfg);
    if (!tableHtml) continue;

    // Replace e1's list with the side-by-side table
    e1.listNode.replaceWith(tableHtml);
    e1.anchorNode.remove();

    // Remove e2 entirely
    e2.listNode.remove();
    e2.anchorNode.remove();

    usedIds.add(id1);
    usedIds.add(id2);
    usedEls.add(e1.listNode.get(0));
    usedEls.add(e2.listNode.get(0));
  }

  // ── PASS 2: Remaining unpaired sections → single section card ──────────
  for (const entry of entries) {
    if (usedIds.has(entry.cfg.id)) continue;
    if (usedEls.has(entry.listNode.get(0))) continue;
    const cardHtml = convertListToSectionCard($, entry.listNode, entry.cfg);
    if (!cardHtml) continue;
    entry.listNode.replaceWith(cardHtml);
    entry.anchorNode.remove();
    usedIds.add(entry.cfg.id);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 5 — COMPETITOR REMOVAL & TEXT SANITISATION
// ═══════════════════════════════════════════════════════════════════════════

function removeCompetitorElements($, root, report) {
  // 5A: Sidebar tables
  root.find("table").each((_, el) => {
    const node      = $(el);
    const tableText = normalizeSpace(node.text()).toLowerCase();
    if (isSidebarSection(tableText)) {
      node.remove(); report.removedBanners += 1;
    }
  });

  // 5B: Sidebar <tr>
  root.find("tr").each((_, el) => {
    const node = $(el);
    const text = normalizeSpace(node.text()).toLowerCase();
    if (text.length < 500 && isSidebarSection(text)) {
      node.remove(); report.removedBanners += 1;
    }
  });

  // 5C: Any element with sidebar hints
  root.find("li,p,div,section,td").each((_, el) => {
    const node = $(el);
    const text = normalizeSpace(node.text()).toLowerCase();
    if (text.length < 500 && isSidebarSection(text)) {
      node.remove(); report.removedBanners += 1;
    }
  });

  // 5C.1: Competitor promo/follow/app text blocks
  root.find("p,li,div,section,td,th,span").each((_, el) => {
    const node = $(el);
    const text = normalizeSpace(node.text());
    if (!text || text.length > 1200) return;
    if (!hasCompetitorPromo(text)) return;
    if (node.find("table,ul,ol,section,article,form").length > 0) return;
    node.remove();
    report.removedBanners += 1;
  });

  // 5D: Standalone competitor-named leaf nodes
  root.find("p,span,div,td,a,h1,h2,h3,h4,h5,h6").each((_, el) => {
    const node = $(el);
    if (node.children("*").length > 0) return;
    const text = normalizeSpace(node.text());
    if (text.length < 150 && isCompetitorText(text)) node.remove();
  });

  // 5E: <a> whose text is a competitor brand
  root.find("a").each((_, el) => {
    const node     = $(el);
    const linkText = normalizeSpace(node.text());
    if (!isCompetitorText(linkText)) return;
    try {
      const href = normalizeSpace(node.attr("href"));
      const host = normalizeHost(new URL(href, TARGET_URL).hostname ?? "");
      if (!href || COMPETITOR_DOMAINS.has(host)) {
        dropNodePreservingText($, node);
      } else {
        node.text(TARGET_BRAND);
      }
    } catch {
      dropNodePreservingText($, node);
    }
  });

  // 5F: Global regex sweep on all remaining HTML
  root.find("*").each((_, el) => {
    const node  = $(el);
    const inner = node.html();
    if (!inner) return;
    if (COMPETITOR_BRAND_PATTERNS.some((r) => { const m = r.test(inner); r.lastIndex = 0; return m; })) {
      node.html(cleanCompetitorTextInHtml(inner));
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 6 — LINK, IMAGE & NODE PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

function processLinksAndImages($, root, sourceUrl, report) {
  root.find("a[href]").each((_, el) => {
    report.linksExamined += 1;
    const node      = $(el);
    const href      = normalizeSpace(node.attr("href"));
    const text      = normalizeSpace(node.text());
    const cls       = normalizeSpace(node.attr("class"));
    const id        = normalizeSpace(node.attr("id"));
    const composite = `${href} ${text} ${cls} ${id}`;

    if (hasBlockedPromoHint(composite)) {
      dropNodePreservingText($, node);
      report.removedBanners += 1;
      return;
    }

    if (
      isCompetitorUrl(href, sourceUrl) ||
      hasCompetitorPromo(composite) ||
      isCompetitorText(composite)
    ) {
      dropNodePreservingText($, node);
      report.removedBanners += 1;
      return;
    }

    if (isPdfLink(href, sourceUrl)) {
      node.attr("target", "_blank").attr("rel", "noopener noreferrer");
      node.addClass("sa-pdf-btn");
      const t = normalizeSpace(node.text()).toLowerCase();
      if (!t || ["check here","click here","download","view"].includes(t)) {
        node.html("&#x1F4C4; Download PDF");
      }
      return;
    }

    if (hasAnyHint(composite, SOCIAL_HINTS)) {
      dropNodePreservingText($, node);
      report.removedSocialLinks += 1;
      return;
    }

    if (hasAnyHint(composite, APP_HINTS)) {
      dropNodePreservingText($, node);
      report.removedAppLinks += 1;
      return;
    }

    node.attr("target", "_blank")
      .attr("rel", "noopener noreferrer");
  });

  root.find("img").each((_, el) => {
    const node      = $(el);
    const composite = [
      node.attr("src"), node.attr("alt"),
      node.attr("class"), node.attr("id"),
    ].join(" ");
    if (
      hasAnyHint(composite, APP_HINTS) ||
      hasAnyHint(composite, SOCIAL_HINTS) ||
      /banner|ads?|popup/i.test(composite)
    ) {
      node.remove(); report.removedBanners += 1;
    }
  });

  root.find("p,li,div,section").each((_, el) => {
    const node = $(el);
    const text = normalizeSpace(node.text());
    const hasNestedLayoutNodes = node.find("p,li,div,section,article,table,ul,ol").length > 0;
    if (!text || text.length > 250 || node.find("table").length) return;
    if (hasNestedLayoutNodes) return;
    if (hasBlockedPromoHint(text)) {
      node.remove();
      report.removedBanners += 1;
      return;
    }
    if (hasCompetitorPromo(text) || isCompetitorText(text)) {
      node.remove();
      report.removedBanners += 1;
      return;
    }
    if (hasAnyHint(text, APP_HINTS)) {
      node.remove(); report.removedAppLinks += 1; return;
    }
    if (hasAnyHint(text, SOCIAL_HINTS)) {
      node.remove(); report.removedSocialLinks += 1;
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 7 — EXISTING TABLE ENHANCEMENT
// ═══════════════════════════════════════════════════════════════════════════

function enhanceExistingTables($, root, report) {
  root.find("table").each((_, el) => {
    const node = $(el);
    if (node.closest(".sa-section-card,.sa-side-wrap").length) return;
    node.addClass("sa-table");
    node.removeAttr("border").removeAttr("cellpadding")
        .removeAttr("cellspacing").removeAttr("width");
    if (!node.parent().hasClass("sa-table-wrap")) {
      node.wrap('<div class="sa-table-wrap"></div>');
    }
    node.find("td[colspan], th[colspan]").each((_, cell) => {
      $(cell).addClass("sa-table-section-header");
    });
    report.tablesStyled += 1;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 8 — DISCLAIMER SANITISATION
// ═══════════════════════════════════════════════════════════════════════════

function sanitiseDisclaimer($, root) {
  root.find(".has-small-font-size, p, div").each((_, el) => {
    const node  = $(el);
    const inner = node.html() ?? "";
    if (!COMPETITOR_BRAND_PATTERNS.some((r) => { const m = r.test(inner); r.lastIndex = 0; return m; })) return;
    let cleaned = inner;
    cleaned = cleaned.replace(/sarkariresult\s*team/gi,  "our team");
    cleaned = cleaned.replace(/sarkariresult\.com\.cm/gi, TARGET_DOMAIN);
    cleaned = cleaned.replace(/sarkarinaukri/gi,          TARGET_BRAND);
    cleaned = cleaned.replace(/rojgarresult\.com/gi,      TARGET_DOMAIN);
    cleaned = cleaned.replace(/rojarresult\.com/gi,       TARGET_DOMAIN);
    cleaned = cleaned.replace(/sarkariexam\.com/gi,       TARGET_DOMAIN);
    cleaned = cleaned.replace(/sarkari\s*result/gi,       TARGET_BRAND);
    node.html(cleaned);
    node.addClass("sa-disclaimer");
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 9 — EMPTY NODE CLEANUP
// ═══════════════════════════════════════════════════════════════════════════

function cleanEmptyNodes($, root) {
  for (let pass = 0; pass < 3; pass++) {
    root.find("p,div,section,article,li,td,span").each((_, el) => {
      const node = $(el);
      if (
        !normalizeSpace(node.text()) &&
        !node.find("img,table,a,input,button,iframe").length &&
        node.children().length === 0
      ) node.remove();
    });
  }
}

function removeBlockedPromoNodes($, root, report) {
  root.find("a,p,li,div,section,span,td,th,button").each((_, el) => {
    const node = $(el);
    if (!node.length) return;
    const tag = String(el.tagName || "").toLowerCase();
    const text = normalizeSpace(node.text());
    if (!text || text.length > 1200) return;
    const isLeafLike = node.find("p,li,div,section,article,table,ul,ol").length === 0;
    if (!["a", "button"].includes(tag) && !isLeafLike) return;
    if (
      !hasBlockedPromoHint(text) &&
      !hasCompetitorPromo(text) &&
      !isCompetitorText(text) &&
      !isMetaFooterLine(text) &&
      !hasAnyHint(text, SOCIAL_HINTS) &&
      !hasAnyHint(text, APP_HINTS)
    ) return;
    node.remove();
    report.removedBanners += 1;
  });
}

function removeAuthorTagNodes($, root, report) {
  root.find("tr").each((_, el) => {
    const row = $(el);
    const firstCellText = normalizeSpace(row.find("th,td").first().text());
    const rowText = normalizeSpace(row.text());
    if (
      AUTHOR_TAG_CELL_REGEX.test(firstCellText) ||
      isAuthorOrTagLine(firstCellText) ||
      (rowText.length <= 200 && isAuthorOrTagLine(rowText))
    ) {
      row.remove();
      report.removedBanners += 1;
    }
  });

  root.find("p,div,li,section,td,th").each((_, el) => {
    const node = $(el);
    const label = normalizeSpace(node.find("> strong, > b").first().text());
    const text = normalizeSpace(node.text());
    if (!label || !text || text.length > 260) return;
    if (!isAuthorOrTagLine(label)) return;
    if (node.find("table,ul,ol,section,article").length > 0) return;
    node.remove();
    report.removedBanners += 1;
  });

  root.find("p,li,div,section,span,td,th,strong,b").each((_, el) => {
    const node = $(el);
    const text = normalizeSpace(node.text());
    if (!text || text.length > 200) return;
    if (!isAuthorOrTagLine(text)) return;
    if (node.find("table,ul,ol,section,article").length > 0) return;
    node.remove();
    report.removedBanners += 1;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 10 — MASTER CSS
// ═══════════════════════════════════════════════════════════════════════════

const MASTER_CSS = `
  :root {
    --sa-bg:       #eef2f7;
    --sa-card:     #ffffff;
    --sa-ink:      #13243a;
    --sa-muted:    #5a7289;
    --sa-line:     #dce5ef;
    --sa-brand:    #1560bd;
    --sa-brand-dk: #0f3460;
    --sa-brand-lt: #e8f0fe;
    --sa-green:    #0ea472;
    --sa-radius:   14px;
    --sa-shadow:   0 2px 20px rgba(18,40,72,0.10);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; font-size: 15px; }
  body {
    font-family: "Inter", "Segoe UI", Tahoma, sans-serif;
    background: var(--sa-bg);
    color: var(--sa-ink);
    line-height: 1.65;
    padding-bottom: 50px;
  }

  /* ── Shell ── */
  .sa-shell {
    max-width: 980px; margin: 0 auto;
    padding: 20px 14px;
    display: flex; flex-direction: column; gap: 16px;
  }

  /* ── Hero ── */
  .sa-hero {
    background: linear-gradient(120deg, #0f3460 0%, #1560bd 100%);
    border-radius: var(--sa-radius);
    padding: 26px 24px; color: #fff;
    box-shadow: var(--sa-shadow);
    position: relative; overflow: hidden;
  }
  .sa-hero::after {
    content: ""; position: absolute;
    right: -50px; bottom: -50px;
    width: 240px; height: 240px;
    background: rgba(255,255,255,0.06);
    border-radius: 50%; pointer-events: none;
  }
  .sa-hero-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.3);
    font-size: 0.7rem; font-weight: 600;
    padding: 3px 12px; border-radius: 20px;
    text-transform: uppercase; letter-spacing: .6px; margin-bottom: 12px;
  }
  .sa-hero h1 {
    font-size: clamp(1.05rem, 2.3vw, 1.65rem);
    font-weight: 700; line-height: 1.32;
    margin-bottom: 14px; position: relative; z-index: 1;
  }
  .sa-hero-meta {
    display: flex; flex-wrap: wrap; gap: 14px;
    font-size: 0.83rem; opacity: 0.92; position: relative; z-index: 1;
  }
  .sa-hero-meta span { display: flex; align-items: center; gap: 5px; }
  .sa-hero-meta a { color: #a8d4ff; text-decoration: none; }

  /* ── Generic Card ── */
  .sa-card {
    background: var(--sa-card);
    border: 1px solid var(--sa-line);
    border-radius: var(--sa-radius);
    box-shadow: var(--sa-shadow); overflow: hidden;
  }
  .sa-card-header {
    padding: 12px 18px;
    background: linear-gradient(90deg, #f0f5fc, #fff);
    border-bottom: 2px solid var(--sa-line);
    display: flex; align-items: center; gap: 10px;
  }
  .sa-card-icon {
    width: 30px; height: 30px;
    background: var(--sa-brand-lt); color: var(--sa-brand);
    border-radius: 8px; display: grid; place-items: center;
    font-size: 15px; flex-shrink: 0;
  }
  .sa-card-header h2 {
    font-size: 0.95rem; font-weight: 700; color: #0d2a47; margin: 0;
  }
  .sa-card-body { padding: 18px 20px; }

  /* ── Section Cards (single column) ── */
  .sa-section-card {
    background: var(--sa-card);
    border: 1px solid var(--sa-line);
    border-radius: var(--sa-radius);
    box-shadow: var(--sa-shadow);
    overflow: hidden; scroll-margin-top: 70px;
  }
  .sa-section-head {
    padding: 12px 18px;
    display: flex; align-items: center; gap: 10px; color: #fff;
  }
  .sa-section-icon { font-size: 1.2rem; line-height: 1; }
  .sa-section-title { font-size: 0.97rem; font-weight: 700; letter-spacing: .1px; }

  /* ── Info Tables (single section) ── */
  .sa-info-table { width: 100%; border-collapse: collapse; }
  .sa-info-table .sa-info-key {
    width: 38%; padding: 10px 14px;
    font-weight: 600; color: #0d2a47;
    background: #f6f9ff;
    border-bottom: 1px solid var(--sa-line);
    vertical-align: top; font-size: 0.87rem;
  }
  .sa-info-table .sa-info-val {
    padding: 10px 14px;
    border-bottom: 1px solid var(--sa-line);
    color: var(--sa-ink);
    font-size: 0.87rem; vertical-align: top;
  }
  .sa-info-table .sa-info-full {
    padding: 10px 14px;
    border-bottom: 1px solid var(--sa-line);
    color: var(--sa-ink); font-size: 0.87rem;
  }
  .sa-info-table tr:last-child td { border-bottom: none; }
  .sa-info-table tr:hover .sa-info-key,
  .sa-info-table tr:hover .sa-info-val { background: #eef4ff; transition: background .12s; }

  /* ── Side-by-Side 2-Column Table (screenshot style) ── */
  .sa-side-wrap {
    width: 100%; overflow-x: auto;
    border-radius: 10px;
    border: 2px solid #6b0f1a;
    box-shadow: 0 3px 16px rgba(107,15,26,0.14);
    position: relative;
  }
  .sa-side-wrap::after {
    content: ""; display: block; height: 4px;
    background: linear-gradient(90deg, #0ea472, #1560bd);
    border-radius: 0 0 8px 8px;
  }
  .sa-side-table {
    width: 100%; border-collapse: collapse;
    min-width: 520px; font-size: 0.88rem;
  }
  .sa-side-th {
    background: linear-gradient(90deg, #6b0f1a, #8b1a2a);
    color: #fff; font-weight: 700; font-size: 0.95rem;
    text-align: center; padding: 13px 16px;
    width: 50%; border: 1px solid #8b1a2a; letter-spacing: .2px;
  }
  .sa-side-th .sa-side-icon { font-size: 1rem; margin-right: 5px; }
  .sa-side-td {
    padding: 14px 16px; vertical-align: top;
    border: 1px solid #e0c8cb;
    background: #fff; width: 50%;
  }
  .sa-side-list {
    list-style: disc; padding-left: 16px; margin: 0;
  }
  .sa-side-list > li {
    margin-bottom: 8px; line-height: 1.58; color: #1a1a2e;
  }
  .sa-side-list > li strong { color: #1a1a2e; font-weight: 600; }
  .sa-side-val { font-weight: 700; }
  /* Nested sub-list (Payment Mode etc.) */
  .sa-nested-list {
    list-style: disc; padding-left: 14px; margin-top: 5px;
  }
  .sa-nested-list .sa-sub-item {
    font-size: 0.84rem; color: #444; margin: 3px 0;
  }
  /* Inline nested list inside section card */
  .sa-side-list .sa-nested-list {
    list-style: disc; padding-left: 14px; margin-top: 4px;
  }

  /* ── General (existing) Tables ── */
  .sa-table-wrap {
    width: 100%; overflow-x: auto;
    border-radius: 10px; border: 1px solid var(--sa-line);
    margin: 12px 0; background: #fff;
  }
  table.sa-table {
    width: 100%; border-collapse: collapse;
    min-width: 420px; font-size: 0.87rem;
  }
  table.sa-table th {
    padding: 11px 14px;
    background: var(--sa-brand-dk); color: #fff;
    font-weight: 600; font-size: 0.8rem;
    text-transform: uppercase; letter-spacing: .4px;
    text-align: left; white-space: nowrap;
  }
  table.sa-table td {
    padding: 9px 14px;
    border-bottom: 1px solid var(--sa-line);
    vertical-align: middle;
  }
  table.sa-table tr:nth-child(even) td { background: #f5f8ff; }
  table.sa-table tr:last-child td     { border-bottom: none; }
  table.sa-table tr:hover td          { background: var(--sa-brand-lt); transition: background .12s; }
  table.sa-table .sa-table-section-header,
  table.sa-table td[colspan] {
    background: linear-gradient(90deg, #0f3460, #1560bd) !important;
    color: #fff !important; font-weight: 700;
    font-size: 0.88rem; text-align: center !important;
    padding: 12px 14px; letter-spacing: .2px;
  }

  /* ── Content Typography ── */
  .sa-content { color: var(--sa-ink); line-height: 1.72; font-size: 0.95rem; overflow-wrap: anywhere; }
  .sa-content h1,.sa-content h2,.sa-content h3,
  .sa-content h4,.sa-content h5,.sa-content h6 {
    color: #0d2a47; margin: 1.3em 0 0.5em; font-weight: 700; line-height: 1.3;
  }
  .sa-content h2 { font-size: 1.08rem; border-left: 3px solid var(--sa-brand); padding-left: 9px; }
  .sa-content h3 { font-size: 1rem; }
  .sa-content p  { margin-bottom: 0.7em; }
  .sa-content ul,.sa-content ol { padding-left: 1.2rem; margin-bottom: 0.7em; }
  .sa-content li { margin-bottom: 5px; }
  .sa-content strong { color: #0d2a47; }
  .sa-content a { color: var(--sa-brand); text-decoration: none; font-weight: 500; border-bottom: 1px dashed rgba(21,96,189,.35); }
  .sa-content a:hover { color: #0a4d9b; border-bottom-style: solid; }

  /* ── PDF Button ── */
  a.sa-pdf-btn {
    display: inline-flex !important; align-items: center; gap: 5px;
    background: linear-gradient(135deg, #1560bd, #0ea472) !important;
    color: #fff !important;
    padding: 5px 13px !important; border-radius: 7px !important;
    font-size: 0.8rem !important; font-weight: 600 !important;
    text-decoration: none !important; border: none !important;
    transition: opacity .2s, transform .1s; white-space: nowrap;
  }
  a.sa-pdf-btn:hover { opacity: 0.86; transform: translateY(-1px); }

  /* ── Disclaimer ── */
  .sa-disclaimer, .has-small-font-size {
    font-size: 0.78rem; color: var(--sa-muted);
    background: #f8fafc; border-left: 3px solid #c0cdd8;
    padding: 12px 15px; border-radius: 6px;
    margin-top: 8px; line-height: 1.6;
  }

  /* ── Footer ── */
  .sa-footer {
    text-align: center; padding: 20px 14px 8px;
    font-size: 0.8rem; color: var(--sa-muted);
    border-top: 1px solid var(--sa-line); margin-top: 8px;
  }
  .sa-footer strong { color: var(--sa-brand); }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .sa-hero    { padding: 18px 14px; }
    .sa-card-body { padding: 14px; }
    .sa-info-table .sa-info-key { width: 44%; }
    table.sa-table { min-width: 340px; font-size: 0.82rem; }
    a.sa-pdf-btn { font-size: 0.75rem !important; padding: 4px 10px !important; }
    /* Side table mobile: stack columns */
    .sa-side-table,
    .sa-side-table tbody,
    .sa-side-table tr { display: block; }
    .sa-side-th, .sa-side-td {
      display: block; width: 100% !important;
      border: none; border-bottom: 1px solid #e0c8cb;
    }
    .sa-side-table { min-width: unset; }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 11 — DIFF UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function extractComparableLines(html = "") {
  const $ = cheerio.load(String(html ?? ""));
  $("script,style,noscript,iframe").remove();
  const lines = [];
  $("h1,h2,h3,h4,h5,h6,p,li,th,td,a,strong,em").each((_, el) => {
    const t = normalizeSpace($(el).text());
    if (t && t.length >= 3) lines.push(t);
  });
  return Array.from(new Set(lines));
}

export function diffPreparedHtml(oldHtml = "", newHtml = "", options = {}) {
  const limit    = Math.max(1, Number(options.limit ?? 20));
  const oldLines = extractComparableLines(oldHtml);
  const newLines = extractComparableLines(newHtml);
  const oldSet   = new Set(oldLines);
  const newSet   = new Set(newLines);
  const added = [], removed = [];
  for (const line of newLines) if (!oldSet.has(line)) added.push(line);
  for (const line of oldLines) if (!newSet.has(line)) removed.push(line);
  return {
    added:        added.slice(0, limit),
    removed:      removed.slice(0, limit),
    addedCount:   added.length,
    removedCount: removed.length,
  };
}

export function buildPreparedHtmlChanges(diff = {}, limit = 10) {
  const lim     = Math.max(1, Number(limit ?? 10));
  const out     = [];
  const added   = Array.isArray(diff.added)   ? diff.added.slice(0, lim)   : [];
  const removed = Array.isArray(diff.removed) ? diff.removed.slice(0, lim) : [];
  for (const item of added)
    out.push({ field: "html.content.added",   oldValue: "",                newValue: String(item ?? "") });
  for (const item of removed)
    out.push({ field: "html.content.removed", oldValue: String(item ?? ""), newValue: "" });
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 12 — MAIN EXPORT: buildReadyPostHtml
// ═══════════════════════════════════════════════════════════════════════════

export function buildReadyPostHtml({
  title = "",
  sourceUrl = "",
  contentHtml = "",
} = {}) {
  const $ = cheerio.load(String(contentHtml ?? ""), { decodeEntities: false });
  const root = $("body").length ? $("body") : $.root();

  const report = {
    linksExamined:           0,
    replacedCompetitorLinks: 0,
    removedSocialLinks:      0,
    removedAppLinks:         0,
    removedBanners:          0,
    tablesStyled:            0,
    sectionsConverted:       0,
    generatedAt:             new Date().toISOString(),
  };

  // STEP 1: Remove noisy DOM elements
  $(NOISY_SELECTORS.join(",")).each((_, el) => {
    $(el).remove(); report.removedBanners += 1;
  });

  // STEP 2: Remove sidebar tables, competitor name nodes, brand text
  removeCompetitorElements($, root, report);

  // STEP 3: Strip unsafe attributes
  stripUnsafeAttributes($, root);

  // STEP 4: Convert section lists → side-by-side tables / section cards
  restructureSections($, root);

  // STEP 5: Process links & images
  processLinksAndImages($, root, sourceUrl, report);

  // STEP 6: Enhance remaining native tables
  enhanceExistingTables($, root, report);

  // STEP 7: Sanitise disclaimer text
  sanitiseDisclaimer($, root);

  // STEP 8: Remove author/tag meta lines
  removeAuthorTagNodes($, root, report);

  // STEP 9: Remove leftover promo/join blocks
  removeBlockedPromoNodes($, root, report);

  // STEP 10: Final global regex sweep
  const rawBody     = root.html() ?? "";
  const cleanedBody = cleanCompetitorTextInHtml(rawBody);
  if (cleanedBody !== rawBody) root.html(cleanedBody);

  // STEP 11: Remove empty nodes (3 passes)
  cleanEmptyNodes($, root);

  // STEP 12: Build final output HTML
  const finalBody  = root.html() ?? "";
  const heading    = escapeHtml(
    String(title || $("h1").first().text() || "Recruitment Details").trim()
  );
  const year    = new Date().getFullYear();
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const newHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${heading} | SarkariAfsar</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>${MASTER_CSS}</style>
</head>
<body>

  <main class="sa-shell">

    <section class="sa-hero">
      <div class="sa-hero-badge">📋 Official Notification</div>
      <h1>${heading}</h1>
      <div class="sa-hero-meta">
        <span>🌐 <a href="${TARGET_URL}" target="_blank" rel="noopener noreferrer">sarkariafsar.com</a></span>
        <span>🗓 ${dateStr}</span>
      </div>
    </section>

    <div class="sa-card">
      <div class="sa-card-header">
        <span class="sa-card-icon">📄</span>
        <h2>Notification Details</h2>
      </div>
      <div class="sa-card-body">
        <div class="sa-content">
          ${finalBody}
        </div>
      </div>
    </div>

  </main>

  <footer class="sa-footer">
    <p>© ${year} <strong>SarkariAfsar.com</strong> — All Rights Reserved</p>
    <p style="margin-top:4px;">India's Trusted Sarkari Jobs &amp; Results Platform</p>
  </footer>

</body>
</html>`;

  return { newHtml, report };
}
