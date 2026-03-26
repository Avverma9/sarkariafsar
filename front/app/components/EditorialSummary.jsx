function normalizeText(raw = '') {
  return raw
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6]|\/ul|\/ol)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

function formatDisplayDate(value) {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function uniqueItems(items, limit = 4) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))].slice(0, limit);
}

function cleanHighlightValue(value = '') {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[-:|]+\s*/, '')
    .replace(/\s*[|]+\s*/g, ' | ')
    .trim();
}

function extractLines(text) {
  return normalizeText(text)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 18);
}

function extractSentences(text) {
  return normalizeText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 40);
}

function extractKeywordHighlights(text, pattern, limit = 4) {
  const lines = extractLines(text);
  const matches = lines.filter((line) => pattern.test(line));
  return uniqueItems(matches, limit);
}

function extractRegexHighlights(text, patterns, limit = 4) {
  const normalized = normalizeText(text);
  const matches = [];

  patterns.forEach((pattern) => {
    const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    for (const match of normalized.matchAll(regex)) {
      const value = cleanHighlightValue(match[1] || match[0] || '');
      if (value) matches.push(value);
      if (matches.length >= limit * 2) break;
    }
  });

  return uniqueItems(matches, limit);
}

function pickHighlights(primary, fallback, limit = 4) {
  if (primary.length >= limit) return primary.slice(0, limit);
  return uniqueItems([...primary, ...fallback], limit);
}

function inferIntent(title = '', mode = 'post') {
  const normalized = title.toLowerCase();
  if (mode === 'blog') {
    return {
      action: 'read the full article and note the practical takeaways',
      verify: 'examples, linked references, and the final guidance section',
    };
  }
  if (mode === 'scheme') {
    return {
      action: 'review the scheme rules before applying',
      verify: 'start date, last date, required documents, and the official apply link',
    };
  }
  if (normalized.includes('admit')) {
    return {
      action: 'download the admit card',
      verify: 'exam date, reporting time, exam city, and ID proof instructions',
    };
  }
  if (normalized.includes('answer key')) {
    return {
      action: 'check the answer key and compare responses',
      verify: 'objection dates, question paper set, and the final answer-key notice',
    };
  }
  if (normalized.includes('result')) {
    return {
      action: 'check the result status',
      verify: 'roll number, merit list details, cut-off, and next-stage instructions',
    };
  }
  if (normalized.includes('job') || normalized.includes('recruitment') || normalized.includes('vacancy')) {
    return {
      action: 'review the recruitment notice before applying',
      verify: 'eligibility, application fee, important dates, and the official application link',
    };
  }
  return {
    action: 'review the official update carefully',
    verify: 'important dates, eligibility rules, required documents, and the official source link',
  };
}

function buildSummary(text, title) {
  const sentences = extractSentences(text);
  return (
    sentences.find((sentence) => /(important|official|apply|scheme|exam|result|admit|eligibility|date|notification)/i.test(sentence)) ||
    sentences[0] ||
    `${title} is summarized below with an editorial overview so readers can quickly understand the main update before reviewing the full details.`
  );
}

function buildKeyPoints(text, intent, title) {
  const lines = extractKeywordHighlights(
    text,
    /(important|official|apply|exam|result|admit|scheme|selection|document|eligibility|vacancy|benefit|deadline|process|notice|start date|last date|application fee|age limit)/i,
    3
  );
  if (lines.length) return lines;
  return [
    `${title} is presented here with an editorial summary for quick review.`,
    `Use this page to ${intent.action}.`,
    `Before taking action, verify ${intent.verify}.`,
  ];
}

function buildChecklist(intent, sectionLabel, lastUpdated) {
  return [
    `Read the full ${sectionLabel.toLowerCase()} details before you ${intent.action}.`,
    `Cross-check ${intent.verify} on the official source or notice PDF.`,
    lastUpdated
      ? `Prefer the latest available update dated ${formatDisplayDate(lastUpdated)} when multiple versions are circulating.`
      : 'Use the newest available official source before making any submission or download decision.',
  ];
}

function buildFaqs(intent, sectionLabel, mode) {
  const firstLabel = mode === 'blog' ? 'article' : sectionLabel.toLowerCase();
  return [
    {
      question: `What should readers check first in this ${firstLabel}?`,
      answer: `Start with the main update summary and then verify ${intent.verify}.`,
    },
    {
      question: 'Why is there an editorial summary above the detailed content?',
      answer: 'The summary gives readers a faster, original explanation of the update before they read the longer details or source-derived content.',
    },
    {
      question: 'Should this page be treated as the final authority?',
      answer: 'No. Use this page as a guided editorial summary and rely on the official source for the final decision.',
    },
  ];
}

const css = `
  .es-wrap {
    margin: 0 0 2rem;
    padding: 1.4rem;
    border: 1px solid #e7edf3;
    border-radius: 18px;
    background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  }
  .es-head {
    margin-bottom: 1rem;
  }
  .es-kicker {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #0f766e;
    background: #dff7f2;
    border-radius: 999px;
    padding: 0.32rem 0.7rem;
    margin-bottom: 0.75rem;
  }
  .es-title {
    margin: 0 0 0.55rem;
    font-size: 1.08rem;
    font-weight: 800;
    color: #111827;
  }
  .es-summary {
    margin: 0;
    font-size: 0.92rem;
    line-height: 1.7;
    color: #475569;
  }
  .es-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  .es-card {
    border: 1px solid #e6edf5;
    border-radius: 14px;
    background: #fff;
    padding: 1rem;
  }
  .es-card-title {
    margin: 0 0 0.8rem;
    font-size: 0.88rem;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .es-list,
  .es-checklist {
    margin: 0;
    padding-left: 1.15rem;
    color: #334155;
  }
  .es-list li,
  .es-checklist li {
    margin-bottom: 0.7rem;
    font-size: 0.87rem;
    line-height: 1.65;
  }
  .es-list li:last-child,
  .es-checklist li:last-child {
    margin-bottom: 0;
  }
  .es-facts {
    margin: 0;
  }
  .es-fact-row {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 0.75rem;
    padding: 0.58rem 0;
    border-bottom: 1px solid #eef2f7;
  }
  .es-fact-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .es-fact-row:first-child {
    padding-top: 0;
  }
  .es-fact-row dt {
    font-size: 0.76rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .es-fact-row dd {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 600;
    color: #0f172a;
  }
  .es-highlights {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  .es-highlight-card {
    border-radius: 14px;
    padding: 1rem;
    border: 1px solid #e6edf5;
    background: #fff;
  }
  .es-highlight-card.dates {
    background: #fff7ed;
    border-color: #fed7aa;
  }
  .es-highlight-card.fee {
    background: #effcf4;
    border-color: #bbf7d0;
  }
  .es-highlight-card.eligibility {
    background: #eff6ff;
    border-color: #bfdbfe;
  }
  .es-highlight-card ul {
    margin: 0;
    padding-left: 1rem;
  }
  .es-highlight-card li {
    margin-bottom: 0.55rem;
    font-size: 0.84rem;
    line-height: 1.55;
    color: #334155;
  }
  .es-highlight-card li:last-child {
    margin-bottom: 0;
  }
  .es-faqs {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  .es-faq-item {
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #eef2f7;
  }
  .es-faq-item:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
  .es-faq-question {
    margin: 0 0 0.35rem;
    font-size: 0.86rem;
    font-weight: 700;
    color: #0f172a;
  }
  .es-faq-answer {
    margin: 0;
    font-size: 0.84rem;
    line-height: 1.65;
    color: #475569;
  }
  @media (max-width: 900px) {
    .es-highlights {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 760px) {
    .es-wrap {
      padding: 1rem;
    }
    .es-grid {
      grid-template-columns: 1fr;
    }
    .es-fact-row {
      grid-template-columns: 1fr;
      gap: 0.2rem;
    }
  }
`;

export default function EditorialSummary({
  title,
  sectionLabel = 'Update',
  authorName = 'SarkariAfsar Editorial',
  published,
  lastUpdated,
  rawText = '',
  facts = [],
  dateHighlights = [],
  feeHighlights = [],
  eligibilityHighlights = [],
  mode = 'post',
}) {
  const text = normalizeText(rawText);
  const intent = inferIntent(title, mode);
  const summary = buildSummary(text, title);
  const keyPoints = buildKeyPoints(text, intent, title);
  const checklist = buildChecklist(intent, sectionLabel, lastUpdated);
  const faqs = buildFaqs(intent, sectionLabel, mode);

  const mergedFacts = [
    { label: 'Category', value: sectionLabel },
    { label: 'Published', value: formatDisplayDate(published) },
    ...(lastUpdated ? [{ label: 'Updated', value: formatDisplayDate(lastUpdated) }] : []),
    { label: 'Editorial Desk', value: authorName },
    ...facts,
  ].filter((fact) => fact?.value && fact.value !== 'Not specified');

  const exactDateMatches = extractRegexHighlights(text, [
    /(Online Apply Start Date\s*:\s*[^\n]+)/i,
    /(Online Apply Last Date\s*:\s*[^\n]+)/i,
    /(Last Date For Fee Payment\s*:\s*[^\n]+)/i,
    /(Exam Date\s*:\s*[^\n]+)/i,
    /(Admit Card\s*:\s*[^\n]+)/i,
    /(Result Date\s*:\s*[^\n]+)/i,
    /(Start Date\s*:\s*[^\n]+)/i,
    /(Last Date\s*:\s*[^\n]+)/i,
    /(Age Limit As On\s*[^\n]+)/i,
    /(Deadline\s*:\s*[^\n]+)/i,
  ]);

  const exactFeeMatches = extractRegexHighlights(text, [
    /(General(?:\s*,\s*OBC)?(?:\s*,\s*EWS)?\s*:\s*₹\s*[\d,./-]+)/i,
    /(OBC(?:\s*,\s*EWS)?\s*:\s*₹\s*[\d,./-]+)/i,
    /(SC\s*\/\s*ST\s*:\s*₹\s*[\d,./-]+)/i,
    /(PH Candidates\s*:\s*₹\s*[\d,./-]+)/i,
    /(All Female Category\s*:\s*₹\s*[\d,./-]+)/i,
    /(Application Fee\s*:?\s*[^\n]+)/i,
    /(Payment Mode\s*\(?(?:Online)?\)?\s*:\s*[^\n]+)/i,
  ]);

  const exactEligibilityMatches = extractRegexHighlights(text, [
    /(Eligibility Criteria\s*:?\s*[^\n]+)/i,
    /(Minimum Age\s*:\s*[^\n]+)/i,
    /(Maximum Age\s*:\s*[^\n]+)/i,
    /(Age Relaxation[^\n]+)/i,
    /(Must have[^\n]+(?:\.[^\n]+)?)/i,
    /(Candidates must[^\n]+(?:\.[^\n]+)?)/i,
    /(Candidates who have appeared[^\n]+(?:\.[^\n]+)?)/i,
    /(requiredDocs\s*:\s*[^\n]+)/i,
  ]);

  const smartDates = pickHighlights(exactDateMatches, uniqueItems([
    ...dateHighlights,
    ...extractKeywordHighlights(text, /(date|start date|last date|exam date|result date|admit card|published|updated|deadline|important date|schedule)/i, 4),
  ]));
  const smartFees = pickHighlights(exactFeeMatches, uniqueItems([
    ...feeHighlights,
    ...extractKeywordHighlights(text, /(application fee|fee|general\s*,\s*obc|general|obc|sc\s*\/\s*st|ph candidates|female category|payment mode|rs\.?|inr|₹)/i, 4),
  ]));
  const smartEligibility = pickHighlights(exactEligibilityMatches, uniqueItems([
    ...eligibilityHighlights,
    ...extractKeywordHighlights(text, /(eligibility|qualification|age limit|required documents|required|graduation|degree|diploma|10th|12th|mbbs|candidate|applicant|experience|domicile|age relaxation|minimum age|maximum age)/i, 4),
  ]));

  return (
    <section className="es-wrap" aria-labelledby="es-title">
      <style>{css}</style>

      <div className="es-head">
        <span className="es-kicker">Original Editorial Section</span>
        <h2 id="es-title" className="es-title">Quick Summary and Verification Guide</h2>
        <p className="es-summary">{summary}</p>
      </div>

      <div className="es-grid">
        <div className="es-card">
          <h3 className="es-card-title">Key Takeaways</h3>
          <ul className="es-list">
            {keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>

        <div className="es-card">
          <h3 className="es-card-title">Snapshot</h3>
          <dl className="es-facts">
            {mergedFacts.map((fact) => (
              <div key={`${fact.label}-${fact.value}`} className="es-fact-row">
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {(smartDates.length > 0 || smartFees.length > 0 || smartEligibility.length > 0) && (
        <div className="es-highlights">
          {smartDates.length > 0 && (
            <div className="es-highlight-card dates">
              <h3 className="es-card-title">Date Highlights</h3>
              <ul>
                {smartDates.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {smartFees.length > 0 && (
            <div className="es-highlight-card fee">
              <h3 className="es-card-title">Fee Highlights</h3>
              <ul>
                {smartFees.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {smartEligibility.length > 0 && (
            <div className="es-highlight-card eligibility">
              <h3 className="es-card-title">Eligibility Highlights</h3>
              <ul>
                {smartEligibility.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="es-grid">
        <div className="es-card">
          <h3 className="es-card-title">What To Verify On Official Source</h3>
          <ol className="es-checklist">
            {checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>

        <div className="es-card">
          <h3 className="es-card-title">Reader FAQ</h3>
          <div className="es-faqs">
            {faqs.map((faq) => (
              <div key={faq.question} className="es-faq-item">
                <p className="es-faq-question">{faq.question}</p>
                <p className="es-faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}