import Link from 'next/link'
import AdsenseUnit from '@/components/ads/AdsenseUnitClient'
import StateFilterSection from '@/components/jobs/StateFilterSectionClient'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'Sarkari Afsar — Sarkari Naukri & Government Yojana Portal 2026',
  description: 'Latest Sarkari Jobs, Government Schemes, Exam Results, Admit Cards 2026. Find all government job notifications and yojana updates at Sarkari Afsar.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website', url: SITE_URL, siteName: 'Sarkari Afsar',
    title: 'Sarkari Afsar — Sarkari Naukri & Government Yojana Portal 2026',
    description: 'Latest Sarkari Jobs, Government Schemes, Exam Results, Admit Cards 2026.',
    images: [{ url: `${SITE_URL}/api/og?title=Sarkari+Afsar`, width: 1200, height: 630 }],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image', site: '@sarkariafsar',
    title: 'Sarkari Afsar — Sarkari Naukri & Government Yojana Portal',
    description: 'Latest Sarkari Jobs, Government Schemes, Exam Results & Admit Cards 2026.',
    images: [`${SITE_URL}/api/og?title=Sarkari+Afsar`],
  },
}

// ── Data fetchers ──────────────────────────────────────────────────────────
async function getJobsBySection(sectionName, limit = 10) {
  try {
    const res = await fetch(`${API_BASE}/post/?page=1&limit=${limit}&sectionName=${encodeURIComponent(sectionName)}`, { next: { revalidate: 1800 } })
    return (await res.json())?.data || []
  } catch { return [] }
}
async function getLatestSchemes() {
  try {
    const res = await fetch(`${API_BASE}/schemes/?page=1&limit=6`, { next: { revalidate: 3600 } })
    return (await res.json())?.data || []
  } catch { return [] }
}
async function getLatestBlogs() {
  try {
    const res = await fetch(`${API_BASE}/blog/?page=1&limit=3`, { next: { revalidate: 3600 } })
    return (await res.json())?.data || []
  } catch { return [] }
}
async function getSiteStats() {
  try {
    const [p, s, b] = await Promise.all([
      fetch(`${API_BASE}/post/?page=1&limit=1`,    { next: { revalidate: 3600 } }),
      fetch(`${API_BASE}/schemes/?page=1&limit=1`, { next: { revalidate: 3600 } }),
      fetch(`${API_BASE}/blog/?page=1&limit=1`,    { next: { revalidate: 3600 } }),
    ])
    const [pd, sd, bd] = await Promise.all([p.json(), s.json(), b.json()])
    return { totalPosts: pd?.pagination?.total || 0, totalSchemes: sd?.pagination?.total || 0, totalBlog: bd?.pagination?.total || 0 }
  } catch { return { totalPosts: 0, totalSchemes: 0, totalBlog: 0 } }
}

// ── Design tokens (same as other pages) ──────────────────────────────────
const T = {
  navy:   '#0f1f3d',
  gold:   '#c9a84c',
  goldL:  '#f5edd6',
  ink:    '#1c1c1c',
  muted:  '#6b6355',
  faint:  '#9c8f7a',
  rule:   '#e8e3d8',
  bg:     '#faf8f4',
  white:  '#ffffff',
  green:  '#15803d',
  greenL: '#f0fdf4',
}
const serif = "'Lora', Georgia, serif"
const sans  = "'DM Sans', system-ui, sans-serif"

const SECTION_META = {
  'Results':            { icon: '📊', accent: '#15803d', accentL: '#f0fdf4', accentText: '#15803d', route: '/results' },
  'Latest Gov Jobs':    { icon: '💼', accent: '#1d4ed8', accentL: '#eff6ff', accentText: '#1e40af', route: '/latest-jobs' },
  'Recent Admit Cards': { icon: '🪪', accent: '#7c3aed', accentL: '#f5f3ff', accentText: '#6d28d9', route: '/admit-cards' },
  'Admission':          { icon: '🎓', accent: '#c2410c', accentL: '#fff7ed', accentText: '#c2410c', route: '/admission' },
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionBlock({ name, jobs, meta }) {
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.rule}`,
      borderTop: `3px solid ${meta.accent}`,
      borderRadius: 8,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {/* header */}
      <div style={{
        padding: '11px 16px',
        borderBottom: `1px solid ${T.rule}`,
        background: meta.accentL,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: meta.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>
            {meta.icon}
          </div>
          <span style={{ fontFamily: serif, fontSize: 14, fontWeight: 600, color: T.ink }}>
            {name}
          </span>
        </div>
        <Link href={`/jobs?section=${encodeURIComponent(name)}`} style={{
          fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
          color: meta.accent, textDecoration: 'none',
          padding: '3px 10px', borderRadius: 20,
          border: `1px solid ${meta.accent}`,
        }}>
          View All →
        </Link>
      </div>

      {/* table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: T.bg }}>
            <th style={{ padding: '7px 14px', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.faint, textAlign: 'left', borderBottom: `1px solid ${T.rule}` }}>Post Name</th>
            <th style={{ padding: '7px 14px', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.faint, textAlign: 'center', borderBottom: `1px solid ${T.rule}` }} className="hidden sm:table-cell">Last Date</th>
            <th style={{ padding: '7px 14px', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.faint, textAlign: 'center', borderBottom: `1px solid ${T.rule}` }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', fontFamily: sans, fontSize: 12, color: T.faint, fontStyle: 'italic' }}>No posts available</td></tr>
          ) : jobs.map((job, i) => {
            const lastDate = job.applyLastDate
              ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
              : '—'
            return (
              <tr key={job._id || i} style={{ borderBottom: `1px solid ${T.rule}` }}>
                <td style={{ padding: '9px 14px' }}>
                  <Link href={`/jobs/${job.slug}`} style={{
                    fontFamily: sans, fontSize: 12.5, fontWeight: 500,
                    color: meta.accentText, textDecoration: 'none',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    lineHeight: 1.45,
                  }} className="hover:underline">
                    {job.title}
                  </Link>
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'center', fontFamily: sans, fontSize: 11, color: T.faint, whiteSpace: 'nowrap' }} className="hidden sm:table-cell">
                  {lastDate}
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 9px', borderRadius: 20,
                    fontSize: 10, fontWeight: 700, fontFamily: sans,
                    background: job.isActive ? T.greenL : '#fef2f2',
                    color: job.isActive ? T.green : '#b91c1c',
                    border: `1px solid ${job.isActive ? '#bbf7d0' : '#fecaca'}`,
                  }}>
                    {job.isActive ? 'Active' : 'Closed'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SchemeCard({ scheme }) {
  const isNational = scheme.state?.includes('Pan-India') || scheme.state?.includes('All States')
  const stateLabel = isNational ? 'Pan-India' : scheme.state?.split('(')[0]?.trim() || 'All India'
  return (
    <Link href={`/yojana/${scheme.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: T.white,
        border: `1px solid ${T.rule}`,
        borderRadius: 8,
        padding: '14px 16px',
        height: '100%',
        boxSizing: 'border-box',
        transition: 'box-shadow .15s, border-color .15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      className="hover:shadow-md"
      >
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: sans, fontSize: 9.5, fontWeight: 700,
            background: '#eff6ff', color: '#1e40af',
            padding: '2px 8px', borderRadius: 20,
            maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {scheme.schemetype || 'Government Scheme'}
          </span>
          <span style={{
            fontFamily: sans, fontSize: 9.5, fontWeight: 700,
            background: T.goldL, color: '#92400e',
            padding: '2px 8px', borderRadius: 20, flexShrink: 0,
          }}>
            {stateLabel}
          </span>
        </div>
        <h3 style={{
          fontFamily: serif, fontSize: 13, fontWeight: 600,
          color: T.ink, lineHeight: 1.45, margin: '0 0 6px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {scheme.schemeTitle}
        </h3>
        <p style={{
          fontFamily: sans, fontSize: 11.5, color: T.muted, lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          margin: 0,
        }}>
          {scheme.aboutScheme?.slice(0, 100)}
        </p>
      </div>
    </Link>
  )
}

function BlogCard({ blog }) {
  const date = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    : ''
  return (
    <Link href={`/blog/${blog.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: T.white,
        border: `1px solid ${T.rule}`,
        borderRadius: 8,
        padding: '18px 18px',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'box-shadow .15s',
      }}
      className="hover:shadow-md"
      >
        <span style={{
          fontFamily: sans, fontSize: 9.5, fontWeight: 700,
          background: T.goldL, color: '#92400e',
          padding: '2px 9px', borderRadius: 20,
          alignSelf: 'flex-start', marginBottom: 10, letterSpacing: '0.05em',
        }}>
          {blog.category || 'Blog'}
        </span>
        <h3 style={{
          fontFamily: serif, fontSize: 14, fontWeight: 600,
          color: T.ink, lineHeight: 1.45, flex: 1, margin: '0 0 8px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          textTransform: 'capitalize',
        }}>
          {blog.title || blog.slug?.replace(/-/g, ' ')}
        </h3>
        <p style={{
          fontFamily: sans, fontSize: 12, color: T.muted, lineHeight: 1.55, margin: '0 0 12px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {blog.excerpt || blog.intro?.slice(0, 100)}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${T.rule}`, paddingTop: 10 }}>
          <span style={{ fontFamily: sans, fontSize: 11, color: T.faint }}>{blog.author || 'Sarkari Afsar'}</span>
          <span style={{ fontFamily: sans, fontSize: 11, color: T.faint }}>{date}</span>
        </div>
      </div>
    </Link>
  )
}

function SectionHeading({ title, subtitle, href, linkLabel = 'View All →' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
      <div>
        <h2 style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: T.navy, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontFamily: sans, fontSize: 12, color: T.faint, margin: 0 }}>{subtitle}</p>
        )}
      </div>
      {href && (
        <Link href={href} style={{
          fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: T.white, textDecoration: 'none',
          padding: '7px 16px', borderRadius: 5,
          background: T.navy,
          flexShrink: 0,
        }}>
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '40px 0 36px' }}>
      <div style={{ flex: 1, height: 1, background: T.rule }} />
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: T.gold, flexShrink: 0,
      }} />
      <div style={{ flex: 1, height: 1, background: T.rule }} />
    </div>
  )
}

function AdSlot({ placement }) {
  return (
    <div style={{ border: `1px solid ${T.rule}`, borderRadius: 6, background: T.bg, padding: 4, overflow: 'hidden' }}>
      <AdsenseUnit placement={placement} className="w-full" />
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default async function HomePage() {
  const [stats, resultsJobs, govJobs, admitCards, admissionJobs, schemes, blogs] = await Promise.all([
    getSiteStats(),
    getJobsBySection('Results', 10),
    getJobsBySection('Latest Gov Jobs', 10),
    getJobsBySection('Recent Admit Cards', 10),
    getJobsBySection('Admission', 10),
    getLatestSchemes(),
    getLatestBlogs(),
  ])

  const allTopJobs = [...resultsJobs, ...govJobs, ...admitCards, ...admissionJobs].slice(0, 10)

  const webPageSchema = {
    '@context': 'https://schema.org', '@type': 'WebPage',
    name: 'Sarkari Afsar — Sarkari Naukri & Government Yojana Portal 2026',
    description: 'Latest Sarkari Jobs, Government Schemes, Exam Results, Admit Cards 2026.',
    url: SITE_URL, inLanguage: 'en-IN',
    dateModified: new Date().toISOString().split('T')[0],
    breadcrumb: { '@type':'BreadcrumbList', itemListElement:[{ '@type':'ListItem', position:1, name:'Home', item:SITE_URL }] },
  }
  const itemListSchema = {
    '@context': 'https://schema.org', '@type': 'ItemList',
    name: 'Latest Sarkari Jobs 2026',
    description: 'Latest government job notifications, results and admit cards in India 2026',
    url: `${SITE_URL}/jobs`, numberOfItems: allTopJobs.length,
    itemListElement: allTopJobs.map((job, i) => ({ '@type':'ListItem', position:i+1, name:job.title, url:`${SITE_URL}/jobs/${job.slug}` })),
  }

  const statItems = [
    { label: 'Active Jobs',    value: stats.totalPosts   > 0 ? `${stats.totalPosts}+`   : '393+', icon: '💼' },
    { label: 'Gov. Schemes',   value: stats.totalSchemes > 0 ? `${stats.totalSchemes}+` : '210+', icon: '🏛️' },
    { label: 'Blog Posts',     value: stats.totalBlog    > 0 ? `${stats.totalBlog}+`    : '131+', icon: '📝' },
    { label: 'States Covered', value: '28+',                                                       icon: '🗺️' },
  ]

  const sections = [
    { name: 'Results',            jobs: resultsJobs,    meta: SECTION_META['Results'] },
    { name: 'Latest Gov Jobs',    jobs: govJobs,        meta: SECTION_META['Latest Gov Jobs'] },
    { name: 'Recent Admit Cards', jobs: admitCards,     meta: SECTION_META['Recent Admit Cards'] },
    { name: 'Admission',          jobs: admissionJobs,  meta: SECTION_META['Admission'] },
  ]

  const categories = [
    { name:'Results',      icon:'📋', href:'/jobs?section=Results' },
    { name:'Admit Card',   icon:'🪪', href:'/jobs?section=Recent+Admit+Cards' },
    { name:'Gov Jobs',     icon:'📣', href:'/jobs?section=Latest+Gov+Jobs' },
    { name:'Admission',    icon:'🎓', href:'/jobs?section=Admission' },
    { name:'Banking',      icon:'🏦', href:'/jobs?category=Banking' },
    { name:'Railway',      icon:'🚂', href:'/jobs?category=Railway' },
    { name:'Defence',      icon:'🛡️', href:'/jobs?category=Defence' },
    { name:'Teaching',     icon:'📚', href:'/jobs?category=Teaching' },
    { name:'Police',       icon:'👮', href:'/jobs?category=Police' },
    { name:'Bihar Yojana', icon:'🌿', href:'/yojana?state=Bihar' },
    { name:'UP Yojana',    icon:'🌿', href:'/yojana?state=Uttar+Pradesh' },
    { name:'All Yojana',   icon:'🏛️', href:'/yojana' },
  ]

  return (
    <div style={{ background: T.bg, minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section style={{ background: T.navy, borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 20px 30px' }}>

          {/* masthead line */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            marginBottom: 28,
          }}>
            <div style={{ flex: 1, height: 1, background: `${T.gold}40` }} />
            <span style={{
              fontFamily: sans, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.26em', textTransform: 'uppercase',
              color: T.gold,
            }}>
              India's Trusted Sarkari Portal · Since 2024
            </span>
            <div style={{ flex: 1, height: 1, background: `${T.gold}40` }} />
          </div>

          {/* headline */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{
              fontFamily: serif,
              fontSize: 'clamp(28px, 5vw, 46px)',
              fontWeight: 700,
              color: T.white,
              margin: '0 0 10px',
              lineHeight: 1.18,
              letterSpacing: '-0.02em',
            }}>
              Find Your{' '}
              <span style={{ color: T.gold }}>Sarkari Naukri</span>
              <br />& Government Yojana
            </h1>
            <p style={{
              fontFamily: sans, fontSize: 15,
              color: 'rgba(255,255,255,0.5)',
              margin: '0 auto',
              maxWidth: 500,
              lineHeight: 1.6,
            }}>
              Latest government jobs, exam results, admit cards and schemes — all in one place.
            </p>
          </div>

          {/* search */}
          <form action="/search" method="get" style={{ maxWidth: 560, margin: '0 auto 24px' }}>
            <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 6 }}>
              <input
                name="q"
                type="text"
                placeholder="Search jobs, schemes, results..."
                style={{
                  flex: 1, padding: '10px 14px',
                  background: 'transparent', border: 'none',
                  color: T.white, fontFamily: sans, fontSize: 13,
                  outline: 'none',
                }}
              />
              <button type="submit" style={{
                padding: '10px 20px',
                background: T.gold, color: T.navy,
                border: 'none', borderRadius: 5,
                fontFamily: sans, fontSize: 12, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: 'pointer', flexShrink: 0,
              }}>
                Search
              </button>
            </div>
          </form>

          {/* quick section pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(SECTION_META).map(([name, meta]) => (
              <Link key={name} href={`/jobs?section=${encodeURIComponent(name)}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 14px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 20, textDecoration: 'none',
                fontFamily: sans, fontSize: 11, fontWeight: 600,
                color: 'rgba(255,255,255,0.65)',
                transition: 'all .15s',
              }}
              className="hover:bg-white/15"
              >
                <span style={{ fontSize: 12 }}>{meta.icon}</span>
                {name}
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ══ STATS BAR ═════════════════════════════════════════════════════ */}
      <section style={{ background: T.white, borderBottom: `1px solid ${T.rule}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {statItems.map((stat, i) => (
              <div key={stat.label} style={{
                textAlign: 'center',
                padding: '12px 0',
                borderRight: i < statItems.length - 1 ? `1px solid ${T.rule}` : 'none',
              }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: T.navy }}>{stat.value}</div>
                <div style={{ fontFamily: sans, fontSize: 10, color: T.faint, marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MAIN CONTENT ═════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 20px 52px' }}>

        {/* Top AdSense */}
        <div style={{ marginBottom: 32 }}>
          <AdSlot placement="home-top" />
        </div>

        {/* ── Jobs Section ──────────────────────────────────────────────── */}
        <section style={{ marginBottom: 8 }}>
          <SectionHeading
            title="Latest Sarkari Jobs 2026"
            subtitle="Government job notifications organized by category"
            href="/jobs"
          />
          {/* 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }} className="home-grid">
            {sections.slice(0, 2).map(({ name, jobs, meta }) => (
              <StateFilterSection
                key={name}
                sectionName={name}
                initialJobs={jobs}
                meta={meta}
                viewAllHref={meta.route || `/jobs?section=${encodeURIComponent(name)}`}
                limit={10}
                variant="home"
              />
            ))}
          </div>

          {/* Mid AdSense */}
          <div style={{ margin: '20px 0' }}>
            <AdSlot placement="home-between-sections" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }} className="home-grid">
            {sections.slice(2).map(({ name, jobs, meta }) => (
              <StateFilterSection
                key={name}
                sectionName={name}
                initialJobs={jobs}
                meta={meta}
                viewAllHref={meta.route || `/jobs?section=${encodeURIComponent(name)}`}
                limit={10}
                variant="home"
              />
            ))}
          </div>
        </section>

        <Divider />

        {/* ── Schemes Section ───────────────────────────────────────────── */}
        <section style={{ marginBottom: 8 }}>
          <SectionHeading
            title="Government Yojana"
            subtitle="Central & state government welfare schemes"
            href="/yojana"
            linkLabel="All Yojana →"
          />
          {schemes.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="schemes-grid">
              {schemes.map(s => <SchemeCard key={s._id || s.slug} scheme={s} />)}
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: sans, fontSize: 13, color: T.faint, fontStyle: 'italic' }}>
              No schemes available right now.
            </div>
          )}
        </section>

        <Divider />

        {/* ── Blog Section ──────────────────────────────────────────────── */}
        {blogs.length > 0 && (
          <>
            <section style={{ marginBottom: 8 }}>
              <SectionHeading
                title="Informational Guides"
                subtitle="Tips, guides and government job updates"
                href="/blog"
                linkLabel="All Blogs →"
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="blog-grid">
                {blogs.map(b => <BlogCard key={b._id || b.slug} blog={b} />)}
              </div>
            </section>
            <Divider />
          </>
        )}

        {/* ── Browse by Category ────────────────────────────────────────── */}
        <section>
          <SectionHeading title="Browse by Category" subtitle="Find jobs and schemes by department" />
          <div style={{
            background: T.white,
            border: `1px solid ${T.rule}`,
            borderTop: `3px solid ${T.gold}`,
            borderRadius: 8,
            padding: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }} className="cat-grid">
              {categories.map(cat => (
                <Link key={cat.name} href={cat.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '12px 8px', borderRadius: 7,
                    border: `1px solid transparent`,
                    transition: 'all .15s',
                    textAlign: 'center',
                  }}
                  className="cat-item"
                  >
                    <span style={{ fontSize: 22 }}>{cat.icon}</span>
                    <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, color: T.muted, lineHeight: 1.3 }}>{cat.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom AdSense */}
        <div style={{ marginTop: 36 }}>
          <AdSlot placement="home-bottom" />
        </div>

      </div>

      {/* ── Global Styles ─────────────────────────────────────────────── */}
      <style>{`

        * { box-sizing: border-box; }

        input::placeholder { color: rgba(255,255,255,0.3); }

        .cat-item:hover {
          background: ${T.goldL};
          border-color: ${T.rule} !important;
        }
        .cat-item:hover span:last-child { color: ${T.navy}; }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        @media (max-width: 900px) {
          .home-grid    { grid-template-columns: 1fr !important; }
          .schemes-grid { grid-template-columns: 1fr 1fr !important; }
          .blog-grid    { grid-template-columns: 1fr 1fr !important; }
          .cat-grid     { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .schemes-grid { grid-template-columns: 1fr !important; }
          .blog-grid    { grid-template-columns: 1fr !important; }
          .cat-grid     { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}