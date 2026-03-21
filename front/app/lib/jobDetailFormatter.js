function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstNonEmpty(values = []) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) {
      return text;
    }
  }

  return "";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(amount, currency = "INR") {
  const parsed = Number(amount);

  if (!Number.isFinite(parsed)) {
    return String(amount || "").trim();
  }

  if (String(currency || "").toUpperCase() === "INR") {
    return `Rs ${parsed}`;
  }

  return `${parsed} ${currency}`.trim();
}

function mapDatesSection(section = {}) {
  const rawDates = asArray(section?.dates).map((item) => ({
    label: String(item?.event || item?.label || "").trim(),
    value: String(item?.date || item?.value || "").trim(),
  }));

  const dates = {
    rawDates,
    startDate: "",
    endDate: "",
    feeLastDate: "",
    correctionDate: "",
    exams: [],
    admitCards: [],
    results: [],
    others: [],
  };

  rawDates.forEach((item) => {
    const label = String(item.label || "").toLowerCase();

    if (label.includes("start")) {
      dates.startDate = item.value;
      return;
    }

    if (label.includes("last date") && label.includes("fee")) {
      dates.feeLastDate = item.value;
      return;
    }

    if (label.includes("last date") || label.includes("apply online")) {
      dates.endDate = item.value;
      return;
    }

    if (label.includes("correction")) {
      dates.correctionDate = item.value;
      return;
    }

    if (label.includes("exam")) {
      dates.exams.push({ title: item.label, date: item.value });
      return;
    }

    if (label.includes("admit")) {
      dates.admitCards.push({ title: item.label, date: item.value });
      return;
    }

    if (label.includes("result")) {
      dates.results.push({ title: item.label, date: item.value });
      return;
    }

    dates.others.push({ title: item.label, date: item.value });
  });

  return dates;
}

function mapFeesSection(section = {}) {
  return {
    rawFees: asArray(section?.fees).map((fee) => ({
      label: String(fee?.category || "").trim(),
      value: firstNonEmpty([
        formatCurrency(fee?.amount, fee?.currency),
        fee?.note,
      ]),
    })),
    categories: asArray(section?.fees).map((fee) => ({
      category: String(fee?.category || "").trim(),
      amount: firstNonEmpty([
        formatCurrency(fee?.amount, fee?.currency),
        fee?.note,
      ]),
    })),
    paymentModes: asArray(section?.payment_modes).map((mode) => String(mode || "").trim()).filter(Boolean),
    notes: [section?.intro, section?.human_note].map((item) => String(item || "").trim()).filter(Boolean),
  };
}

function mapAgeSection(section = {}) {
  const batchRows = asArray(section?.batch_wise).map((item) => {
    const batch = String(item?.batch || "").trim();
    const range = String(item?.born_between || "").trim();
    return firstNonEmpty([`${batch}: ${range}`, range]);
  }).filter(Boolean);

  return {
    rawAge: batchRows.map((item) => ({ label: "Birth Date Range", value: item })),
    minimumAge: "Check official range",
    maximumAge: "Check official range",
    ageAsOn: String(section?.calculated_as || "").trim() || "N/A",
    relaxations: [
      ...batchRows,
      section?.relaxation_note,
      section?.human_note,
    ].map((item) => String(item || "").trim()).filter(Boolean),
  };
}

function mapLinksSection(section = {}) {
  const links = asArray(section?.links).map((link) => ({
    label: String(link?.label || "").trim(),
    url: String(link?.url || "").trim(),
    status: String(link?.status || "").trim(),
  })).filter((link) => link.url);

  const grouped = {
    apply: [],
    admitCard: [],
    result: [],
    answerKey: [],
    notification: [],
    official: [],
    others: [],
    allRawLinks: links,
  };

  links.forEach((link) => {
    const label = String(link.label || "").toLowerCase();

    if (label.includes("apply")) {
      grouped.apply.push(link);
      return;
    }

    if (label.includes("admit")) {
      grouped.admitCard.push(link);
      return;
    }

    if (label.includes("result")) {
      grouped.result.push(link);
      return;
    }

    if (label.includes("answer")) {
      grouped.answerKey.push(link);
      return;
    }

    if (label.includes("notification")) {
      grouped.notification.push(link);
      return;
    }

    if (label.includes("official")) {
      grouped.official.push(link);
      return;
    }

    grouped.others.push(link);
  });

  return grouped;
}

function mapTables(job = {}) {
  const vacancyRows = asArray(job?.vacancy_details?.vacancies).map((item) => ({
    "Post Name": String(item?.post_name || "").trim(),
    Eligibility: String(item?.eligibility || "").trim(),
    Note: String(item?.note || "").trim(),
  })).filter((row) => Object.values(row).some(Boolean));

  const eligibilityRows = asArray(job?.eligibility_criteria?.posts).map((item) => ({
    "Post Name": String(item?.post_name || "").trim(),
    Qualification: String(item?.academic_qualification || "").trim(),
    "Subject Requirements": asArray(item?.subject_requirements).join(", "),
    "Marks Requirements": asArray(item?.marks_requirements).join(", "),
  })).filter((row) => Object.values(row).some(Boolean));

  const vacancyTables = vacancyRows.length > 0
    ? [{
        headers: ["Post Name", "Eligibility", "Note"],
        rows: vacancyRows,
      }]
    : [];

  const eligibilityTables = eligibilityRows.length > 0
    ? [{
        headers: [
          "Post Name",
          "Qualification",
          "Subject Requirements",
          "Marks Requirements",
        ],
        rows: eligibilityRows,
      }]
    : [];

  return {
    vacancyTables,
    eligibilityTables,
    selectionTables: [],
    syllabusTables: [],
    faqTables: [],
    socialTables: [],
    otherTables: [],
    allRawTables: [...vacancyTables, ...eligibilityTables],
  };
}

function buildOtherInfo(job = {}) {
  const sections = [];

  const pushSection = (title, items) => {
    const cleanedItems = asArray(items).map((item) => String(item || "").trim()).filter(Boolean);
    if (cleanedItems.length > 0) {
      sections.push({
        section: title,
        items: cleanedItems,
      });
    }
  };

  pushSection(job?.introduction?.heading || "Introduction", [job?.introduction?.content]);
  pushSection(job?.about_ssr_medical?.heading || "About Post", [job?.about_ssr_medical?.content]);
  pushSection(job?.important_dates?.heading || "Important Dates", [
    job?.important_dates?.intro,
    job?.important_dates?.pro_tip,
  ]);
  pushSection(job?.application_fee?.heading || "Application Fee", [
    job?.application_fee?.intro,
    job?.application_fee?.human_note,
  ]);
  pushSection(job?.eligibility_criteria?.heading || "Eligibility Criteria", [
    job?.eligibility_criteria?.important_note,
    ...asArray(job?.eligibility_criteria?.posts).map((item) => item?.human_note),
  ]);
  pushSection(job?.selection_process?.heading || "Selection Process", [
    job?.selection_process?.intro,
    job?.selection_process?.note,
  ]);
  pushSection(job?.preparation_tips?.heading || "Preparation Tips", asArray(job?.preparation_tips?.tips).map((item) =>
    firstNonEmpty([`${item?.tip}: ${item?.detail}`, item?.detail, item?.tip]),
  ));
  pushSection(job?.how_to_apply?.heading || "How To Apply", [
    ...asArray(job?.how_to_apply?.steps).map((item) =>
      firstNonEmpty([item?.action, `Step ${item?.step}`]),
    ),
    job?.how_to_apply?.advice_hindi,
  ]);
  pushSection(job?.faq?.heading || "FAQ", asArray(job?.faq?.questions).map((item) =>
    firstNonEmpty([`${item?.question} - ${item?.answer}`, item?.question, item?.answer]),
  ));
  pushSection("Disclaimer", [job?.disclaimer]);
  pushSection("Conclusion", [
    job?.conclusion?.content,
    job?.conclusion?.cta,
  ]);

  return sections;
}

function buildSelectionSteps(job = {}) {
  return asArray(job?.selection_process?.stages)
    .map((stage) =>
      firstNonEmpty([
        `${stage?.name}: ${stage?.description}`,
        stage?.description,
        stage?.name,
      ]),
    )
    .filter(Boolean);
}

function getTotalVacancies(job = {}) {
  return firstNonEmpty([
    job?.vacancy_details?.total_posts,
    asArray(job?.vacancy_details?.vacancies)[0]?.note,
    "N/A",
  ]);
}

function buildQuickStats(job, datesData, feeData, ageData) {
  return {
    totalVacancies: getTotalVacancies(job),
    startDate: datesData.startDate || "Not specified",
    endDate: datesData.endDate || firstNonEmpty([job?.applyLastDate, "Not specified"]),
    examDate: datesData.exams[0]?.date || "Will be notified",
    admitCardDate: datesData.admitCards[0]?.date || "Before Exam",
    resultDate: datesData.results[0]?.date || "Will be updated",
    generalFee: feeData.categories[0]?.amount || "Check Notice",
    minAge: ageData.minimumAge || "N/A",
    maxAge: ageData.maximumAge || "N/A",
  };
}

function isRichJobDetail(job = {}) {
  return Boolean(
    isObject(job?.important_dates) ||
      isObject(job?.application_fee) ||
      isObject(job?.official_links) ||
      isObject(job?.eligibility_criteria),
  );
}

function renderList(items = []) {
  const safeItems = asArray(items).map((item) => String(item || "").trim()).filter(Boolean);
  if (safeItems.length === 0) {
    return "";
  }

  return `<ul>${safeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderTable(headers = [], rows = []) {
  const safeHeaders = asArray(headers).map((item) => String(item || "").trim()).filter(Boolean);
  const safeRows = asArray(rows);

  if (safeHeaders.length === 0 || safeRows.length === 0) {
    return "";
  }

  return `
    <table>
      <thead>
        <tr>${safeHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${safeRows
          .map((row) => `<tr>${safeHeaders.map((header) => `<td>${escapeHtml(row?.[header] || "-")}</td>`).join("")}</tr>`)
          .join("")}
      </tbody>
    </table>
  `;
}

export function formatRichJobDetail(job = {}) {
  if (!isRichJobDetail(job)) {
    return null;
  }

  const title = firstNonEmpty([job?.title, job?.jobtitle, "Sarkari Update"]);
  const shortInfo = firstNonEmpty([
    job?.introduction?.content,
    job?.meta?.description,
    job?.status,
  ]);
  const datesData = mapDatesSection(job?.important_dates);
  const feeData = mapFeesSection(job?.application_fee);
  const ageData = mapAgeSection(job?.age_limit);
  const linksData = mapLinksSection(job?.official_links);
  const tablesData = mapTables(job);
  const selectionSteps = buildSelectionSteps(job);
  const otherInfo = buildOtherInfo(job);

  return {
    header: {
      title,
      headingMain: title,
      headingAccent: String(job?.advertisementNumber || job?.category || job?.sectionName || "Details").trim(),
      badge: firstNonEmpty([job?.status, job?.category, "Active Recruitment"]),
      shortInfo,
    },
    quickStats: buildQuickStats(job, datesData, feeData, ageData),
    details: {
      dates: datesData,
      fees: feeData,
      ageLimit: ageData,
      selectionSteps,
    },
    tables: tablesData,
    links: linksData,
    otherInfo,
    rawBackupData: job,
  };
}

export function buildFormattedJobHtml(job = {}) {
  if (!isRichJobDetail(job)) {
    return "";
  }

  const sections = [];

  sections.push(`<h1>${escapeHtml(firstNonEmpty([job?.title, job?.jobtitle, "Job Details"]))}</h1>`);

  if (job?.introduction?.heading || job?.introduction?.content) {
    sections.push(`
      <h2>${escapeHtml(firstNonEmpty([job?.introduction?.heading, "Introduction"]))}</h2>
      <p>${escapeHtml(job?.introduction?.content)}</p>
    `);
  }

  if (job?.about_ssr_medical?.heading || job?.about_ssr_medical?.content) {
    sections.push(`
      <h2>${escapeHtml(firstNonEmpty([job?.about_ssr_medical?.heading, "About The Post"]))}</h2>
      <p>${escapeHtml(job?.about_ssr_medical?.content)}</p>
    `);
  }

  const dateRows = asArray(job?.important_dates?.dates).map((item) => ({
    Event: String(item?.event || "").trim(),
    Date: String(item?.date || "").trim(),
  })).filter((row) => row.Event || row.Date);
  if (dateRows.length > 0) {
    sections.push(`
      <h2>${escapeHtml(firstNonEmpty([job?.important_dates?.heading, "Important Dates"]))}</h2>
      <p>${escapeHtml(firstNonEmpty([job?.important_dates?.intro, job?.important_dates?.pro_tip]))}</p>
      ${renderTable(["Event", "Date"], dateRows)}
    `);
  }

  const feeRows = asArray(job?.application_fee?.fees).map((item) => ({
    Category: String(item?.category || "").trim(),
    Fee: formatCurrency(item?.amount, item?.currency),
    Note: String(item?.note || "").trim(),
  })).filter((row) => row.Category || row.Fee || row.Note);
  if (feeRows.length > 0) {
    sections.push(`
      <h2>${escapeHtml(firstNonEmpty([job?.application_fee?.heading, "Application Fee"]))}</h2>
      <p>${escapeHtml(firstNonEmpty([job?.application_fee?.intro, job?.application_fee?.human_note]))}</p>
      ${renderTable(["Category", "Fee", "Note"], feeRows)}
      ${renderList(asArray(job?.application_fee?.payment_modes))}
    `);
  }

  const vacancyRows = asArray(job?.vacancy_details?.vacancies).map((item) => ({
    "Post Name": String(item?.post_name || "").trim(),
    Eligibility: String(item?.eligibility || "").trim(),
    Note: String(item?.note || "").trim(),
  })).filter((row) => row["Post Name"] || row.Eligibility || row.Note);
  if (vacancyRows.length > 0) {
    sections.push(`
      <h2>${escapeHtml(firstNonEmpty([job?.vacancy_details?.heading, "Vacancy Details"]))}</h2>
      <p>${escapeHtml(firstNonEmpty([job?.vacancy_details?.human_note, job?.vacancy_details?.total_posts]))}</p>
      ${renderTable(["Post Name", "Eligibility", "Note"], vacancyRows)}
    `);
  }

  const eligibilityRows = asArray(job?.eligibility_criteria?.posts).map((item) => ({
    "Post Name": String(item?.post_name || "").trim(),
    Qualification: String(item?.academic_qualification || "").trim(),
    "Subject Requirements": asArray(item?.subject_requirements).join(", "),
    "Marks Requirements": asArray(item?.marks_requirements).join(", "),
  })).filter((row) => Object.values(row).some(Boolean));
  if (eligibilityRows.length > 0) {
    sections.push(`
      <h2>${escapeHtml(firstNonEmpty([job?.eligibility_criteria?.heading, "Eligibility Criteria"]))}</h2>
      <p>${escapeHtml(firstNonEmpty([job?.eligibility_criteria?.important_note]))}</p>
      ${renderTable(
        ["Post Name", "Qualification", "Subject Requirements", "Marks Requirements"],
        eligibilityRows,
      )}
    `);
  }

  const ageRows = asArray(job?.age_limit?.batch_wise).map((item) => ({
    Batch: String(item?.batch || "").trim(),
    "Born Between": String(item?.born_between || "").trim(),
    Note: String(item?.note || "").trim(),
  })).filter((row) => row.Batch || row["Born Between"] || row.Note);
  if (ageRows.length > 0) {
    sections.push(`
      <h2>${escapeHtml(firstNonEmpty([job?.age_limit?.heading, "Age Limit"]))}</h2>
      <p>${escapeHtml(firstNonEmpty([job?.age_limit?.human_note, job?.age_limit?.relaxation_note]))}</p>
      ${renderTable(["Batch", "Born Between", "Note"], ageRows)}
    `);
  }

  const selectionSteps = asArray(job?.selection_process?.stages).map((item) =>
    firstNonEmpty([`${item?.name}: ${item?.description}`, item?.description, item?.name]),
  );
  if (selectionSteps.length > 0) {
    sections.push(`
      <h2>${escapeHtml(firstNonEmpty([job?.selection_process?.heading, "Selection Process"]))}</h2>
      <p>${escapeHtml(firstNonEmpty([job?.selection_process?.intro, job?.selection_process?.note]))}</p>
      ${renderList(selectionSteps)}
    `);
  }

  const howToApply = asArray(job?.how_to_apply?.steps).map((item) =>
    firstNonEmpty([item?.action, `Step ${item?.step}`]),
  );
  if (howToApply.length > 0) {
    sections.push(`
      <h2>${escapeHtml(firstNonEmpty([job?.how_to_apply?.heading, "How To Apply"]))}</h2>
      ${renderList(howToApply)}
      <p>${escapeHtml(firstNonEmpty([job?.how_to_apply?.advice_hindi]))}</p>
    `);
  }

  const preparationTips = asArray(job?.preparation_tips?.tips).map((item) =>
    firstNonEmpty([`${item?.tip}: ${item?.detail}`, item?.detail, item?.tip]),
  );
  if (preparationTips.length > 0) {
    sections.push(`
      <h2>${escapeHtml(firstNonEmpty([job?.preparation_tips?.heading, "Preparation Tips"]))}</h2>
      ${renderList(preparationTips)}
    `);
  }

  const faqItems = asArray(job?.faq?.questions).map((item) => ({
    Question: String(item?.question || "").trim(),
    Answer: String(item?.answer || "").trim(),
  })).filter((row) => row.Question || row.Answer);
  if (faqItems.length > 0) {
    sections.push(`
      <h2>${escapeHtml(firstNonEmpty([job?.faq?.heading, "Frequently Asked Questions"]))}</h2>
      ${renderTable(["Question", "Answer"], faqItems)}
    `);
  }

  const linkRows = asArray(job?.official_links?.links).map((item) => ({
    Label: String(item?.label || "").trim(),
    Status: String(item?.status || "").trim(),
    URL: String(item?.url || "").trim(),
  })).filter((row) => row.Label || row.URL);
  if (linkRows.length > 0) {
    sections.push(`
      <h2>${escapeHtml("Official Links")}</h2>
      ${renderTable(["Label", "Status", "URL"], linkRows)}
    `);
  }

  if (job?.conclusion?.content || job?.conclusion?.cta) {
    sections.push(`
      <h2>${escapeHtml("Conclusion")}</h2>
      <p>${escapeHtml(firstNonEmpty([job?.conclusion?.content]))}</p>
      <p><strong>${escapeHtml(firstNonEmpty([job?.conclusion?.cta]))}</strong></p>
    `);
  }

  if (job?.disclaimer) {
    sections.push(`
      <h2>${escapeHtml("Disclaimer")}</h2>
      <p>${escapeHtml(job.disclaimer)}</p>
    `);
  }

  return sections.join("\n");
}
