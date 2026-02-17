const clean = (t) => String(t || "").replace(/\s+/g, " ").trim();

function pickFirstMatch(text, regex) {
  const m = text.match(regex);
  return m?.[1] ? clean(m[1]) : null;
}

function pickAllMatches(text, regex) {
  const out = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m[1]) out.push(clean(m[1]));
  }
  return out;
}

function normalizeMoney(s) {
  if (!s) return null;
  return s.replace(/[^\d]/g, "") || null;
}

function normalizeDate(s) {
  // keep as text for now; later you can convert to ISO
  return s ? clean(s) : null;
}

/**
 * Strong extractor using contentText (site-agnostic but tuned for SarkariResult-like posts)
 */
export function parseJobDetailsFromText(contentText = "") {
  const t = clean(contentText);

  // Advt. No
  const advtNo =
    pickFirstMatch(t, /\(Advt\.?\s*No\.?\s*[:\-]?\s*([^)]+)\)/i) ||
    pickFirstMatch(t, /Advt\.?\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-\s]+)\b/i) ||
    pickFirstMatch(t, /\bCEN\s*[:\-]?\s*([0-9\/\-]+)\b/i);

  // Total Posts
  const totalPosts =
    pickFirstMatch(t, /\bfor\s*([0-9,]{2,})\s*(positions|posts)\b/i) ||
    pickFirstMatch(t, /\bTotal\s*Post\s*([0-9,]{2,})\b/i) ||
    pickFirstMatch(t, /\((\d{2,3}(?:,\d{3})+)\s*Post/i);

  // Post Date
  const postDate =
    pickFirstMatch(t, /\bPost\s*Date:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);

  // Apply start / last date
  const applyStart =
    pickFirstMatch(t, /\bOnline\s*Apply\s*Start\s*Date\s*:\s*([A-Za-z0-9\s\-]+)\b/i) ||
    pickFirstMatch(t, /\bApplication\s*Form\s*Has\s*Started\s*on\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i) ||
    pickFirstMatch(t, /\bapply\s*start(?:ed)?\s*date\s*[:\-]?\s*([A-Za-z0-9\s\-]+)\b/i);

  const applyLast =
    pickFirstMatch(t, /\bOnline\s*Apply\s*Last\s*Date\s*:\s*([A-Za-z0-9\s\-]+)\b/i) ||
    pickFirstMatch(t, /\bcan\s*apply\s*till\s*the\s*([0-9]{1,2}\s*[A-Za-z]+\s*\d{4}|[A-Za-z]+\s+\d{1,2},\s+\d{4})/i) ||
    pickFirstMatch(t, /\blast\s*date\s*to\s*apply\s*[:\-]?\s*([A-Za-z0-9\s\-]+)\b/i);

  // Fee
  const feeGen =
    pickFirstMatch(t, /\bFor\s*General,\s*OBC.*?:\s*₹?\s*([0-9,]+)/i) ||
    pickFirstMatch(t, /\bGeneral.*?₹\s*([0-9,]+)/i);

  const feeSc =
    pickFirstMatch(t, /\bFor\s*SC\/\s*ST.*?:\s*₹?\s*([0-9,]+)/i) ||
    pickFirstMatch(t, /\bSC.*?₹\s*([0-9,]+)/i);

  // Refund (if any)
  const refundGen = pickFirstMatch(t, /\bRefund\s*Amount.*?For\s*General,\s*OBC.*?:\s*₹?\s*([0-9,]+)/i);
  const refundSc = pickFirstMatch(t, /\bRefund\s*Amount.*?For\s*SC\/\s*ST.*?:\s*₹?\s*([0-9,]+)/i);

  // Age
  const minAge =
    pickFirstMatch(t, /\bMinimum\s*Age\s*[:\-]?\s*([0-9]{1,2})/i) ||
    pickFirstMatch(t, /\bMinimum\s*age\s*required\s*is\s*([0-9]{1,2})/i);

  const maxAge =
    pickFirstMatch(t, /\bMaximum\s*Age\s*[:\-]?\s*([0-9]{1,2})/i) ||
    pickFirstMatch(t, /\bMaximum\s*Age\s*Is\s*([0-9]{1,2})/i);

  const ageAsOn =
    pickFirstMatch(t, /\bas\s*on\s*([0-9]{1,2}\s*[A-Za-z]+\s*\d{4}|[0-9]{1,2}\s*[A-Za-z]+\s*\d{4}|[0-9]{1,2}\s*[A-Za-z]+\s*\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4}|[0-9]{1,2}\s+[A-Za-z]+\s+\d{4})/i);

  // Selection (these sites often list in one line)
  const selection = pickFirstMatch(
    t,
    /\bMode\s*Of\s*Selection\s*(.*?)(SOME\s*USEFUL|IMPORTANT\s*LINKS|Disclaimer:|$)/i
  );

  // Eligibility (best-effort)
  const eligibility = pickFirstMatch(
    t,
    /\bEligibility\s*Criteria\s*(.*?)(How\s*To\s*Fill|Mode\s*Of\s*Selection|SOME\s*USEFUL|IMPORTANT\s*LINKS|$)/i
  );

  return {
    postDate: normalizeDate(postDate),

    advtNo: advtNo ? clean(advtNo) : null,
    totalPosts: totalPosts ? clean(totalPosts) : null,

    importantDates: {
      applyStart: normalizeDate(applyStart),
      applyLast: normalizeDate(applyLast),
    },

    fee: {
      generalObc: normalizeMoney(feeGen),
      scSt: normalizeMoney(feeSc),
      refundGeneralObc: normalizeMoney(refundGen),
      refundScSt: normalizeMoney(refundSc),
    },

    age: {
      min: minAge ? Number(minAge) : null,
      max: maxAge ? Number(maxAge) : null,
      asOn: normalizeDate(ageAsOn),
    },

    eligibility: eligibility ? clean(eligibility) : null,
    selection: selection ? clean(selection) : null,
  };
}

/**
 * Optional: tables se aur accurate nikalna (recommended)
 * Tumhare response me tables index 7 is "SOME USEFUL IMPORTANT LINKS" etc.
 */
export function parseImportantLinksFromTables(tables = []) {
  // find a table which contains "Apply Online Link"
  const out = { applyOnline: null, notificationPdf: [], officialWebsite: null };

  for (const t of tables) {
    const rows = t?.rows || [];
    const flat = rows.flat().map((x) => String(x || "").toLowerCase()).join(" | ");

    if (!flat.includes("apply online") && !flat.includes("official notification")) continue;

    // We'll just flag presence here; actual URLs are better from importantLinks array
    // This is a placeholder for future enhancement if you pass links with context.
  }
  return out;
}
