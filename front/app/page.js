import Link from 'next/link'
import AdsenseUnit from '@/components/ads/AdsenseUnitClient'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'Sarkari Afsar — Sarkari Naukri & Government Yojana Portal 2026',
  description: 'Latest Sarkari Jobs, Government Schemes, Exam Results, Admit Cards 2026. Find all government job notifications and yojana updates at Sarkari Afsar.',
  alternates: { canonical: SITE_URL },
  openGraph: { url: SITE_URL },
}

// Fetch jobs by section
async function getJobsBySection(sectionName, limit = 10) {
  try {
    const res = await fetch(
      `${API_BASE}/post/?page=1&limit=${limit}&sectionName=${encodeURIComponent(sectionName)}`,
      { next: { revalidate: 1800 } }
    )
    const data = await res.json()
    return data?.data || []
  } catch { return [] }
}

async function getLatestSchemes() {
  try {
    const res = await fetch(`${API_BASE}/schemes/?page=1&limit=6`, { next: { revalidate: 3600 } })
    const data = await res.json()
    return data?.data || []
  } catch { return [] }
}

async function getLatestBlogs() {
  try {
    const res = await fetch(`${API_BASE}/blog/?page=1&limit=3`, { next: { revalidate: 3600 } })
    const data = await res.json()
    return data?.data || []
  } catch { return [] }
}

async function getSiteStats() {
  try {
    const [postsRes, schemesRes, blogsRes] = await Promise.all([
      fetch(`${API_BASE}/post/?page=1&limit=1`, { next: { revalidate: 3600 } }),
      fetch(`${API_BASE}/schemes/?page=1&limit=1`, { next: { revalidate: 3600 } }),
      fetch(`${API_BASE}/blog/?page=1&limit=1`, { next: { revalidate: 3600 } }),
    ])
    const [postsData, schemesData, blogsData] = await Promise.all([
      postsRes.json(), schemesRes.json(), blogsRes.json()
    ])
    return {
      totalPosts: postsData?.pagination?.total || 0,
      totalSchemes: schemesData?.pagination?.total || 0,
      totalBlog: blogsData?.pagination?.total || 0,
    }
  } catch { return { totalPosts: 0, totalSchemes: 0, totalBlog: 0 } }
}

const SECTION_COLORS = {
  'Results': { bg: 'bg-green-600', light: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: '📊' },
  'Latest Gov Jobs': { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '💼' },
  'Recent Admit Cards': { bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '🪪' },
  'Admission': { bg: 'bg-orange-600', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🎓' },
}

function JobTable({ section, jobs, color }) {
  return (
    <div className={`bg-white rounded-xl border ${color.border} overflow-hidden shadow-sm`}>
      {/* Section Header */}
      <div className={`${color.bg} text-white px-4 py-3 flex items-center justify-between`}>
        <h3 className="font-bold text-base flex items-center gap-2">
          <span>{color.icon}</span>
          {section}
        </h3>
        <Link
          href={`/jobs?section=${encodeURIComponent(section)}`}
          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors font-medium"
        >
          View All &rarr;
        </Link>
      </div>

      {/* Table */}
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
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">No posts available</td>
              </tr>
            ) : (
              jobs.map((job, i) => {
                const lastDate = job.applyLastDate
                  ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '\u2014'
                return (
                  <tr key={job._id || i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link href={`/jobs/${job.slug}`} className={`${color.text} hover:underline font-medium leading-snug line-clamp-2`}>
                        {job.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs text-gray-500 hidden sm:table-cell whitespace-nowrap">
                      {lastDate}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        job.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {job.isActive ? 'Active' : 'Closed'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SchemeCard({ scheme }) {
  return (
    <Link href={`/yojana/${scheme.slug}`} className="block group">
      <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-[#1e3a5f]/20 transition-all duration-200 h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full line-clamp-1 max-w-[65%]">
            {scheme.schemetype || 'Government Scheme'}
          </span>
          <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full shrink-0">
            {scheme.state?.includes('Pan-India') || scheme.state?.includes('All States') ? 'Pan-India' : scheme.state?.split('(')[0]?.trim() || 'All India'}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-[#1e3a5f] transition-colors flex-1 line-clamp-2">
          {scheme.schemeTitle}
        </h3>
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{scheme.aboutScheme?.slice(0, 100)}</p>
      </div>
    </Link>
  )
}

function BlogCard({ blog }) {
  const date = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  return (
    <Link href={`/blog/${blog.slug}`} className="block group">
      <div className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-[#1e3a5f]/20 transition-all h-full flex flex-col">
        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium w-fit mb-3">{blog.category || 'Blog'}</span>
        <h3 className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-[#1e3a5f] transition-colors flex-1 line-clamp-2 capitalize">
          {blog.title || blog.slug?.replace(/-/g, ' ')}
        </h3>
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{blog.excerpt || blog.intro?.slice(0, 100)}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">{blog.author || 'Sarkari Afsar'}</span>
          <span className="text-xs text-gray-400">{date}</span>
        </div>
      </div>
    </Link>
  )
}

export default async function HomePage() {
  // Fetch all data in parallel
  const [stats, resultsJobs, govJobs, admitCards, admissionJobs, schemes, blogs] = await Promise.all([
    getSiteStats(),
    getJobsBySection('Results', 10),
    getJobsBySection('Latest Gov Jobs', 10),
    getJobsBySection('Recent Admit Cards', 10),
    getJobsBySection('Admission', 10),
    getLatestSchemes(),
    getLatestBlogs(),
  ])

  const statItems = [
    { label: 'Active Jobs', value: stats.totalPosts > 0 ? `${stats.totalPosts}+` : '389+', icon: '💼' },
    { label: 'Gov. Schemes', value: stats.totalSchemes > 0 ? `${stats.totalSchemes}+` : '210+', icon: '🏛️' },
    { label: 'Blog Posts', value: stats.totalBlog > 0 ? `${stats.totalBlog}+` : '131+', icon: '📝' },
    { label: 'States Covered', value: '28+', icon: '🗺️' },
  ]

  const sections = [
    { name: 'Results', jobs: resultsJobs, color: SECTION_COLORS['Results'] },
    { name: 'Latest Gov Jobs', jobs: govJobs, color: SECTION_COLORS['Latest Gov Jobs'] },
    { name: 'Recent Admit Cards', jobs: admitCards, color: SECTION_COLORS['Recent Admit Cards'] },
    { name: 'Admission', jobs: admissionJobs, color: SECTION_COLORS['Admission'] },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1e3a5f] via-[#1e4a7f] to-[#153060] text-white py-14 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-[#f59e0b]/20 text-[#f59e0b] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-[#f59e0b] rounded-full animate-pulse"></span>
            India&apos;s Most Trusted Sarkari Portal 2026
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            Find Your <span className="text-[#f59e0b]">Sarkari Naukri</span>
            <br />& Government Yojana
          </h1>
          <p className="text-blue-200 text-lg mb-10 max-w-2xl mx-auto">
            Latest government jobs, exam results, admit cards and government schemes &mdash; all in one place.
          </p>
          {/* Search Bar */}
          <form action="/search" method="get" className="flex gap-2 max-w-2xl mx-auto">
            <input
              name="q"
              type="text"
              placeholder="Search jobs, schemes, results..."
              className="flex-1 px-5 py-3.5 rounded-xl text-gray-800 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#f59e0b] text-base"
            />
            <button type="submit" className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-6 py-3.5 rounded-xl font-semibold transition-colors shadow-lg whitespace-nowrap">
              Search
            </button>
          </form>
          {/* Quick category links */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {Object.entries(SECTION_COLORS).map(([name, c]) => (
              <Link key={name} href={`/jobs?section=${encodeURIComponent(name)}`}
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                <span>{c.icon}</span> {name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* REAL Stats Bar */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {statItems.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold text-[#1e3a5f]">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* (moved) AD PLACEMENT: moved below the top row of section tables */}

      <div className="container mx-auto px-4 py-6">

        {/* Jobs by Section - Tabular Format */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1e3a5f]">Latest Sarkari Jobs 2026</h2>
              <p className="text-gray-500 text-sm mt-1">Government job notifications organized by category</p>
            </div>
            <Link href="/jobs" className="text-sm bg-[#1e3a5f] text-white px-4 py-2 rounded-lg hover:bg-[#153060] transition-colors font-medium">
              All Jobs &rarr;
            </Link>
          </div>

          {/* 2x2 Grid of Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sections.slice(0,2).map(({ name, jobs, color }) => (
              <JobTable key={name} section={name} jobs={jobs} color={color} />
            ))}
            <div className="col-span-1 lg:col-span-2">
              <AdsenseUnit placement="home-between-sections" className="w-full" />
            </div>
            {sections.slice(2).map(({ name, jobs, color }) => (
              <JobTable key={name} section={name} jobs={jobs} color={color} />
            ))}
          </div>
        </section>

        {/* Government Schemes Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1e3a5f]">Government Yojana</h2>
              <p className="text-gray-500 text-sm mt-1">Central &amp; state government welfare schemes</p>
            </div>
            <Link href="/yojana" className="text-sm bg-[#1e3a5f] text-white px-4 py-2 rounded-lg hover:bg-[#153060] transition-colors font-medium">
              All Yojana &rarr;
            </Link>
          </div>
          {schemes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {schemes.map(s => <SchemeCard key={s._id || s.slug} scheme={s} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">No schemes available right now.</div>
          )}
        </section>

        {/* Blog Section */}
        {blogs.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1e3a5f]">Our Informational Blogs</h2>
                <p className="text-gray-500 text-sm mt-1">Tips, guides and government updates</p>
              </div>
              <Link href="/blog" className="text-sm bg-[#1e3a5f] text-white px-4 py-2 rounded-lg hover:bg-[#153060] transition-colors font-medium">
                View All &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {blogs.map(b => <BlogCard key={b._id || b.slug} blog={b} />)}
            </div>
          </section>
        )}

        {/* Browse by Category */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-[#1e3a5f] mb-6 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { name: 'Results', icon: '📋', href: '/jobs?section=Results' },
              { name: 'Admit Card', icon: '🪪', href: '/jobs?section=Recent+Admit+Cards' },
              { name: 'Gov Jobs', icon: '📣', href: '/jobs?section=Latest+Gov+Jobs' },
              { name: 'Admission', icon: '🎓', href: '/jobs?section=Admission' },
              { name: 'Banking', icon: '🏦', href: '/jobs?category=Banking' },
              { name: 'Railway', icon: '🚂', href: '/jobs?category=Railway' },
              { name: 'Defence', icon: '🛡️', href: '/jobs?category=Defence' },
              { name: 'Teaching', icon: '🎓', href: '/jobs?category=Teaching' },
              { name: 'Police', icon: '👮', href: '/jobs?category=Police' },
              { name: 'Bihar Yojana', icon: '🌿', href: '/yojana?state=Bihar' },
              { name: 'UP Yojana', icon: '🌿', href: '/yojana?state=Uttar+Pradesh' },
              { name: 'Yojana', icon: '🏛️', href: '/yojana' },
            ].map(cat => (
              <Link key={cat.name} href={cat.href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all text-center">
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-700">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
