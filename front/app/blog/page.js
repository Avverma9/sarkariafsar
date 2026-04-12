import Link from 'next/link'
import AdsenseUnit from '@/components/ads/AdsenseUnitClient'

import { SERVER_API_BASE } from '@/lib/server-api'
const API_BASE = SERVER_API_BASE
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'
const LIMIT    = 12

export const metadata = {
  title: 'Sarkari Afsar Blog — Government Jobs Tips & Guides 2026',
  description: 'Read expert tips, guides and updates on government jobs, exam preparation, results and schemes at Sarkari Afsar Blog.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'Sarkari Afsar Blog — Government Jobs Tips & Guides 2026',
    description: 'Expert tips, guides and updates on government jobs, exam preparation, results and schemes.',
    url: `${SITE_URL}/blog`,
    siteName: 'Sarkari Afsar',
    images: [{ url: `${SITE_URL}/api/og?title=Sarkari+Afsar+Blog&type=blog`, width: 1200, height: 630, alt: 'Sarkari Afsar Blog — Government Jobs Tips & Guides' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Sarkari Afsar Blog — Government Jobs Tips & Guides 2026', description: 'Expert tips, guides and updates on government jobs, exam preparation, results and schemes.', site: '@sarkariafsar' },
}

// ─── Data ─────────────────────────────────────────────────────────────────────
async function fetchBlogs(page, search) {
  try {
    let url = `${API_BASE}/blog/?page=${page}&limit=${LIMIT}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    const res  = await fetch(url, { next: { revalidate: 1800 } })
    const data = await res.json()
    return {
      blogs: data?.data || [],
      total: data?.total || data?.pagination?.total || 0,
    }
  } catch { return { blogs: [], total: 0 } }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CAT_COLORS = {
  SSC:       { bg: '#fff3e0', color: '#e65100' },
  UPSC:      { bg: '#fce4ec', color: '#c62828' },
  Banking:   { bg: '#e8f5e9', color: '#2e7d32' },
  Railway:   { bg: '#e3f2fd', color: '#1565c0' },
  Defence:   { bg: '#ede7f6', color: '#4527a0' },
  Admission: { bg: '#f3e5f5', color: '#6a1b9a' },
}
function catStyle(cat = '') {
  return CAT_COLORS[cat] ?? { bg: '#f5f3f0', color: '#666' }
}

const GRADIENTS = [
  'linear-gradient(135deg,#1a1a1a,#2d2d2d)',
  'linear-gradient(135deg,#e65100,#ff8f00)',
  'linear-gradient(135deg,#1a237e,#283593)',
  'linear-gradient(135deg,#1b5e20,#388e3c)',
  'linear-gradient(135deg,#4a148c,#6a1b9a)',
  'linear-gradient(135deg,#880e4f,#c2185b)',
]

// ─── Blog row ─────────────────────────────────────────────────────────────────
function BlogRow({ blog, index }) {
  const cs    = catStyle(blog.category)
  const grad  = GRADIENTS[index % GRADIENTS.length]
  const title = blog.title || blog.slug?.replace(/-/g, ' ')
  const date  = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null

  return (
    <article className="bp-row">
      <span className="bp-index">{String(index + 1).padStart(2, '0')}</span>

      <div className="bp-content">
        <div className="bp-meta">
          {blog.category && (
            <span className="bp-cat" style={{ background: cs.bg, color: cs.color }}>
              {blog.category}
            </span>
          )}
          {blog.readingTime && <span className="bp-rt">⏱ {blog.readingTime}</span>}
        </div>

        <h2 className="bp-title">
          <Link href={`/blog/${blog.slug}`} className="bp-link">{title}</Link>
        </h2>

        {(blog.excerpt || blog.intro) && (
          <p className="bp-excerpt">{blog.excerpt || blog.intro?.slice(0, 160)}</p>
        )}

        <div className="bp-foot">
          <div className="bp-author">
            <span className="bp-avatar">{(blog.author || 'S')[0].toUpperCase()}</span>
            <span className="bp-author-name">{blog.author || 'Sarkari Afsar'}</span>
          </div>
          {date && <span className="bp-date">{date}</span>}
        </div>
      </div>

      <Link
        href={`/blog/${blog.slug}`}
        className="bp-thumb"
        style={{ background: grad }}
        tabIndex={-1}
        aria-hidden="true"
      >
        {blog.thumbnail || blog.image
          ? <img src={blog.thumbnail || blog.image} alt={title} className="bp-thumb-img" />
          : <span className="bp-thumb-label">{blog.category || 'Blog'}</span>
        }
      </Link>
    </article>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, search }) {
  const base  = `/blog?${search ? `search=${encodeURIComponent(search)}&` : ''}`
  const start = Math.max(1, page - 2)
  const end   = Math.min(totalPages, start + 4)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <nav className="bp-pager" aria-label="Pagination">
      {page > 1
        ? <Link href={`${base}page=${page - 1}`} className="bp-pg-btn">← Prev</Link>
        : <span className="bp-pg-btn bp-pg-off">← Prev</span>}

      {start > 1 && <span className="bp-pg-dots">…</span>}

      {pages.map(p => (
        <Link key={p} href={`${base}page=${p}`}
          className={`bp-pg-btn${p === page ? ' bp-pg-active' : ''}`}>{p}</Link>
      ))}

      {end < totalPages && <span className="bp-pg-dots">…</span>}

      {page < totalPages
        ? <Link href={`${base}page=${page + 1}`} className="bp-pg-btn">Next →</Link>
        : <span className="bp-pg-btn bp-pg-off">Next →</span>}
    </nav>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function BlogPage({ searchParams }) {
  const params     = await searchParams
  const page       = Math.max(1, parseInt(params?.page || '1', 10))
  const search     = params?.search || ''
  const { blogs, total } = await fetchBlogs(page, search)
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <>
      <style>{CSS}</style>

      <div className="bp-page">

        {/* Hero */}
        <section className="bp-hero">
          <div className="bp-hero-grid" aria-hidden="true"/>
          <div className="bp-hero-glow"  aria-hidden="true"/>
          <div className="bp-hero-inner">
            <nav className="bp-bc" aria-label="Breadcrumb">
              <Link href="/" className="bp-bc-a">Home</Link>
              <span className="bp-bc-sep">›</span>
              <span>Blog &amp; Guides</span>
            </nav>
            <span className="bp-hero-eye">✦ Knowledge Hub</span>
            <h1 className="bp-hero-h1">Sarkari Afsar Blog</h1>
            <p className="bp-hero-sub">
              Expert tips, guides aur updates — government jobs, exam prep, results aur schemes ke liye.
            </p>
            <div className="bp-hero-pills">
              <Link href="/jobpost" className="bp-pill">💼 Jobs &amp; Updates</Link>
              <Link href="/schemes" className="bp-pill">🏛️ Govt Schemes</Link>
            </div>
          </div>
        </section>

        {/* Main */}
        <main className="bp-main">
          <div className="bp-wrap">

            {/* Title row */}
            <div className="bp-topbar">
              <div>
                <span className="bp-eye">✦ Editorial</span>
                <h2 className="bp-h2">
                  {search ? `Results for "${search}"` : 'All Articles'}
                </h2>
              </div>
              {total > 0 && <span className="bp-count">{total} articles</span>}
            </div>

            {/* Search */}
            <form method="GET" action="/blog" className="bp-sf">
              <div className="bp-si-wrap">
                <svg className="bp-si-icon" width="15" height="15" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text" name="search" defaultValue={search}
                  placeholder="Search blog posts…"
                  className="bp-si" aria-label="Search blog posts"
                />
              </div>
              <button type="submit" className="bp-sb">
                Search
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {search && (
                <Link href="/blog" className="bp-sc">✕ Clear</Link>
              )}
            </form>

            {/* List */}
            {blogs.length === 0 ? (
              <div className="bp-empty">
                <span>📭</span>
                <p>Koi blog post nahi mila{search ? ` "${search}" ke liye` : ''}.</p>
                {search && <Link href="/blog" className="bp-empty-btn">Sab dekhein</Link>}
              </div>
            ) : (
              <div className="bp-list">
                {blogs.map((blog, i) => (
                  <div key={blog._id || blog.slug}>
                    <BlogRow blog={blog} index={i} />
                    {i === 5 && (
                      <div className="bp-ad">
                        <AdsenseUnit placement="listing-infeed" className="w-full"/>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} search={search}/>
            )}
          </div>
        </main>
      </div>
    </>
  )
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `

  .bp-page { min-height:100vh; background:#f7f5f0; font-family:'Roboto',sans-serif; }

  /* Hero */
  .bp-hero { background:#1a1a1a; padding:52px 24px 58px; position:relative; overflow:hidden; }
  .bp-hero-grid {
    position:absolute; inset:0;
    background-image: linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),
                      linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);
    background-size:48px 48px; pointer-events:none;
  }
  .bp-hero-glow {
    position:absolute; right:-60px; top:-60px; width:360px; height:360px;
    background:radial-gradient(circle,rgba(230,81,0,.18) 0%,transparent 65%);
    pointer-events:none;
  }
  .bp-hero-inner { max-width:660px; margin:0 auto; position:relative; z-index:2; }

  .bp-bc { display:flex; align-items:center; gap:6px; font-size:.72rem; margin-bottom:16px; color:#777; }
  .bp-bc-a { color:#777; text-decoration:none; transition:color .16s; }
  .bp-bc-a:hover { color:#fff; }
  .bp-bc-sep { color:#555; font-size:.65rem; }

  .bp-hero-eye {
    display:block; font-size:.68rem; font-weight:700;
    letter-spacing:.14em; text-transform:uppercase; color:#e65100; margin-bottom:10px;
  }
  .bp-hero-h1 {
    font-family:'Roboto',sans-serif; font-size:clamp(1.9rem,4vw,2.9rem);
    font-weight:900; letter-spacing:-.03em; color:#fff; line-height:1.1; margin:0 0 12px;
  }
  .bp-hero-sub { font-size:.9rem; color:#888; line-height:1.7; margin:0 0 24px; }
  .bp-hero-pills { display:flex; gap:10px; flex-wrap:wrap; }
  .bp-pill {
    display:inline-flex; align-items:center; gap:6px; padding:8px 18px;
    background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1);
    color:#ccc; border-radius:999px; font-size:.82rem; font-weight:500; text-decoration:none;
    transition:background .18s,color .18s,border-color .18s;
  }
  .bp-pill:hover { background:rgba(230,81,0,.15); border-color:rgba(230,81,0,.4); color:#ff8c42; }

  /* Main */
  .bp-main { padding:44px 24px 64px; }
  .bp-wrap { max-width:900px; margin:0 auto; }

  /* Top bar */
  .bp-topbar {
    display:flex; align-items:flex-end; justify-content:space-between; gap:16px;
    margin-bottom:20px; padding-bottom:18px; border-bottom:1.5px solid rgba(0,0,0,.08);
  }
  .bp-eye { display:block; font-size:.67rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#e65100; margin-bottom:4px; }
  .bp-h2 { font-family:'Roboto',sans-serif; font-size:clamp(1.2rem,2.5vw,1.5rem); font-weight:900; letter-spacing:-.02em; color:#1a1a1a; margin:0; }
  .bp-count { font-size:.71rem; font-weight:700; background:#fff3e0; color:#e65100; padding:5px 12px; border-radius:999px; white-space:nowrap; flex-shrink:0; }

  /* Search form */
  .bp-sf { display:flex; align-items:center; gap:8px; margin-bottom:28px; flex-wrap:wrap; }
  .bp-si-wrap { position:relative; flex:1; min-width:200px; }
  .bp-si {
    width:100%; padding:10px 14px 10px 36px; background:#fff;
    border:1.5px solid #e8e4df; border-radius:10px;
    font-family:'Roboto',sans-serif; font-size:.86rem; color:#1a1a1a;
    outline:none; box-sizing:border-box;
    transition:border-color .2s,box-shadow .2s;
  }
  .bp-si::placeholder { color:#bbb; }
  .bp-si:focus { border-color:#e65100; box-shadow:0 0 0 3px rgba(230,81,0,.1); }
  .bp-si-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#bbb; pointer-events:none; }
  .bp-si-wrap:focus-within .bp-si-icon { color:#e65100; }
  .bp-sb {
    display:inline-flex; align-items:center; gap:6px; padding:10px 18px;
    background:#1a1a1a; color:#fff; border:none; border-radius:10px; cursor:pointer;
    font-family:'Roboto',sans-serif; font-size:.84rem; font-weight:700; white-space:nowrap;
    transition:background .18s,transform .15s;
  }
  .bp-sb:hover { background:#e65100; transform:translateY(-1px); }
  .bp-sc {
    font-size:.78rem; font-weight:600; color:#aaa; text-decoration:none;
    white-space:nowrap; padding:10px 12px; border-radius:10px;
    transition:color .18s,background .18s;
  }
  .bp-sc:hover { color:#e65100; background:#fff5eb; }

  /* List */
  .bp-list { display:flex; flex-direction:column; }

  /* Row */
  .bp-row {
    display:flex; align-items:flex-start; gap:14px;
    padding:18px 10px; border-bottom:1px solid #f0ede8;
    border-radius:10px; margin:0 -10px;
    transition:background .16s;
  }
  .bp-row:last-child { border-bottom:none; }
  .bp-row:hover { background:#fdf8f5; }

  /* Index */
  .bp-index {
    font-family:'Roboto',sans-serif; font-size:.68rem; font-weight:900;
    color:#e0dbd5; letter-spacing:.04em; flex-shrink:0; width:24px;
    padding-top:4px; transition:color .18s;
  }
  .bp-row:hover .bp-index { color:#e65100; }

  /* Content */
  .bp-content { flex:1; min-width:0; display:flex; flex-direction:column; gap:6px; }
  .bp-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .bp-cat { font-size:.6rem; font-weight:700; letter-spacing:.05em; text-transform:uppercase; padding:3px 9px; border-radius:999px; }
  .bp-rt { font-size:.7rem; color:#bbb; font-weight:500; }

  .bp-title { font-family:'Roboto',sans-serif; font-size:.95rem; font-weight:700; letter-spacing:-.01em; color:#1a1a1a; line-height:1.35; margin:0; }
  .bp-link {
    color:inherit; text-decoration:none;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
    transition:color .16s;
  }
  .bp-link:hover { color:#e65100; }

  .bp-excerpt {
    font-family:'Roboto Slab',Georgia,serif; font-size:.79rem; color:#999;
    line-height:1.65; margin:0;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
  }

  .bp-foot { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-top:2px; }
  .bp-author { display:flex; align-items:center; gap:7px; }
  .bp-avatar {
    width:20px; height:20px; background:#1a1a1a; color:#fff; border-radius:5px;
    display:flex; align-items:center; justify-content:center;
    font-family:'Roboto',sans-serif; font-size:.58rem; font-weight:900;
  }
  .bp-author-name { font-size:.72rem; font-weight:500; color:#888; }
  .bp-date { font-size:.7rem; color:#ccc; }

  /* Thumb */
  .bp-thumb {
    flex-shrink:0; width:90px; height:74px; border-radius:10px; overflow:hidden;
    display:flex; align-items:center; justify-content:center; text-decoration:none;
  }
  .bp-thumb-img { width:100%; height:100%; object-fit:cover; transition:transform .35s ease; }
  .bp-row:hover .bp-thumb-img { transform:scale(1.06); }
  .bp-thumb-label {
    font-family:'Roboto',sans-serif; font-size:.54rem; font-weight:900;
    letter-spacing:.1em; text-transform:uppercase;
    color:rgba(255,255,255,.4); text-align:center; padding:4px;
  }

  /* Ad */
  .bp-ad { margin:4px 0 2px; padding:0 10px; }

  /* Empty */
  .bp-empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:60px 24px; color:#bbb; font-size:.88rem; text-align:center; }
  .bp-empty span { font-size:2.4rem; }
  .bp-empty p { margin:0; }
  .bp-empty-btn {
    margin-top:8px; padding:8px 20px; background:#1a1a1a; color:#fff;
    border-radius:8px; text-decoration:none;
    font-family:'Roboto',sans-serif; font-size:.82rem; font-weight:700;
    display:inline-block; transition:background .18s;
  }
  .bp-empty-btn:hover { background:#e65100; }

  /* Pagination */
  .bp-pager { display:flex; justify-content:center; align-items:center; gap:6px; margin-top:44px; flex-wrap:wrap; }
  .bp-pg-btn {
    display:inline-flex; align-items:center; justify-content:center;
    min-width:38px; height:38px; padding:0 10px;
    background:#fff; border:1.5px solid #e8e4df; border-radius:9px;
    font-family:'Roboto',sans-serif; font-size:.82rem; font-weight:700;
    color:#555; text-decoration:none;
    transition:background .16s,border-color .16s,color .16s,transform .14s;
  }
  .bp-pg-btn:not(.bp-pg-off):not(.bp-pg-active):hover { border-color:#e65100; color:#e65100; background:#fff5eb; transform:translateY(-1px); }
  .bp-pg-active { background:#1a1a1a!important; color:#fff!important; border-color:#1a1a1a!important; }
  .bp-pg-off { opacity:.35; cursor:not-allowed; }
  .bp-pg-dots { font-size:.82rem; color:#bbb; padding:0 4px; line-height:38px; }

  /* Responsive */
  @media (max-width:540px) {
    .bp-index, .bp-excerpt { display:none; }
    .bp-thumb { width:72px; height:60px; }
    .bp-hero  { padding:36px 16px 40px; }
    .bp-main  { padding:28px 14px 48px; }
  }
`