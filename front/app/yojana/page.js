import Link from 'next/link'
import AdsenseUnit from '@/components/ads/AdsenseUnitClient'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'
const LIMIT    = 15

export const metadata = {
  title: 'Government Yojana & Schemes 2026 — Sarkari Afsar',
  description: 'Find all central and state government welfare schemes, yojana and benefits for citizens of India at Sarkari Afsar.',
  alternates: { canonical: `${SITE_URL}/yojana` },
  openGraph: {
    title: 'Government Yojana & Schemes 2026 — Sarkari Afsar',
    description: 'Find all central and state government welfare schemes, yojana and benefits for citizens of India.',
    url: `${SITE_URL}/yojana`,
    siteName: 'Sarkari Afsar',
    images: [{ url: `${SITE_URL}/api/og?title=Government+Yojana+%26+Schemes+2026&type=scheme`, width: 1200, height: 630, alt: 'Government Yojana & Schemes 2026 — Sarkari Afsar' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Government Yojana & Schemes 2026 — Sarkari Afsar', description: 'Find all central and state government welfare schemes, yojana and benefits for citizens of India.', site: '@sarkariafsar' },
}

const QUICK_STATES = [
  'All States', 'Bihar', 'Uttar Pradesh', 'Gujarat', 'Jharkhand',
  'Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Delhi', 'Punjab',
  'Tamil Nadu', 'West Bengal', 'Karnataka',
]

// ─── Data ─────────────────────────────────────────────────────────────────────
async function fetchSchemes(page, search, state) {
  try {
    let url = `${API_BASE}/schemes/?page=${page}&limit=${LIMIT}`
    if (state)  url += `&state=${encodeURIComponent(state)}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    const res  = await fetch(url, { next: { revalidate: 1800 } })
    const data = await res.json()
    return {
      schemes: data?.data || [],
      total:   data?.total || data?.pagination?.total || 0,
    }
  } catch { return { schemes: [], total: 0 } }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  Central:    { bg: '#fff3e0', color: '#e65100' },
  State:      { bg: '#e8f5e9', color: '#2e7d32' },
  Health:     { bg: '#fce4ec', color: '#c62828' },
  Education:  { bg: '#e3f2fd', color: '#1565c0' },
  Housing:    { bg: '#ede7f6', color: '#4527a0' },
  Employment: { bg: '#fff8e1', color: '#f57f17' },
}
function typeStyle(t = '') {
  for (const key of Object.keys(TYPE_COLORS)) {
    if (t.toLowerCase().includes(key.toLowerCase())) return TYPE_COLORS[key]
  }
  return { bg: '#f5f3f0', color: '#666' }
}

function schemeIcon(type = '') {
  const t = type.toLowerCase()
  if (t.includes('health'))                         return '🏥'
  if (t.includes('education'))                      return '🎓'
  if (t.includes('agriculture') || t.includes('kisan')) return '🌾'
  if (t.includes('housing') || t.includes('awas')) return '🏠'
  if (t.includes('employment') || t.includes('rozgar')) return '💼'
  if (t.includes('women') || t.includes('mahila')) return '👩'
  if (t.includes('finance') || t.includes('loan')) return '💰'
  if (t.includes('pension'))                        return '🧓'
  return '📋'
}

function stateLabel(raw = '') {
  return raw.split('(')[0].trim().replace('All States', 'Pan-India') || 'All India'
}

// ─── Scheme row ───────────────────────────────────────────────────────────────
function SchemeRow({ scheme, index }) {
  const ts = typeStyle(scheme.schemetype)
  return (
    <article className="yp-row">
      <span className="yp-index">{String(index + 1).padStart(2, '0')}</span>

      {/* Icon */}
      <div className="yp-icon">{schemeIcon(scheme.schemetype)}</div>

      {/* Content */}
      <div className="yp-content">
        <div className="yp-meta">
          {scheme.schemetype && (
            <span className="yp-type" style={{ background: ts.bg, color: ts.color }}>
              {scheme.schemetype}
            </span>
          )}
          <span className="yp-state-chip">
            🗺️ {stateLabel(scheme.state)}
          </span>
        </div>

        <h2 className="yp-title">
          <Link href={`/yojana/${scheme.slug}`} className="yp-link">
            {scheme.schemeTitle}
          </Link>
        </h2>

        {scheme.aboutScheme && (
          <p className="yp-desc">{scheme.aboutScheme.slice(0, 180)}</p>
        )}
      </div>

      {/* CTA */}
      <div className="yp-cta">
        {scheme.applyLink ? (
          <a href={scheme.applyLink} target="_blank" rel="noopener noreferrer" className="yp-apply">
            Apply
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        ) : (
          <Link href={`/yojana/${scheme.slug}`} className="yp-view">
            Dekhein
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        )}
      </div>
    </article>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, search, state }) {
  const base  = `/yojana?${state ? `state=${encodeURIComponent(state)}&` : ''}${search ? `search=${encodeURIComponent(search)}&` : ''}`
  const start = Math.max(1, page - 2)
  const end   = Math.min(totalPages, start + 4)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  return (
    <nav className="yp-pager" aria-label="Pagination">
      {page > 1
        ? <Link href={`${base}page=${page - 1}`} className="yp-pg">← Prev</Link>
        : <span className="yp-pg yp-pg-off">← Prev</span>}
      {start > 1 && <span className="yp-pg-dots">…</span>}
      {pages.map(p => (
        <Link key={p} href={`${base}page=${p}`}
          className={`yp-pg${p === page ? ' yp-pg-active' : ''}`}>{p}</Link>
      ))}
      {end < totalPages && <span className="yp-pg-dots">…</span>}
      {page < totalPages
        ? <Link href={`${base}page=${page + 1}`} className="yp-pg">Next →</Link>
        : <span className="yp-pg yp-pg-off">Next →</span>}
    </nav>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function YojanaPage({ searchParams }) {
  const params     = await searchParams
  const page       = Math.max(1, parseInt(params?.page || '1', 10))
  const search     = params?.search || ''
  const state      = params?.state  || ''
  const { schemes, total } = await fetchSchemes(page, search, state)
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <>
      <style>{CSS}</style>

      <div className="yp-page">

        {/* ── Hero ── */}
        <section className="yp-hero">
          <div className="yp-hero-grid" aria-hidden="true"/>
          <div className="yp-hero-glow" aria-hidden="true"/>
          <div className="yp-hero-inner">
            <nav className="yp-bc" aria-label="Breadcrumb">
              <Link href="/" className="yp-bc-a">Home</Link>
              <span className="yp-bc-sep">›</span>
              <span>Yojana &amp; Schemes</span>
            </nav>
            <span className="yp-hero-eye">🏛️ Welfare &amp; Benefits</span>
            <h1 className="yp-hero-h1">Government Yojana &amp; Schemes</h1>
            <p className="yp-hero-sub">
              Central aur state government ki welfare schemes, subsidies aur yojana — ek jagah sab kuch.
            </p>
            <div className="yp-hero-pills">
              <Link href="/jobpost" className="yp-pill">💼 Latest Jobs</Link>
              <Link href="/blog"    className="yp-pill">📖 Blog &amp; Guides</Link>
            </div>
          </div>
        </section>

        {/* ── Main ── */}
        <main className="yp-main">
          <div className="yp-wrap">

            {/* Title row */}
            <div className="yp-topbar">
              <div>
                <span className="yp-eye">📋 Browse</span>
                <h2 className="yp-h2">
                  {search
                    ? `Results for "${search}"`
                    : state
                    ? `${state} Schemes`
                    : 'All Schemes'}
                </h2>
              </div>
              {total > 0 && <span className="yp-count">{total} schemes</span>}
            </div>

            {/* Search + filter */}
            <div className="yp-filter-card">
              <form method="GET" action="/yojana" className="yp-sf">
                <div className="yp-si-wrap">
                  <svg className="yp-si-icon" width="15" height="15" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="text" name="search" defaultValue={search}
                    placeholder="Search schemes, yojana…"
                    className="yp-si" aria-label="Search schemes"
                  />
                  {state && <input type="hidden" name="state" value={state}/>}
                </div>
                <button type="submit" className="yp-sb">
                  Search
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {(search || state) && (
                  <Link href="/yojana" className="yp-clear">✕ Clear</Link>
                )}
              </form>

              {/* State filter pills */}
              <div className="yp-state-pills">
                {QUICK_STATES.map(s => {
                  const val    = s === 'All States' ? '' : s
                  const active = state === val
                  const href   = val
                    ? `/yojana?state=${encodeURIComponent(val)}${search ? `&search=${encodeURIComponent(search)}` : ''}`
                    : `/yojana${search ? `?search=${encodeURIComponent(search)}` : ''}`
                  return (
                    <Link
                      key={s}
                      href={href}
                      className={`yp-state-btn${active ? ' yp-state-active' : ''}`}
                    >
                      {s}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* List */}
            {schemes.length === 0 ? (
              <div className="yp-empty">
                <span>🏛️</span>
                <p>Koi scheme nahi mili
                  {state  ? ` "${state}" ke liye`   : ''}
                  {search ? ` "${search}" ke liye`  : ''}.
                </p>
                <Link href="/yojana" className="yp-empty-btn">Sab dekhein</Link>
              </div>
            ) : (
              <div className="yp-list">
                {schemes.map((scheme, i) => (
                  <div key={scheme._id || scheme.slug}>
                    <SchemeRow scheme={scheme} index={i}/>
                    {i === 5 && (
                      <div className="yp-ad">
                        <AdsenseUnit placement="listing-infeed" className="w-full"/>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} search={search} state={state}/>
            )}
          </div>
        </main>
      </div>
    </>
  )
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&family=Roboto+Slab:wght@400;500&display=swap');

  .yp-page { min-height:100vh; background:#f7f5f0; font-family:'Roboto',sans-serif; }

  /* ── Hero ── */
  .yp-hero { background:#1a1a1a; padding:52px 24px 58px; position:relative; overflow:hidden; }
  .yp-hero-grid {
    position:absolute; inset:0;
    background-image:
      linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),
      linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);
    background-size:48px 48px; pointer-events:none;
  }
  .yp-hero-glow {
    position:absolute; right:-60px; top:-60px; width:360px; height:360px;
    background:radial-gradient(circle,rgba(230,81,0,.18) 0%,transparent 65%);
    pointer-events:none;
  }
  .yp-hero-inner { max-width:660px; margin:0 auto; position:relative; z-index:2; }

  .yp-bc { display:flex; align-items:center; gap:6px; font-size:.72rem; margin-bottom:16px; color:#777; }
  .yp-bc-a { color:#777; text-decoration:none; transition:color .16s; }
  .yp-bc-a:hover { color:#fff; }
  .yp-bc-sep { color:#555; font-size:.65rem; }

  .yp-hero-eye { display:block; font-size:.68rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#e65100; margin-bottom:10px; }
  .yp-hero-h1 { font-family:'Roboto',sans-serif; font-size:clamp(1.8rem,4vw,2.8rem); font-weight:900; letter-spacing:-.03em; color:#fff; line-height:1.1; margin:0 0 12px; }
  .yp-hero-sub { font-size:.9rem; color:#888; line-height:1.7; margin:0 0 24px; }
  .yp-hero-pills { display:flex; gap:10px; flex-wrap:wrap; }
  .yp-pill {
    display:inline-flex; align-items:center; gap:6px; padding:8px 18px;
    background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1);
    color:#ccc; border-radius:999px; font-size:.82rem; font-weight:500; text-decoration:none;
    transition:background .18s,color .18s,border-color .18s;
  }
  .yp-pill:hover { background:rgba(230,81,0,.15); border-color:rgba(230,81,0,.4); color:#ff8c42; }

  /* ── Main ── */
  .yp-main { padding:44px 24px 64px; }
  .yp-wrap { max-width:900px; margin:0 auto; }

  /* Top bar */
  .yp-topbar { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:20px; padding-bottom:18px; border-bottom:1.5px solid rgba(0,0,0,.08); }
  .yp-eye { display:block; font-size:.67rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#e65100; margin-bottom:4px; }
  .yp-h2 { font-family:'Roboto',sans-serif; font-size:clamp(1.2rem,2.5vw,1.5rem); font-weight:900; letter-spacing:-.02em; color:#1a1a1a; margin:0; }
  .yp-count { font-size:.71rem; font-weight:700; background:#fff3e0; color:#e65100; padding:5px 12px; border-radius:999px; white-space:nowrap; flex-shrink:0; }

  /* Filter card */
  .yp-filter-card { background:#fff; border:1.5px solid rgba(0,0,0,.07); border-radius:12px; padding:16px; margin-bottom:28px; }

  .yp-sf { display:flex; align-items:center; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
  .yp-si-wrap { position:relative; flex:1; min-width:200px; }
  .yp-si {
    width:100%; padding:10px 14px 10px 36px; background:#faf9f7;
    border:1.5px solid #e8e4df; border-radius:10px;
    font-family:'Roboto',sans-serif; font-size:.86rem; color:#1a1a1a;
    outline:none; box-sizing:border-box;
    transition:border-color .2s,box-shadow .2s,background .2s;
  }
  .yp-si::placeholder { color:#bbb; }
  .yp-si:focus { background:#fff; border-color:#e65100; box-shadow:0 0 0 3px rgba(230,81,0,.1); }
  .yp-si-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#bbb; pointer-events:none; transition:color .2s; }
  .yp-si-wrap:focus-within .yp-si-icon { color:#e65100; }

  .yp-sb {
    display:inline-flex; align-items:center; gap:6px; padding:10px 18px;
    background:#1a1a1a; color:#fff; border:none; border-radius:10px; cursor:pointer;
    font-family:'Roboto',sans-serif; font-size:.84rem; font-weight:700; white-space:nowrap;
    transition:background .18s,transform .15s;
  }
  .yp-sb:hover { background:#e65100; transform:translateY(-1px); }

  .yp-clear { font-size:.78rem; font-weight:600; color:#aaa; text-decoration:none; white-space:nowrap; padding:10px 12px; border-radius:10px; transition:color .18s,background .18s; }
  .yp-clear:hover { color:#e65100; background:#fff5eb; }

  /* State pills */
  .yp-state-pills { display:flex; flex-wrap:wrap; gap:6px; padding-top:4px; }
  .yp-state-btn {
    padding:5px 13px; font-family:'Roboto',sans-serif; font-size:.75rem; font-weight:600;
    border-radius:8px; border:1.5px solid #e8e4df; background:#faf9f7; color:#666;
    text-decoration:none; white-space:nowrap; transition:all .16s;
  }
  .yp-state-btn:hover { border-color:#e65100; color:#e65100; background:#fff5eb; }
  .yp-state-active { background:#1a1a1a!important; color:#fff!important; border-color:#1a1a1a!important; }

  /* ── List ── */
  .yp-list { display:flex; flex-direction:column; }

  /* ── Row ── */
  .yp-row {
    display:flex; align-items:flex-start; gap:12px;
    padding:17px 10px; border-bottom:1px solid #f0ede8;
    border-radius:10px; margin:0 -10px;
    transition:background .16s;
  }
  .yp-row:last-child { border-bottom:none; }
  .yp-row:hover { background:#fdf8f5; }

  /* Index */
  .yp-index { font-family:'Roboto',sans-serif; font-size:.68rem; font-weight:900; color:#e0dbd5; letter-spacing:.04em; flex-shrink:0; width:22px; padding-top:4px; transition:color .18s; }
  .yp-row:hover .yp-index { color:#e65100; }

  /* Icon */
  .yp-icon {
    width:40px; height:40px; background:#fff;
    border:1.5px solid #f0ede8; border-radius:10px;
    display:flex; align-items:center; justify-content:center;
    font-size:1.15rem; flex-shrink:0; margin-top:2px;
    box-shadow:0 1px 6px rgba(0,0,0,.05);
    transition:transform .18s,box-shadow .18s;
  }
  .yp-row:hover .yp-icon { transform:scale(1.08) rotate(-4deg); box-shadow:0 4px 14px rgba(0,0,0,.09); }

  /* Content */
  .yp-content { flex:1; min-width:0; display:flex; flex-direction:column; gap:6px; }
  .yp-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .yp-type { font-size:.6rem; font-weight:700; letter-spacing:.05em; text-transform:uppercase; padding:3px 9px; border-radius:999px; }
  .yp-state-chip { font-size:.7rem; font-weight:500; color:#999; background:#f5f3f0; border:1px solid rgba(0,0,0,.07); padding:2px 8px; border-radius:999px; }

  .yp-title { font-family:'Roboto',sans-serif; font-size:.95rem; font-weight:700; letter-spacing:-.01em; color:#1a1a1a; line-height:1.35; margin:0; }
  .yp-link {
    color:inherit; text-decoration:none;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
    transition:color .16s;
  }
  .yp-link:hover { color:#e65100; }

  .yp-desc { font-family:'Roboto Slab',Georgia,serif; font-size:.79rem; color:#999; line-height:1.65; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

  /* CTA */
  .yp-cta { flex-shrink:0; display:flex; align-items:flex-start; padding-top:2px; }
  .yp-apply, .yp-view {
    display:inline-flex; align-items:center; gap:5px;
    font-family:'Roboto',sans-serif; font-size:.73rem; font-weight:700;
    padding:7px 13px; border-radius:8px; text-decoration:none; white-space:nowrap;
    transition:background .18s,transform .15s,box-shadow .18s;
  }
  .yp-apply { background:#1a1a1a; color:#fff; box-shadow:0 2px 8px rgba(0,0,0,.14); }
  .yp-apply:hover { background:#e65100; transform:translateY(-1px); box-shadow:0 4px 14px rgba(230,81,0,.28); }
  .yp-view { background:transparent; color:#aaa; border:1.5px solid #e8e4df; }
  .yp-view:hover { border-color:#e65100; color:#e65100; background:#fff5eb; transform:translateY(-1px); }

  /* Ad */
  .yp-ad { margin:4px 0 2px; padding:0 10px; }

  /* Empty */
  .yp-empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:60px 24px; color:#bbb; font-size:.88rem; text-align:center; }
  .yp-empty span { font-size:2.4rem; }
  .yp-empty p { margin:0; }
  .yp-empty-btn { margin-top:8px; padding:8px 20px; background:#1a1a1a; color:#fff; border-radius:8px; text-decoration:none; font-family:'Roboto',sans-serif; font-size:.82rem; font-weight:700; display:inline-block; transition:background .18s; }
  .yp-empty-btn:hover { background:#e65100; }

  /* Pagination */
  .yp-pager { display:flex; justify-content:center; align-items:center; gap:6px; margin-top:44px; flex-wrap:wrap; }
  .yp-pg {
    display:inline-flex; align-items:center; justify-content:center;
    min-width:38px; height:38px; padding:0 10px;
    background:#fff; border:1.5px solid #e8e4df; border-radius:9px;
    font-family:'Roboto',sans-serif; font-size:.82rem; font-weight:700;
    color:#555; text-decoration:none;
    transition:background .16s,border-color .16s,color .16s,transform .14s;
  }
  .yp-pg:not(.yp-pg-off):not(.yp-pg-active):hover { border-color:#e65100; color:#e65100; background:#fff5eb; transform:translateY(-1px); }
  .yp-pg-active { background:#1a1a1a!important; color:#fff!important; border-color:#1a1a1a!important; }
  .yp-pg-off { opacity:.35; cursor:not-allowed; }
  .yp-pg-dots { font-size:.82rem; color:#bbb; padding:0 4px; line-height:38px; }

  /* Responsive */
  @media (max-width:540px) {
    .yp-index, .yp-desc { display:none; }
    .yp-cta { display:none; }
    .yp-icon { width:36px; height:36px; font-size:1rem; }
    .yp-hero { padding:36px 16px 40px; }
    .yp-main { padding:28px 14px 48px; }
  }
`