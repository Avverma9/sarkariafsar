import { Fragment } from 'react'
import Link from 'next/link'
import AdsenseUnit from '@/components/ads/AdsenseUnitClient'
import StateFilterSection from '@/components/jobs/StateFilterSectionClient'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'Latest Sarkari Jobs 2026 — Sarkari Afsar',
  description: 'Latest Sarkari Naukri 2026 — Results, Admit Cards, Recruitment, Admissions, Answer Key, Syllabus. Find all government job updates at Sarkari Afsar.',
  alternates: { canonical: `${SITE_URL}/jobs` },
  openGraph: {
    title: 'Latest Sarkari Jobs 2026 — Sarkari Afsar',
    description: 'Latest Sarkari Naukri 2026 — Results, Admit Cards, Recruitment, Admissions. Find all government job updates.',
    url: `${SITE_URL}/jobs`,
    siteName: 'Sarkari Afsar',
    images: [{ url: `${SITE_URL}/api/og?title=Latest+Sarkari+Jobs+2026&type=jobs`, width: 1200, height: 630, alt: 'Latest Sarkari Jobs 2026 — Sarkari Afsar' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Latest Sarkari Jobs 2026 — Sarkari Afsar', description: 'Latest Sarkari Naukri 2026 — Results, Admit Cards, Recruitment, Admissions.', site: '@sarkariafsar' },
}

const SECTIONS = ['Results', 'Latest Gov Jobs', 'Recent Admit Cards', 'Admission']

const SECTION_ROUTES = {
  'Results':            '/results',
  'Latest Gov Jobs':    '/latest-jobs',
  'Recent Admit Cards': '/admit-cards',
  'Admission':          '/admission',
}

const SECTION_META = {
  'Results': {
    icon: '📊',
    accent: '#16a34a',
    accentLight: '#f0fdf4',
    accentMid: '#dcfce7',
    accentText: '#15803d',
    label: 'Results',
  },
  'Latest Gov Jobs': {
    icon: '💼',
    accent: '#1d4ed8',
    accentLight: '#eff6ff',
    accentMid: '#dbeafe',
    accentText: '#1e40af',
    label: 'Gov Jobs',
  },
  'Recent Admit Cards': {
    icon: '🪪',
    accent: '#7c3aed',
    accentLight: '#f5f3ff',
    accentMid: '#ede9fe',
    accentText: '#6d28d9',
    label: 'Admit Cards',
  },
  'Admission': {
    icon: '🎓',
    accent: '#c2410c',
    accentLight: '#fff7ed',
    accentMid: '#fed7aa',
    accentText: '#c2410c',
    label: 'Admission',
  },
}

const DEFAULT_META = {
  icon: '📋',
  accent: '#374151',
  accentLight: '#f9fafb',
  accentMid: '#f3f4f6',
  accentText: '#374151',
  label: 'Jobs',
}

// ── Data fetchers ──────────────────────────────────────────────────────────

async function fetchSection(sectionName, page = 1, limit = 20) {
  try {
    const res = await fetch(
      `${API_BASE}/post/?page=${page}&limit=${limit}&sectionName=${encodeURIComponent(sectionName)}`,
      { next: { revalidate: 1800 } }
    )
    const data = await res.json()
    return { jobs: data?.data || [], total: data?.pagination?.total || 0, totalPages: data?.pagination?.totalPages || 1 }
  } catch { return { jobs: [], total: 0, totalPages: 1 } }
}

async function fetchFiltered(section, search, page = 1, limit = 20) {
  try {
    let url = `${API_BASE}/post/?page=${page}&limit=${limit}`
    if (section) url += `&sectionName=${encodeURIComponent(section)}`
    if (search)  url += `&search=${encodeURIComponent(search)}`
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    return { jobs: data?.data || [], total: data?.pagination?.total || 0, totalPages: data?.pagination?.totalPages || 1 }
  } catch { return { jobs: [], total: 0, totalPages: 1 } }
}

// ── Sub-components ─────────────────────────────────────────────────────────

function JobRow({ job, meta }) {
  const lastDate = job.applyLastDate
    ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  const isActive = job.isActive

  return (
    <tr
      style={{ borderBottom: '1px solid #f1f0eb' }}
      className="group"
    >
      <td style={{ padding: '11px 16px', verticalAlign: 'middle' }}>
        <Link
          href={`/jobs/${job.slug}`}
          style={{
            color: meta.accentText,
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 13.5,
            fontWeight: 500,
            lineHeight: 1.5,
            textDecoration: 'none',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          className="hover:underline"
        >
          {job.title}
        </Link>
      </td>
      <td
        style={{
          padding: '11px 16px',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          fontSize: 11.5,
          color: '#9c8f7a',
          whiteSpace: 'nowrap',
          verticalAlign: 'middle',
        }}
        className="hidden sm:table-cell"
      >
        {lastDate}
      </td>
      <td style={{ padding: '11px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
        <span style={{
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: 20,
          fontSize: 10.5,
          fontWeight: 700,
          fontFamily: 'sans-serif',
          letterSpacing: '0.04em',
          background: isActive ? '#f0fdf4' : '#fef2f2',
          color: isActive ? '#15803d' : '#b91c1c',
          border: `1px solid ${isActive ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {isActive ? 'Active' : 'Closed'}
        </span>
      </td>
    </tr>
  )
}

function SectionCard({ section, jobs, meta, total }) {
  const viewAllHref = SECTION_ROUTES[section] || `/jobs?section=${encodeURIComponent(section)}`

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e8e3d8',
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    }}>
      {/* Card header */}
      <div style={{
        background: meta.accentLight,
        borderBottom: `2px solid ${meta.accent}`,
        padding: '13px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: meta.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            flexShrink: 0,
          }}>
            {meta.icon}
          </div>
          <div>
            <div style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 15,
              fontWeight: 600,
              color: '#1a1a1a',
              lineHeight: 1.2,
            }}>
              {section}
            </div>
            <div style={{
              fontFamily: 'sans-serif',
              fontSize: 11,
              color: '#9c8f7a',
              marginTop: 1,
            }}>
              {total} posts available
            </div>
          </div>
        </div>

        <Link
          href={viewAllHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 12px',
            borderRadius: 20,
            border: `1px solid ${meta.accent}`,
            background: 'transparent',
            color: meta.accent,
            fontFamily: 'sans-serif',
            fontSize: 11,
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '0.03em',
            transition: 'all .15s',
          }}
          className="hover:opacity-80"
        >
          View All →
        </Link>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#faf8f4' }}>
              <th style={{
                padding: '8px 16px',
                textAlign: 'left',
                fontFamily: 'sans-serif',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#9c8f7a',
                width: '58%',
              }}>
                Post Name
              </th>
              <th style={{
                padding: '8px 16px',
                textAlign: 'center',
                fontFamily: 'sans-serif',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#9c8f7a',
              }}
              className="hidden sm:table-cell"
              >
                Last Date
              </th>
              <th style={{
                padding: '8px 16px',
                textAlign: 'center',
                fontFamily: 'sans-serif',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#9c8f7a',
              }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={3} style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  fontFamily: 'sans-serif',
                  fontSize: 12,
                  color: '#c6bfb4',
                  fontStyle: 'italic',
                }}>
                  No posts available
                </td>
              </tr>
            ) : (
              jobs.map((job, i) => <JobRow key={job._id || i} job={job} meta={meta} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Pagination({ page, totalPages, section, search }) {
  const base = `/jobs?${section ? `section=${encodeURIComponent(section)}&` : ''}${search ? `search=${encodeURIComponent(search)}&` : ''}`
  const start = Math.max(1, page - 2)
  const end   = Math.min(totalPages, start + 4)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const btnBase = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    height: 36,
    padding: '0 12px',
    borderRadius: 6,
    border: '1px solid #e8e3d8',
    background: '#fff',
    fontFamily: 'sans-serif',
    fontSize: 13,
    fontWeight: 500,
    color: '#3a3530',
    textDecoration: 'none',
    transition: 'all .15s',
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 32, flexWrap: 'wrap' }}>
      {page > 1 ? (
        <Link href={`${base}page=${page - 1}`} style={btnBase} className="hover:bg-gray-50">← Prev</Link>
      ) : (
        <span style={{ ...btnBase, opacity: 0.35, cursor: 'not-allowed' }}>← Prev</span>
      )}
      {pages.map(p => (
        <Link key={p} href={`${base}page=${p}`} style={{
          ...btnBase,
          background: p === page ? '#1c1c1c' : '#fff',
          color: p === page ? '#fff' : '#3a3530',
          borderColor: p === page ? '#1c1c1c' : '#e8e3d8',
          fontWeight: p === page ? 700 : 500,
        }}>
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link href={`${base}page=${page + 1}`} style={btnBase} className="hover:bg-gray-50">Next →</Link>
      ) : (
        <span style={{ ...btnBase, opacity: 0.35, cursor: 'not-allowed' }}>Next →</span>
      )}
    </div>
  )
}

// ── AdSense wrapper ────────────────────────────────────────────────────────

function AdSlot({ placement }) {
  return (
    <div style={{
      border: '1px solid #e8e3d8',
      borderRadius: 8,
      background: '#faf8f4',
      padding: '4px',
      overflow: 'hidden',
    }}>
      <AdsenseUnit placement={placement} className="w-full" />
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default async function JobsPage({ searchParams }) {
  const params   = await searchParams
  const section  = params?.section || ''
  const search   = params?.search  || ''
  const page     = Math.max(1, parseInt(params?.page || '1', 10))
  const isFiltered = !!(section || search)
  const activeMeta = SECTION_META[section] || DEFAULT_META

  let mainContent

  // ── Filtered / search view ───────────────────────────────────────────────
  if (isFiltered) {
    const { jobs, total, totalPages } = await fetchFiltered(section, search, page, 20)

    mainContent = (
      <>
        <SectionCard section={section || 'Search Results'} jobs={jobs} meta={activeMeta} total={total} />
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} section={section} search={search} />}
      </>
    )

  // ── Default multi-section grid ───────────────────────────────────────────
  } else {
    const results  = await Promise.all(SECTIONS.map(s => fetchSection(s, 1, 20)))
    const sections = SECTIONS.map((name, i) => ({
      name,
      ...results[i],
      meta: SECTION_META[name] || DEFAULT_META,
    }))

    // ── ItemList schema — top 5 from each section ──
    const allFeatured = sections.flatMap(s => (s.jobs || []).slice(0, 5))
    const jobsItemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Latest Sarkari Jobs 2026',
      description: 'Latest government jobs, results, admit cards and admissions 2026',
      url: `${SITE_URL}/jobs`,
      numberOfItems: allFeatured.length,
      itemListElement: allFeatured.map((job, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: job.title,
        url: `${SITE_URL}/jobs/${job.slug}`,
      })),
    }

    mainContent = (<>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobsItemListSchema) }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}
           className="grid-cols-1 lg:grid-cols-2"
      >
        {sections.map((s, i) => (
          <Fragment key={s.name}>
            <StateFilterSection
              sectionName={s.name}
              initialJobs={s.jobs}
              meta={s.meta}
              viewAllHref={SECTION_ROUTES[s.name] || `/jobs?section=${encodeURIComponent(s.name)}`}
              total={s.total}
              limit={20}
              variant="jobs"
            />

            {/* AdSense after 2nd section — full width */}
            {i === 1 && (
              <div key="ad-mid" style={{ gridColumn: '1 / -1' }}>
                <AdSlot placement="jobs-mid-page" />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </>)
  }

  return (
    <div style={{ background: '#f5f2ec', minHeight: '100vh' }}>

      {/* ══ HERO HEADER ══════════════════════════════════════════════════ */}
      <div style={{
        background: '#1c1c1c',
        borderBottom: '3px solid #c9a84c',
        padding: '0 0 0',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 20px' }}>
          {/* Breadcrumb */}
          <nav style={{
            fontFamily: 'sans-serif',
            fontSize: 11.5,
            color: 'rgba(255,255,255,0.45)',
            marginBottom: 14,
            letterSpacing: '0.03em',
          }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
              className="hover:text-white">Home</Link>
            {' '}›{' '}
            <span style={{ color: '#c9a84c' }}>Jobs</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{
                fontFamily: 'sans-serif',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#c9a84c',
                marginBottom: 8,
              }}>
                Sarkari Afsar · Government Jobs Portal
              </div>
              <h1 style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: 28,
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}>
                Latest Sarkari Jobs 2026
              </h1>
              <p style={{
                fontFamily: 'sans-serif',
                fontSize: 13,
                color: 'rgba(255,255,255,0.5)',
                marginTop: 8,
                marginBottom: 0,
              }}>
                Results · Admit Cards · Recruitment · Admissions — Updated Daily
              </p>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Active Jobs', value: '393+' },
                { label: 'States', value: '28+' },
              ].map(stat => (
                <div key={stat.label} style={{
                  textAlign: 'center',
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                }}>
                  <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#c9a84c' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: '0.06em' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── SEARCH + FILTER BAR ─────────────────────────────────────── */}
          <div style={{
            marginTop: 20,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '14px 16px',
          }}>
            <form method="GET" action="/jobs" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: 14,
                  pointerEvents: 'none',
                }}>🔍</span>
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Search jobs, results, admit cards..."
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 7,
                    color: '#fff',
                    fontSize: 13,
                    fontFamily: 'sans-serif',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  className="placeholder:text-white/30 focus:border-[#c9a84c]/50"
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: '#c9a84c',
                  color: '#1c1c1c',
                  border: 'none',
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'sans-serif',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Search
              </button>
            </form>

            {/* Section pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Link
                href="/jobs"
                style={{
                  padding: '4px 14px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'sans-serif',
                  letterSpacing: '0.04em',
                  textDecoration: 'none',
                  border: `1px solid ${!section && !search ? '#c9a84c' : 'rgba(255,255,255,0.15)'}`,
                  background: !section && !search ? '#c9a84c' : 'transparent',
                  color: !section && !search ? '#1c1c1c' : 'rgba(255,255,255,0.6)',
                  transition: 'all .15s',
                }}
              >
                All
              </Link>
              {SECTIONS.map(s => {
                const m = SECTION_META[s]
                const isActive = section === s
                return (
                  <Link
                    key={s}
                    href={`/jobs?section=${encodeURIComponent(s)}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 14px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'sans-serif',
                      letterSpacing: '0.04em',
                      textDecoration: 'none',
                      border: `1px solid ${isActive ? m.accent : 'rgba(255,255,255,0.15)'}`,
                      background: isActive ? m.accent : 'transparent',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                      transition: 'all .15s',
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{m.icon}</span>
                    {m.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ══ MAIN CONTENT ═════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 48px' }}>

        {/* Top AdSense — leaderboard */}
        <div style={{ marginBottom: 20 }}>
          <AdSlot placement="jobs-top-leaderboard" />
        </div>

        {/* Active filter indicator */}
        {isFiltered && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            padding: '10px 16px',
            background: '#fff',
            border: '1px solid #e8e3d8',
            borderRadius: 8,
            fontFamily: 'sans-serif',
          }}>
            <div style={{ fontSize: 13, color: '#3a3530', fontWeight: 500 }}>
              {section && <span style={{ color: activeMeta.accentText }}>📂 {section}</span>}
              {search && <span style={{ color: '#6b6355' }}> · "{search}"</span>}
            </div>
            <Link href="/jobs" style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#9c8f7a',
              textDecoration: 'none',
              letterSpacing: '0.05em',
            }}>
              ✕ Clear Filter
            </Link>
          </div>
        )}

        {mainContent}

        {/* Bottom AdSense — after content */}
        <div style={{ marginTop: 32 }}>
          <AdSlot placement="jobs-bottom" />
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        tr.group:hover { background: #faf8f4 !important; }
        @media (max-width: 768px) {
          .grid-cols-1 { grid-template-columns: 1fr !important; }
        }
        input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  )
}