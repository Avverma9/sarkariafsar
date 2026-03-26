function formatDisplayDate(value) {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const blockedDomains = [
  'sarkariresult.com.cm',
  'www.sarkariresult.com.cm',
  'sarkariresult.com',
  'www.sarkariresult.com',
];

function isBlockedCompetitorLink(href = '') {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    return blockedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

const css = `
  .osb-wrap {
    margin: 1.25rem 0 2rem;
    border: 1px solid #dbe7f3;
    border-radius: 18px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    overflow: hidden;
  }
  .osb-top {
    padding: 1.1rem 1.2rem 0.9rem;
    border-bottom: 1px solid #e8eef5;
    background: #f5f9ff;
  }
  .osb-kicker {
    display: inline-block;
    margin-bottom: 0.55rem;
    padding: 0.28rem 0.62rem;
    border-radius: 999px;
    background: #dbeafe;
    color: #1d4ed8;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .osb-title {
    margin: 0 0 0.45rem;
    font-size: 1rem;
    font-weight: 800;
    color: #0f172a;
  }
  .osb-text {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.65;
    color: #475569;
  }
  .osb-body {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 1rem;
    padding: 1rem 1.2rem 1.2rem;
  }
  .osb-links,
  .osb-facts {
    border: 1px solid #e7edf4;
    border-radius: 14px;
    background: #fff;
    padding: 1rem;
  }
  .osb-subtitle {
    margin: 0 0 0.75rem;
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #334155;
  }
  .osb-link-list {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }
  .osb-link {
    display: block;
    text-decoration: none;
    color: #0f172a;
    border: 1px solid #dbe7f5;
    border-radius: 12px;
    padding: 0.8rem 0.9rem;
    transition: border-color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
  }
  .osb-link:hover {
    border-color: #93c5fd;
    box-shadow: 0 10px 20px rgba(148, 163, 184, 0.12);
    transform: translateY(-1px);
  }
  .osb-link-label {
    display: block;
    font-size: 0.88rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 0.18rem;
  }
  .osb-link-url {
    display: block;
    font-size: 0.78rem;
    line-height: 1.5;
    color: #2563eb;
    word-break: break-word;
  }
  .osb-empty {
    margin: 0;
    font-size: 0.84rem;
    line-height: 1.65;
    color: #64748b;
  }
  .osb-fact-list {
    margin: 0;
  }
  .osb-fact-row {
    display: grid;
    grid-template-columns: 104px 1fr;
    gap: 0.75rem;
    padding: 0.56rem 0;
    border-bottom: 1px solid #eef2f7;
  }
  .osb-fact-row:first-child {
    padding-top: 0;
  }
  .osb-fact-row:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
  .osb-fact-row dt {
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .osb-fact-row dd {
    margin: 0;
    font-size: 0.86rem;
    line-height: 1.55;
    font-weight: 600;
    color: #0f172a;
  }
  @media (max-width: 760px) {
    .osb-body {
      grid-template-columns: 1fr;
      padding: 1rem;
    }
    .osb-top {
      padding: 1rem 1rem 0.85rem;
    }
    .osb-fact-row {
      grid-template-columns: 1fr;
      gap: 0.18rem;
    }
  }
`;

export default function OfficialSourceBox({
  title = 'Official Source Check',
  description,
  links = [],
  facts = [],
  mode = 'general',
}) {
  const normalizedLinks = links.filter((link) => link?.href && link?.label && !isBlockedCompetitorLink(link.href));
  const normalizedFacts = facts
    .map((fact) => ({ ...fact, value: fact?.formatAsDate ? formatDisplayDate(fact.value) : fact?.value }))
    .filter((fact) => fact?.label && fact?.value && fact.value !== 'Not specified');

  const fallbackDescription =
    mode === 'blog'
      ? 'This article is an editorial explainer by SarkariAfsar. If a government circular or department page exists, verify policy-sensitive claims there before relying on this summary.'
      : 'Use the linked official portal or notice before applying. Scheme eligibility, timelines, and document rules can change without notice.';

  return (
    <section className="osb-wrap" aria-label="Official source verification box">
      <style>{css}</style>

      <div className="osb-top">
        <span className="osb-kicker">Source Verification</span>
        <h2 className="osb-title">{title}</h2>
        <p className="osb-text">{description || fallbackDescription}</p>
      </div>

      <div className="osb-body">
        <div className="osb-links">
          <h3 className="osb-subtitle">Primary Links</h3>

          {normalizedLinks.length > 0 ? (
            <div className="osb-link-list">
              {normalizedLinks.map((link) => (
                <a
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="osb-link"
                >
                  <span className="osb-link-label">{link.label}</span>
                  <span className="osb-link-url">{link.href}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="osb-empty">
              No external official URL is attached to this record. Treat this page as editorial guidance and confirm sensitive details on the relevant department or scheme portal.
            </p>
          )}
        </div>

        <div className="osb-facts">
          <h3 className="osb-subtitle">Verification Notes</h3>
          <dl className="osb-fact-list">
            {normalizedFacts.map((fact) => (
              <div key={`${fact.label}-${fact.value}`} className="osb-fact-row">
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}