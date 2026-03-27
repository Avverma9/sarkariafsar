'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { humanContent } from './HumanContent';
import EditorialSummary from './EditorialSummary';
import OfficialSourceBox from './OfficialSourceBox';

const CACHE_TTL_MS = 30 * 60 * 1000;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '';
const cacheKey = (slug) => `sarkari_post_${slug}`;

function buildShareUrl(slug, explicitUrl) {
  if (explicitUrl) return explicitUrl;
  if (!slug) return SITE_URL;
  return SITE_URL ? `${SITE_URL}/post/${slug}` : `/post/${slug}`;
}

function readCache(slug) {
  try {
    const raw = sessionStorage.getItem(cacheKey(slug));
    if (!raw) return null;
    const { post, html, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) { sessionStorage.removeItem(cacheKey(slug)); return null; }
    return { post, html };
  } catch { return null; }
}

function writeCache(slug, post, html) {
  try {
    const lean = { ...post };
    if (lean.scrapedContent) lean.scrapedContent = {};
    if (lean.contentHtml) lean.contentHtml = '';
    sessionStorage.setItem(cacheKey(slug), JSON.stringify({ post: lean, html, ts: Date.now() }));
  } catch {}
}

function stripTags(value = '') {
  return String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeEntities(value = '') {
  return String(value)
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function normalizeTrustLabel(label = '', anchorText = '', duplicateCount = 1) {
  const cleanedLabel = decodeEntities(stripTags(label));
  const cleanedAnchor = decodeEntities(stripTags(anchorText));
  const genericAnchor = /^(click here|link|open)$/i.test(cleanedAnchor);

  if (/apply online/i.test(cleanedLabel)) return duplicateCount > 1 && !genericAnchor ? `Apply Online (${cleanedAnchor})` : 'Apply Online';
  if (/official notification/i.test(cleanedLabel)) return duplicateCount > 1 && !genericAnchor ? `Official Notification (${cleanedAnchor})` : 'Official Notification';
  if (/official website/i.test(cleanedLabel)) return 'Official Website';
  if (/registration/i.test(cleanedLabel)) return 'Registration';
  if (/login/i.test(cleanedLabel)) return 'Login';
  if (cleanedLabel) return duplicateCount > 1 && !genericAnchor ? `${cleanedLabel} (${cleanedAnchor})` : cleanedLabel;
  if (cleanedAnchor && !genericAnchor) return cleanedAnchor;
  return 'Open Link';
}

function extractPostTrustLinks(html = '', post = {}) {
  const links = [];
  const seen = new Set();

  const pushLink = (label, href) => {
    if (!href || !label) return;
    const key = `${label}|${href}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ label, href });
  };

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(html))) {
    const row = rowMatch[1];
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => match[1]);
    if (cells.length < 2) continue;

    const firstCell = cells[0];
    const secondCell = cells[1];
    const anchors = [...secondCell.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
    if (!anchors.length) continue;

    anchors.forEach((anchor) => {
      const href = decodeEntities(anchor[1]).trim();
      const anchorText = anchor[2];
      const label = normalizeTrustLabel(firstCell, anchorText, anchors.length);
      pushLink(label, href);
    });
  }

  pushLink('Source Article', post?.sourceUrl);
  pushLink('Source Section', post?.scrapedMeta?.sourceSectionUrl);

  const preferredOrder = [
    'Apply Online',
    'Registration',
    'Login',
    'Official Notification',
    'Official Website',
    'Source Article',
    'Source Section',
  ];

  return links
    .sort((left, right) => {
      const leftIndex = preferredOrder.findIndex((item) => left.label.startsWith(item));
      const rightIndex = preferredOrder.findIndex((item) => right.label.startsWith(item));
      const normalizedLeft = leftIndex === -1 ? preferredOrder.length : leftIndex;
      const normalizedRight = rightIndex === -1 ? preferredOrder.length : rightIndex;
      return normalizedLeft - normalizedRight || left.label.localeCompare(right.label);
    })
    .slice(0, 6);
}

export default function PostContent({ slug, initialPost, initialHtml, shareUrl: initialShareUrl }) {
  const [post, setPost]           = useState(initialPost ?? null);
  const [html, setHtml]           = useState(initialHtml ?? '');
  const [tipContents, setTipContents] = useState([]);

  useEffect(() => {
    const shuffled = [...humanContent].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(5, shuffled.length));
    setTipContents(picked.map(h => h.content).filter(Boolean));
  }, []);

  useEffect(() => {
    if (!slug) return;
    if (initialPost) {
      writeCache(slug, initialPost, initialHtml ?? '');
    } else {
      const cached = readCache(slug);
      if (cached) { setPost(cached.post); setHtml(cached.html); }
    }
  }, [slug, initialPost, initialHtml]);

  if (!post) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>Post not found.</p>
        <Link href="/" style={{ color: '#e65100', fontSize: '0.875rem' }}>← Back to Home</Link>
      </div>
    );
  }

  const title       = post?.title || post?.heading || 'SarkariAfsar Update';
  const authorName  = post?.author || post?.source || 'SarkariAfsar Editorial';
  const published   = post?.publishedAt || post?.createdAt || post?.updatedAt || post?.lastModified || null;
  const section     = post?.sectionName || post?.category || null;
  const lastUpdated = post?.updatedAt || post?.lastModified || null;
  const trustLinks  = extractPostTrustLinks(html, post);
  const shareUrl    = buildShareUrl(slug, initialShareUrl);

  const shareLinks = [
    { label: 'WhatsApp',  bg: '#25d366', href: `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`.trim())}` },
    { label: 'Telegram',  bg: '#0088cc', href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}` },
    { label: 'X',         bg: '#000',    href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}` },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="pc-wrap">

        {/* Article header */}
        <header className="pc-header">
          {section && <span className="pc-badge">{section}</span>}
          <h1 className="pc-title">{title}</h1>

          {/* Meta row */}
          <div className="pc-meta">
            <span className="pc-meta-item">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              {authorName}
            </span>
            {published && (
              <span className="pc-meta-item">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <time dateTime={published}>
                  {new Date(published).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </time>
              </span>
            )}
            {lastUpdated && (
              <span className="pc-meta-item">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                Updated {new Date(lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          {/* Action + Share bar */}
          <div className="pc-action-bar">
            <div className="pc-share-group">
              <span className="pc-share-label">Share:</span>
              {shareLinks.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="pc-share-btn" style={{ background: s.bg }}>
                  {s.label}
                </a>
              ))}
            </div>
            <Link href="/post" className="pc-back-link">← All Jobs</Link>
          </div>
        </header>

        <EditorialSummary
          title={title}
          sectionLabel={section || 'Government update'}
          authorName={authorName}
          published={published}
          lastUpdated={lastUpdated}
          rawText={html}
          mode="post"
        />

        <OfficialSourceBox
          title="Official Job Source"
          description="Use these links to verify the application window, official notification PDF, and department website before you apply. Recruitment deadlines, fee rules, and eligibility can change or be corrected by the authority."
          links={trustLinks}
          facts={[
            { label: 'Category', value: section || 'Government update' },
            { label: 'Source Site', value: post?.scrapedMeta?.sourceSiteName || authorName },
            { label: 'Published', value: published, formatAsDate: true },
            { label: 'Updated', value: lastUpdated, formatAsDate: true },
          ]}
          mode="post"
        />

        {/* Article body */}
        <article
          className="pc-body"
          itemScope
          itemType="https://schema.org/Article"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Tips section — 5 random cards */}
        {tipContents.length > 0 && (
          <div className="pc-tips">
            <h2 className="pc-tips-title">💡 Related Tips &amp; Resources</h2>
            {tipContents.map((tc, i) => (
              <div key={i} className="pc-tips-body" dangerouslySetInnerHTML={{ __html: tc }} />
            ))}
          </div>
        )}

        {/* Bottom share strip */}
        <div className="pc-bottom-bar">
          <span className="pc-share-label">Found this useful? Share:</span>
          <div className="pc-share-group">
            {shareLinks.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className="pc-share-btn" style={{ background: s.bg }}>
                {s.label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

const css = `
  .pc-wrap {
    max-width: 1080px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
  }
  @media (max-width: 640px) {
    .pc-wrap { padding: 1.25rem 1rem 3rem; }
  }

  /* Header */
  .pc-header {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #f0ede8;
  }
  .pc-badge {
    display: inline-block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: #fff3e0;
    color: #e65100;
    padding: 3px 10px;
    border-radius: 999px;
    margin-bottom: 0.75rem;
  }
  .pc-title {
    font-size: clamp(1.35rem, 3.5vw, 2rem);
    font-weight: 800;
    color: #111;
    line-height: 1.35;
    letter-spacing: -0.02em;
    margin: 0 0 1rem;
  }

  /* Meta */
  .pc-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.25rem;
    color: #6b7280;
    font-size: 0.8rem;
    margin-bottom: 1.25rem;
  }
  .pc-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  /* Action bar */
  .pc-action-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #faf9f7;
    border: 1px solid #f0ede8;
    border-radius: 10px;
  }
  .pc-share-group {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .pc-share-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .pc-share-btn {
    display: inline-block;
    color: #fff;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 999px;
    text-decoration: none;
    transition: opacity 0.16s, transform 0.14s;
  }
  .pc-share-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .pc-back-link {
    font-size: 0.75rem;
    font-weight: 600;
    color: #000000;
    text-decoration: none;
    white-space: nowrap;
    transition: letter-spacing 0.16s;
  }
  .pc-back-link:hover { letter-spacing: 0.02em; }

  /* Body */
  .pc-body {
    font-size: 0.95rem;
    line-height: 1.75;
    color: #374151;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  /* ---- Section headings as banners ---- */
  .pc-body h1, .pc-body h2, .pc-body h3, .pc-body h4 {
    color: #1a1a1a;
    font-weight: 800;
    line-height: 1.35;
    margin: 1.5rem 0 0;
  }
  .pc-body h2 {
    font-size: 0.95rem;
    background: linear-gradient(135deg, #e65100, #ff6d00);
    color: #fff;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    letter-spacing: 0.01em;
  }
  .pc-body h3 {
    font-size: 0.88rem;
    background: #fff3e0;
    color: #bf360c;
    padding: 0.45rem 0.9rem;
    border-left: 4px solid #e65100;
    border-radius: 0 8px 8px 0;
  }
  .pc-body h4 {
    font-size: 0.85rem;
    color: #333;
    padding-bottom: 0.35rem;
    border-bottom: 2px solid #fde8d8;
  }

  /* ---- Paragraphs — key:value row style ---- */
  .pc-body p {
    margin: 0;
    padding: 0.45rem 0.9rem;
    border-bottom: 1px solid #f0ede8;
    display: block;
    width: 100%;
    box-sizing: border-box;
    font-size: 0.88rem;
    line-height: 1.65;
  }
  .pc-body h2 + p,
  .pc-body h3 + p {
    border-top: none;
  }
  .pc-body p:last-child { border-bottom: none; }

  /* bold labels in paragraphs */
  .pc-body p strong, .pc-body p b {
    color: #111;
    font-weight: 700;
  }

  /* ---- Links ---- */
  .pc-body a { color: #0369a1; text-decoration: underline; text-underline-offset: 2px; }
  .pc-body a:hover { color: #15803d; }

  /* ---- Lists — structured rows ---- */
  .pc-body ul, .pc-body ol {
    padding-left: 0;
    margin: 0;
    list-style: none;
    background: #fafaf8;
    border: 1px solid #f0ede8;
    border-radius: 10px;
    overflow: hidden;
  }
  .pc-body li {
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #f0ede8;
    font-size: 0.88rem;
    line-height: 1.6;
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }
  .pc-body li::before {
    content: '▸';
    color: #e65100;
    font-weight: 700;
    flex-shrink: 0;
  }
  .pc-body li:last-child { border-bottom: none; }

  /* nested lists */
  .pc-body li ul, .pc-body li ol {
    margin: 0.35rem 0 0;
    border: none;
    background: transparent;
    border-radius: 0;
    flex-basis: 100%;
  }
  .pc-body li li {
    padding: 0.3rem 0.75rem;
    border-bottom: 1px dashed #eee;
  }
  .pc-body li li::before { content: '–'; color: #999; }

  /* ---- Tables — proper column widths ---- */
  .pc-body table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.82rem;
    margin: 0.75rem 0;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
    display: table;
    table-layout: auto;
  }
  @media (max-width: 640px) {
    .pc-body table {
      display: block;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
  }
  .pc-body thead tr {
    background: linear-gradient(135deg, #e65100, #ff6d00);
  }
  .pc-body th {
    padding: 0.65rem 0.9rem;
    color: #fff;
    font-weight: 700;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border: none;
    text-align: left;
    white-space: nowrap;
    min-width: 100px;
  }
  .pc-body td {
    padding: 0.55rem 0.9rem;
    border-bottom: 1px solid #f0ede8;
    text-align: left;
    color: #374151;
    vertical-align: top;
    min-width: 80px;
    word-wrap: break-word;
  }
  .pc-body tbody tr:nth-child(even) { background: #fafaf8; }
  .pc-body tbody tr:hover { background: #fff3e0; }
  .pc-body tbody tr:last-child td { border-bottom: none; }

  /* table without thead — treat first row as header */
  .pc-body table:not(:has(thead)) tr:first-child {
    background: linear-gradient(135deg, #e65100, #ff6d00);
  }
  .pc-body table:not(:has(thead)) tr:first-child td {
    color: #fff;
    font-weight: 700;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: none;
    white-space: nowrap;
    min-width: 100px;
  }

  /* ---- Images ---- */
  .pc-body img {
    max-width: 100%;
    height: auto;
    border-radius: 10px;
    margin: 1em 0;
    border: 1px solid #f0ede8;
  }

  /* ---- Blockquote ---- */
  .pc-body blockquote {
    margin: 1em 0;
    padding: 0.75em 1.1em;
    border-left: 4px solid #e65100;
    background: #fff8f5;
    color: #555;
    border-radius: 0 10px 10px 0;
    font-style: italic;
    font-size: 0.88rem;
  }

  /* Tips — numbered list layout */
  .pc-tips {
    margin-top: 2.5rem;
    padding: 1.25rem 1.5rem;
    background: #fdf8f4;
    border: 1px solid #fde8d8;
    border-radius: 14px;
    counter-reset: tip-counter;
  }
  .pc-tips-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 1rem;
  }

  /* flatten grid → vertical list */
  .pc-tips .hc-grid,
  .pc-tips .hc-grid-alt {
    display: block;
  }
  .pc-tips .hc-card,
  .pc-tips .hc-card-alt {
    display: block;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    margin: 0;
    counter-increment: tip-counter;
  }

  /* h3 → numbered section heading */
  .pc-tips .hc-card h3,
  .pc-tips .hc-card-alt h3 {
    font-size: 0.88rem;
    font-weight: 700;
    color: #bf360c;
    margin: 0;
    padding: 0.6rem 0.75rem;
    background: #fff3e0;
    border-left: 4px solid #e65100;
    border-radius: 0 6px 6px 0;
  }
  .pc-tips .hc-card h3::before,
  .pc-tips .hc-card-alt h3::before {
    content: counter(tip-counter) '. ';
    font-weight: 800;
    color: #e65100;
  }

  /* ul inside cards → numbered sub-points */
  .pc-tips .hc-card ul,
  .pc-tips .hc-card-alt ul {
    padding: 0;
    margin: 0;
    list-style: none;
    counter-reset: sub-point;
  }
  .pc-tips .hc-card li,
  .pc-tips .hc-card-alt li {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    font-size: 0.82rem;
    line-height: 1.6;
    color: #374151;
    padding: 0.4rem 0.75rem 0.4rem 1.5rem;
    border-bottom: 1px solid #f0ede8;
    margin: 0;
    counter-increment: sub-point;
    border-radius: 0;
    background: transparent;
  }
  .pc-tips .hc-card li::before,
  .pc-tips .hc-card-alt li::before {
    content: counter(tip-counter) '.' counter(sub-point);
    font-size: 0.72rem;
    font-weight: 700;
    color: #e65100;
    min-width: 22px;
    flex-shrink: 0;
    display: inline;
  }
  .pc-tips .hc-card li:last-child,
  .pc-tips .hc-card-alt li:last-child {
    border-bottom: none;
  }

  /* paragraphs inside cards */
  .pc-tips .hc-card p,
  .pc-tips .hc-card-alt p {
    font-size: 0.82rem;
    line-height: 1.6;
    color: #374151;
    margin: 0;
    padding: 0.4rem 0.75rem 0.4rem 1.5rem;
    border-bottom: 1px solid #f0ede8;
    border: none;
  }

  /* spacing between tip blocks */
  .pc-tips-body {
    margin-bottom: 0.5rem;
  }
  .pc-tips-body:last-child { margin-bottom: 0; }

  /* Bottom bar */
  .pc-bottom-bar {
    margin-top: 2rem;
    padding: 1rem;
    border-top: 1px solid #f0ede8;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
`;
