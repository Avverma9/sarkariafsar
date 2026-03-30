import Link from 'next/link'
import AdsenseUnit from '@/components/ads/AdsenseUnitClient'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'Latest Sarkari Jobs 2026 — Sarkari Afsar',
  description: 'Latest Sarkari Naukri 2026 — Results, Admit Cards, Recruitment, Admissions, Answer Key, Syllabus. Find all government job updates at Sarkari Afsar.',
  alternates: { canonical: `${SITE_URL}/jobs` },
}

const SECTIONS = ['Results', 'Latest Gov Jobs', 'Recent Admit Cards', 'Admission']

const SECTION_COLORS = {
  'Results':           { bg: 'bg-green-600',  light: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  icon: '📊' },
  'Latest Gov Jobs':   { bg: 'bg-blue-600',   light: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   icon: '💼' },
  'Recent Admit Cards':{ bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '🪪' },
  'Admission':         { bg: 'bg-orange-600', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🎓' },

}
const DEFAULT_COLOR = { bg: 'bg-gray-600', light: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '📋' }

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

function JobRow({ job, color }) {
  const lastDate = job.applyLastDate
    ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-2.5">
        <Link href={`/jobs/${job.slug}`} className={`${color.text} hover:underline font-medium leading-snug line-clamp-2`}>
          {job.title}
        </Link>
      </td>
      <td className="px-4 py-2.5 text-center text-xs text-gray-500 hidden sm:table-cell whitespace-nowrap">{lastDate}</td>
      <td className="px-4 py-2.5 text-center">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${job.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {job.isActive ? 'Active' : 'Closed'}
        </span>
      </td>
    </tr>
  )
}

function SectionTable({ section, jobs, color, total }) {
  return (
    <div className={`bg-white rounded-xl border ${color.border} overflow-hidden shadow-sm`}>
      <div className={`${color.bg} text-white px-4 py-3 flex items-center justify-between`}>
        <h3 className="font-bold text-base flex items-center gap-2">
          <span>{color.icon}</span> {section}
        </h3>
        <Link
          href={`/jobs?section=${encodeURIComponent(section)}`}
          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors font-medium"
        >
          View All ({total}) →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`${color.light} ${color.text} text-xs font-semibold`}>
              <th className="px-4 py-2.5 text-left w-[60%]">Post Name</th>
              <th className="px-4 py-2.5 text-center hidden sm:table-cell">Last Date</th>
              <th className="px-4 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {jobs.length === 0
              ? <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">No posts available</td></tr>
              : jobs.map((job, i) => <JobRow key={job._id || i} job={job} color={color} />)
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Pagination({ page, totalPages, section, search }) {
  const base = `/jobs?${section ? `section=${encodeURIComponent(section)}&` : ''}${search ? `search=${encodeURIComponent(search)}&` : ''}`
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <div className="flex justify-center items-center gap-2 mt-20 flex-wrap">
      {page > 1
        ? <Link href={`${base}page=${page - 1}`} className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">← Prev</Link>
        : <span className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white opacity-40 cursor-not-allowed">← Prev</span>
      }
      {pages.map(p => (
        <Link key={p} href={`${base}page=${p}`}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${p === page ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
        >{p}</Link>
      ))}
      {page < totalPages
        ? <Link href={`${base}page=${page + 1}`} className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">Next →</Link>
        : <span className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white opacity-40 cursor-not-allowed">Next →</span>
      }
    </div>
  )
}

export default async function JobsPage({ searchParams }) {
  const params = await searchParams
  const section = params?.section || ''
  const search  = params?.search  || ''
  const page    = Math.max(1, parseInt(params?.page || '1', 20))
  const isFiltered = section || search

  let mainContent
  if (isFiltered) {
    const { jobs, total, totalPages } = await fetchFiltered(section, search, page, 20)
    const color = SECTION_COLORS[section] || DEFAULT_COLOR
    mainContent = (
      <>
        <div className={`bg-white rounded-xl border ${color.border} overflow-hidden shadow-sm`}>
          <div className={`${color.bg} text-white px-4 py-3 flex items-center justify-between`}>
            <h3 className="font-bold text-base flex items-center gap-2">
              <span>{color.icon}</span>
              {section || 'Search Results'}
              <span className="text-white/70 font-normal text-sm ml-1">({total} posts)</span>
            </h3>
            <Link href="/jobs" className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors">
              ← All Sections
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${color.light} ${color.text} text-xs font-semibold`}>
                  <th className="px-4 py-2.5 text-left w-[60%]">Post Name</th>
                  <th className="px-4 py-2.5 text-center hidden sm:table-cell">Last Date</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.length === 0
                  ? <tr><td colSpan={3} className="py-20 text-center text-gray-400">No posts found</td></tr>
                  : jobs.map((job, i) => <JobRow key={job._id || i} job={job} color={color} />)
                }
              </tbody>
            </table>
          </div>
        </div>
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} section={section} search={search} />}
      </>
    )
  } else {
    const results = await Promise.all(SECTIONS.map(s => fetchSection(s, 1, 20)))
    const sections = SECTIONS.map((name, i) => ({ name, ...results[i], color: SECTION_COLORS[name] || DEFAULT_COLOR }))
    mainContent = (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((s, i) => (
          <div key={s.name}>
            <SectionTable section={s.name} jobs={s.jobs} color={s.color} total={s.total} />
            {i === 1 && (
              <div className="mt-6 lg:col-span-2">
                <AdsenseUnit placement="listing-infeed" className="w-full" />
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-[#1e3a5f] text-white py-20 px-4">
        <div className="container mx-auto">
          <nav className="text-sm text-blue-300 mb-3">
            <Link href="/" className="hover:text-white">Home</Link> &rsaquo; <span className="text-white">Jobs</span>
          </nav>
          <h1 className="text-3xl font-bold">Latest Sarkari Jobs 2026</h1>
          <p className="text-blue-200 mt-2">Government job notifications organized by category</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        {/* Search + Section Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <form method="GET" action="/jobs" className="flex gap-2">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search jobs..."
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
            />
            <button type="submit" className="bg-[#1e3a5f] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#153060] transition-colors">
              Search
            </button>
          </form>
          <div className="flex flex-wrap gap-2 mt-3">
            <Link href="/jobs"
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${!section && !search ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >All</Link>
            {SECTIONS.map(s => (
              <Link key={s} href={`/jobs?section=${encodeURIComponent(s)}`}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${section === s ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >{s}</Link>
            ))}
          </div>
        </div>
        {mainContent}
      </div>
    </div>
  )
}
