File dekh liya. 3 bugs hain jo fix karne chahiye. Sab milega neeche:

🐛 Bug 1 — Critical: isGeneration=true missing (line ~320)
File mein generation branch mein yeh line hai:

javascript
// ❌ WRONG — isGeneration=false (default), strips all content fields
const safePatch = sanitizeAiPatch(baselineJob, generationResult.patch);
introduction, faq, meta, tags, conclusion, disclaimer sab strip ho jaate hain kyunki woh trackedFieldPaths mein nahi hain.

javascript
// ✅ FIX
const safePatch = sanitizeAiPatch(baselineJob, generationResult.patch, true);
🐛 Bug 2 — Dead Code in generateFullJobContent
generateFullJobContent mein ek local CONTENT_FIELDS filter hai jo ab redundant hai — wahi kaam sanitizeAiPatch(isGeneration=true) karega. Isko clean karo:

javascript
const generateFullJobContent = async (job = {}) => {
  const client = getAiClient();
  const sourceUrls = extractOfficialSourceUrls(job);
  const tools =
    sourceUrls.length > 0
      ? [{ urlContext: {} }, { googleSearch: {} }]
      : [{ googleSearch: {} }];

  const response = await client.models.generateContent({
    model: DEFAULT_JOB_AI_MODEL,
    contents: buildFullGenerationPrompt({ job, sourceUrls }),
    config: { temperature: 0.2, tools },
  });

  const rawText = String(response?.text || "").trim();

  // ✅ No local filter — sanitizeAiPatch(isGeneration=true) handles it
  return {
    sourceUrls,
    rawText,
    patch: parseModelJson(rawText),
  };
};
🐛 Bug 3 — buildFullGenerationPrompt is postType-blind
Admission/result/admit_card posts ke liye age_limit, application_fee, exam_pattern irrelevant hain. Yeh prompt ko confuse karta hai aur empty/wrong fields generate hote hain.

javascript
const POST_TYPE_SCHEMA_HINTS = {
  admission: `
SKIP these fields (set null): application_fee, age_limit, exam_pattern, salary, pay_scale
FOCUS on: important_dates (counselling schedule), vacancy_details (seats/courses/institutes),
eligibility_criteria (exam cutoff/percentile), selection_process (rounds/allocation),
how_to_apply (reporting steps), official_links (real PDF links)`,

  admit_card: `
SKIP these fields (set null): application_fee, vacancy_details, selection_process, exam_pattern, salary
FOCUS on: important_dates (exam date, admit card release), how_to_apply (download steps),
eligibility_criteria (who gets admit card), official_links (download link, login portal)`,

  result: `
SKIP these fields (set null): application_fee, how_to_apply, selection_process
FOCUS on: important_dates (result date, interview dates), vacancy_details (selected count, cutoff),
exam_pattern (paper-wise cutoff if available), official_links (result PDF, merit list links)`,

  answer_key: `
SKIP these fields (set null): application_fee, age_limit, vacancy_details, salary
FOCUS on: important_dates (key release, objection window), how_to_apply (objection steps),
official_links (key PDF, objection portal)`,

  corrigendum: `
SKIP these fields (set null): exam_pattern, salary, age_limit
FOCUS on: important_dates (revised dates), notification_details (what changed), official_links`,
};

const buildFullGenerationPrompt = ({ job = {}, sourceUrls = [] } = {}) => {
  const title = job?.jobtitle || job?.title || "";
  const sourceUrl = job?.sourceUrl || sourceUrls[0] || "";
  const domain = job?.sourceDomain || "";
  const sectionName = job?.sectionName || "";
  const postType = job?.postType || "job";
  const schemaHint = POST_TYPE_SCHEMA_HINTS[postType] || "";

  return `
You are a senior content writer for sarkariresult.com.cm — an Indian government job portal.

Generate a COMPLETE, SEO-optimized, detailed post in the EXACT JSON schema below.
Use Google Search + URL context to fetch REAL data from official sources.

SEARCH CONTEXT:
Title: ${title}
Source URL: ${sourceUrl}
Source Domain: ${domain}
Section: ${sectionName}
Post Type: ${postType}
${schemaHint ? `\nPOST TYPE INSTRUCTIONS:\n${schemaHint}\n` : ""}
REQUIRED SCHEMA (return JSON only, no markdown):
{
  "status": "current status with emoji (e.g. Open Round Result Declared ✅ | Reporting 25-30 Aug 2025)",
  "conductingAuthority": "full authority name (e.g. All India Institute of Medical Sciences, New Delhi)",
  "advertisementNumber": "official notice/advertisement number",
  "introduction": {
    "heading": "SEO heading with year and key info",
    "content": "300-400 word detailed intro — include real dates, post counts, key facts. Mix English/Hindi where natural"
  },
  "important_dates": {
    "heading": "Important Dates",
    "dates": [ { "event": "event name", "date": "DD Month YYYY" } ],
    "pro_tip": "1 actionable tip for candidates"
  },
  "vacancy_details": {
    "heading": "Vacancy / Seat Details",
    "total_posts": null,
    "posts": [ { "post_name": "...", "vacancies": 0, "pay_scale": "..." } ]
  },
  "application_fee": {
    "heading": "Application Fee",
    "fees": [ { "category": "General/OBC/SC/ST/EWS", "amount": 0, "currency": "INR" } ],
    "payment_mode": "Online / Net Banking / UPI / Debit Card",
    "human_note": "fee context in plain language"
  },
  "age_limit": {
    "heading": "Age Limit",
    "minimum_age": 18,
    "maximum_age": 35,
    "age_rule": "as on DD Month YYYY",
    "relaxation": [ { "category": "SC/ST/OBC/PwBD", "relaxation": "X years" } ],
    "human_note": "plain language age explanation"
  },
  "eligibility_criteria": {
    "heading": "Eligibility Criteria",
    "criteria": [ { "point": "...", "detail": "..." } ]
  },
  "selection_process": {
    "heading": "Selection Process",
    "stages": [ { "step": 1, "name": "...", "description": "..." } ],
    "note": "important note about selection"
  },
  "how_to_apply": {
    "heading": "How to Apply / Steps",
    "intro": "one line intro",
    "documents_required": ["document 1"],
    "steps": [ { "step": 1, "action": "..." } ],
    "important_reminder": "critical warning for candidates"
  },
  "exam_pattern": {
    "heading": "Exam Pattern",
    "subjects": [ { "subject": "...", "questions": 0, "marks": 0 } ],
    "marking_scheme": { "correct_answer": "+X marks", "wrong_answer": "-X marks" },
    "note": "..."
  },
  "official_links": {
    "heading": "Official Website & Links",
    "official_website": "https://...",
    "links": [
      { "label": "descriptive label", "url": "https://...", "status": "Active ✅" }
    ]
  },
  "faq": {
    "heading": "Frequently Asked Questions",
    "questions": [ { "question": "...", "answer": "..." } ]
  },
  "meta": {
    "description": "SEO meta description under 155 chars",
    "keywords": ["keyword1", "keyword2"]
  },
  "tags": ["tag1", "tag2"],
  "conclusion": {
    "heading": "Final Words",
    "content": "150-200 word motivating conclusion",
    "cta": "clear call to action"
  },
  "disclaimer": "standard disclaimer mentioning official website"
}

RULES:
- Use REAL dates, REAL URLs, REAL counts from official sources only
- Set null for sections that are genuinely not applicable for this post type
- official_links must have REAL working URLs — include direct PDF links when available
- FAQ must have 7-10 Q&As candidates actually ask about this specific post
- Return ONLY valid JSON — no markdown fences, no extra text outside JSON
`.trim();
};
✅ Final Corrected monitorSingleJobWithAi — Generation Branch Only
Only yeh ek line change hai (Bug 1 fix):

javascript
// ─── BRANCH: Empty doc → Full Content Generation ──────────────────────
if (isNewEmptyDocument(baselineJob)) {
  let generationResult;

  try {
    generationResult = await generateFullJobContent(baselineJob);
  } catch (error) {
    await saveMonitoringMetadata(doc, baselineMonitoring, {
      lastCheckedAt: now,
      lastDetectionStatus: "error",
      lastError: truncate(error?.message || error, 500),
    });
    return {
      id: String(doc?._id || ""),
      status: "error",
      jobTitle: baselineJob.jobtitle || baselineJob.title || "",
      changedFields: [],
      mailed: false,
      error: error?.message || String(error),
    };
  }

  // ✅ Bug 1 Fix: isGeneration=true
  const safePatch = sanitizeAiPatch(baselineJob, generationResult.patch, true);

  // ... rest unchanged