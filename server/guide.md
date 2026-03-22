🔍 Root Cause
text
Auto-generated doc → almost ALL tracked fields = null
→ buildAiPrompt() sirf "changes detect karo" bolta hai
→ Gemini ko pata hi nahi ki full content banana hai
→ Result: generic/empty output
✅ Fix — 3 New Functions + 1 Modified
1. isNewEmptyDocument() — Detect karo ki full generation chahiye
javascript
const isNewEmptyDocument = (job = {}) => {
  const monitoring = job?.aiMonitoring || {};
  const snapshot = monitoring.trackedSnapshot || {};
  const trackedFields = monitoring.trackedFieldPaths || [];
  if (trackedFields.length === 0) return false;

  const nullCount = trackedFields.filter(
    (key) => snapshot[key] === null || snapshot[key] === undefined
  ).length;

  return nullCount / trackedFields.length >= 0.7; // 70%+ fields null = empty doc
};
2. buildFullGenerationPrompt() — Rich content generation prompt
javascript
const buildFullGenerationPrompt = ({ job = {}, sourceUrls = [] } = {}) => {
  const title = job?.jobtitle || job?.title || "";
  const sourceUrl = job?.sourceUrl || sourceUrls[0] || "";
  const domain = job?.sourceDomain || "";
  const sectionName = job?.sectionName || "";
  const postType = job?.postType || "";

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

REQUIRED SCHEMA (return JSON only, no markdown):
{
  "status": "current status with emoji",
  "conductingAuthority": "full authority name",
  "advertisementNumber": "official notice number",
  "introduction": {
    "heading": "SEO heading with year and key info",
    "content": "300-400 word detailed intro in English/Hindi mix — include dates, posts count, key facts"
  },
  "important_dates": {
    "heading": "...",
    "dates": [
      { "event": "event name", "date": "DD Month YYYY" }
    ],
    "pro_tip": "actionable tip for candidates"
  },
  "vacancy_details": {
    "heading": "...",
    "total_posts": number or null,
    "posts": [ { "post_name": "...", "vacancies": number, "pay_scale": "..." } ]
  },
  "application_fee": {
    "heading": "...",
    "fees": [ { "category": "General/OBC/SC/ST/EWS", "amount": number, "currency": "INR" } ],
    "payment_mode": "...",
    "human_note": "fee context in plain language"
  },
  "age_limit": {
    "heading": "...",
    "minimum_age": number,
    "maximum_age": number,
    "age_rule": "as on DD Month YYYY",
    "relaxation": [ { "category": "SC/ST/OBC/PwBD", "relaxation": "X years" } ],
    "human_note": "plain language explanation"
  },
  "eligibility_criteria": {
    "heading": "...",
    "criteria": [ { "point": "...", "detail": "..." } ]
  },
  "selection_process": {
    "heading": "...",
    "stages": [ { "step": 1, "name": "...", "description": "..." } ],
    "note": "important note about selection"
  },
  "how_to_apply": {
    "heading": "...",
    "intro": "one line intro",
    "documents_required": ["document 1", "document 2"],
    "steps": [ { "step": 1, "action": "..." } ],
    "important_reminder": "critical warning for candidates"
  },
  "exam_pattern": {
    "heading": "...",
    "subjects": [ { "subject": "...", "questions": number, "marks": number } ],
    "marking_scheme": { "correct_answer": "...", "wrong_answer": "..." },
    "note": "..."
  },
  "official_links": {
    "heading": "...",
    "official_website": "https://...",
    "links": [
      { "label": "Apply Online / Download PDF / Official Notice", "url": "https://...", "status": "Active ✅ / Archive" }
    ]
  },
  "faq": {
    "heading": "...",
    "questions": [
      { "question": "...", "answer": "..." }
    ]
  },
  "meta": {
    "description": "150 char SEO meta description",
    "keywords": ["keyword 1", "keyword 2", "...8-10 keywords total"]
  },
  "tags": ["tag1", "tag2", "...7-10 tags"],
  "conclusion": {
    "heading": "...",
    "content": "150-200 word motivating conclusion",
    "cta": "clear call to action"
  },
  "disclaimer": "standard disclaimer mentioning official website"
}

RULES:
- Use REAL dates, REAL URLs, REAL seat counts from official sources
- Mix English + Hindi where it helps readability (not forced)
- Include ALL relevant sections — skip only if truly not applicable (use null for that field)
- official_links must have REAL working URLs — not placeholder links
- FAQ must have 7-10 real, useful Q&As that candidates actually ask
- Return ONLY valid JSON — no markdown fences, no extra text
`.trim();
};
3. generateFullJobContent() — Call Gemini for generation
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
    config: {
      temperature: 0.2,
      tools,
    },
  });

  const rawText = String(response?.text || "").trim();
  const parsed = parseModelJson(rawText);

  // Only keep keys allowed by trackedFieldPaths + extra content fields
  const CONTENT_FIELDS = new Set([
    "status", "conductingAuthority", "advertisementNumber",
    "introduction", "important_dates", "vacancy_details",
    "application_fee", "age_limit", "eligibility_criteria",
    "selection_process", "how_to_apply", "exam_pattern",
    "official_links", "faq", "meta", "tags", "conclusion",
    "disclaimer", "applyLastDate",
  ]);

  const sanitized = {};
  for (const [key, value] of Object.entries(parsed || {})) {
    if (CONTENT_FIELDS.has(key) && value !== undefined && value !== null) {
      sanitized[key] = value;
    }
  }

  return {
    sourceUrls,
    rawText,
    patch: sanitized,
  };
};
4. Modified monitorSingleJobWithAi() — Route to generation vs monitoring
Replace the existing monitorSingleJobWithAi with this:

javascript
export const monitorSingleJobWithAi = async (doc, { force = false } = {}) => {
  const baselineJob = await prepareBaselineJobForMonitoring(doc);
  const baselineMonitoring = baselineJob.aiMonitoring;
  const now = new Date();

  // ─── SKIP if already checked today (unless forced) ───────────────────
  if (!force && wasCheckedToday(baselineMonitoring.lastCheckedAt)) {
    return {
      id: String(doc?._id || ""),
      status: "skipped",
      jobTitle: baselineJob.jobtitle || baselineJob.title || "",
      changedFields: [],
      mailed: false,
    };
  }

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

    const safePatch = sanitizeAiPatch(baselineJob, generationResult.patch);

    if (Object.keys(safePatch).length === 0) {
      await saveMonitoringMetadata(doc, baselineMonitoring, {
        lastCheckedAt: now,
        lastDetectionStatus: "needs_review",
        lastSummary: "Full generation ran but produced no valid patch fields.",
        lastConfidence: "low",
        lastSources: generationResult.sourceUrls.map((url) => ({
          url,
          title: "",
          reason: "official source",
        })),
        lastError: "",
      });

      return {
        id: String(doc?._id || ""),
        status: "needs_review",
        jobTitle: baselineJob.jobtitle || baselineJob.title || "",
        changedFields: [],
        mailed: false,
      };
    }

    const patchedJob = preparePatchedJob(baselineJob, safePatch);
    const sources = generationResult.sourceUrls.map((url) => ({
      url,
      title: "",
      reason: "official source used for full generation",
    }));

    const mailResult = await sendJobUpdateNotification({
      jobTitle: baselineJob.jobtitle || baselineJob.title || "",
      jobUrl: buildNotificationUrl(baselineJob),
      matchedBy: "gemini-ai-full-generation",
      changedFields: Object.keys(safePatch),
      changes: Object.keys(safePatch).map((field) => ({
        path: field,
        beforePreview: "(empty)",
        afterPreview: formatPreview(safePatch[field]),
      })).slice(0, MAX_EMAIL_CHANGES),
      omittedChangeCount: Math.max(0, Object.keys(safePatch).length - MAX_EMAIL_CHANGES),
    });

    doc.set(patchedJob);
    doc.aiMonitoring = {
      ...patchedJob.aiMonitoring,
      lastCheckedAt: now,
      lastDetectionStatus: "change_detected",
      lastSummary: "Full content generated from official sources via Gemini.",
      lastConfidence: "high",
      lastSources: sources,
      lastPatchedAt: now,
      lastMailSentAt: mailResult?.sent ? now : patchedJob.aiMonitoring.lastMailSentAt || null,
      lastMailStatus: mailResult?.sent ? "sent" : String(mailResult?.reason || "skipped"),
      lastError: "",
    };
    await doc.save();

    return {
      id: String(doc?._id || ""),
      status: "updated",
      jobTitle: baselineJob.jobtitle || baselineJob.title || "",
      changedFields: Object.keys(safePatch),
      mailed: Boolean(mailResult?.sent),
    };
  }

  // ─── BRANCH: Existing doc → Standard Monitoring ───────────────────────
  const audit = await runGeminiAudit(baselineJob);
  const aiResult = audit.parsed;
  const sources =
    aiResult.sources.length > 0
      ? aiResult.sources
      : audit.sourceUrls.map((url) => ({
          url,
          title: "",
          reason: "provided official source",
        }));

  if (
    aiResult.status !== "change_detected" ||
    aiResult.confidence === "low" ||
    Object.keys(aiResult.patch || {}).length === 0
  ) {
    const nextStatus =
      aiResult.status === "change_detected" && aiResult.confidence === "low"
        ? "needs_review"
        : aiResult.status;

    await saveMonitoringMetadata(doc, baselineMonitoring, {
      lastCheckedAt: now,
      lastDetectionStatus: nextStatus,
      lastSummary:
        aiResult.summary ||
        (nextStatus === "needs_review"
          ? "Gemini found a possible update but confidence was too low for auto-patch."
          : "No authoritative update detected."),
      lastConfidence: aiResult.confidence,
      lastSources: sources,
      lastError: "",
    });

    return {
      id: String(doc?._id || ""),
      status: nextStatus,
      jobTitle: baselineJob.jobtitle || baselineJob.title || "",
      changedFields: aiResult.changedFields,
      mailed: false,
    };
  }

  const safePatch = sanitizeAiPatch(baselineJob, aiResult.patch);
  if (Object.keys(safePatch).length === 0) {
    await saveMonitoringMetadata(doc, baselineMonitoring, {
      lastCheckedAt: now,
      lastDetectionStatus: "needs_review",
      lastSummary: "Gemini suggested a patch outside allowed tracked fields.",
      lastConfidence: aiResult.confidence,
      lastSources: sources,
      lastError: "",
    });

    return {
      id: String(doc?._id || ""),
      status: "needs_review",
      jobTitle: baselineJob.jobtitle || baselineJob.title || "",
      changedFields: aiResult.changedFields,
      mailed: false,
    };
  }

  const patchedJob = preparePatchedJob(baselineJob, safePatch);
  const changes = diffSnapshots(
    baselineMonitoring.trackedSnapshot,
    patchedJob.aiMonitoring.trackedSnapshot
  );

  if (changes.length === 0) {
    await saveMonitoringMetadata(doc, baselineMonitoring, {
      lastCheckedAt: now,
      lastDetectionStatus: "no_change",
      lastSummary:
        aiResult.summary ||
        "Gemini returned a patch candidate but it did not change tracked values.",
      lastConfidence: aiResult.confidence,
      lastSources: sources,
      lastError: "",
    });

    return {
      id: String(doc?._id || ""),
      status: "no_change",
      jobTitle: baselineJob.jobtitle || baselineJob.title || "",
      changedFields: [],
      mailed: false,
    };
  }

  const changedFields = toUniqueArray(
    changes
      .map((change) => getTopLevelFieldFromPath(change.path))
      .filter(Boolean)
  );
  const mailChanges = changes.slice(0, MAX_EMAIL_CHANGES);
  const omittedChangeCount = Math.max(0, changes.length - mailChanges.length);
  const mailResult = await sendJobUpdateNotification({
    jobTitle: baselineJob.jobtitle || baselineJob.title || "",
    jobUrl: buildNotificationUrl(baselineJob),
    matchedBy: "gemini-ai-monitor",
    changedFields,
    changes: mailChanges,
    omittedChangeCount,
  });

  doc.set(patchedJob);
  doc.aiMonitoring = {
    ...patchedJob.aiMonitoring,
    lastCheckedAt: now,
    lastDetectionStatus: "change_detected",
    lastSummary: aiResult.summary || "Job post updated from Gemini audit.",
    lastConfidence: aiResult.confidence,
    lastSources: sources,
    lastPatchedAt: now,
    lastMailSentAt: mailResult?.sent ? now : patchedJob.aiMonitoring.lastMailSentAt || null,
    lastMailStatus: mailResult?.sent ? "sent" : String(mailResult?.reason || "skipped"),
    lastError: "",
  };
  await doc.save();

  return {
    id: String(doc?._id || ""),
    status: "updated",
    jobTitle: baselineJob.jobtitle || baselineJob.title || "",
    changedFields,
    mailed: Boolean(mailResult?.sent),
  };
};
📊 Flow Summary
text
monitorSingleJobWithAi()
        │
        ├── Already checked today? → SKIP
        │
        ├── isNewEmptyDocument()? (70%+ fields null)
        │       │
        │       └── YES → generateFullJobContent()
        │                   → buildFullGenerationPrompt()
        │                   → Gemini generates RICH content
        │                   → sanitize → patch → save ✅
        │
        └── NO (existing doc with content)
                └── runGeminiAudit() [existing monitoring flow]
                    → detect changes → patch if needed ✅
⚙️ ENV Variable (Optional)
.env mein add karo to control generation threshold:

text
JOB_AI_EMPTY_THRESHOLD=0.7   # 70% null fields = empty doc
Ek important note: sanitizeAiPatch() mein CONTENT_FIELDS wale keys allowed nahi hain kyunki woh trackedFieldPaths mein nahi hain. buildAllowedPatchKeys() update karo:

javascript
const GENERATION_ALLOWED_FIELDS = new Set([
  "status", "conductingAuthority", "advertisementNumber",
  "introduction", "important_dates", "vacancy_details",
  "application_fee", "age_limit", "eligibility_criteria",
  "selection_process", "how_to_apply", "exam_pattern",
  "official_links", "faq", "meta", "tags",
  "conclusion", "disclaimer", "applyLastDate",
]);

const buildAllowedPatchKeys = (job = {}, isGeneration = false) => {
  const tracked = new Set([
    ...(job?.aiMonitoring?.trackedFieldPaths || resolveTrackedFieldPaths(job)),
    "applyLastDate",
  ]);
  if (isGeneration) {
    for (const key of GENERATION_ALLOWED_FIELDS) tracked.add(key);
  }
  return tracked;
};
Aur generateFullJobContent() mein sanitizeAiPatch call update karo:

javascript
const safePatch = sanitizeAiPatch(baselineJob, generationResult.patch, true); // isGeneration=true
Aur sanitizeAiPatch signature update:

javascript
const sanitizeAiPatch = (job = {}, patch = {}, isGeneration = false) => {
  // ...
  const allowed = buildAllowedPatchKeys(job, isGeneration);
  // rest same...
};