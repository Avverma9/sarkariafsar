'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
// AdsenseUnit is imported directly - 'use client' parent handles hydration
import AdsenseUnit from '@/components/ads/AdsenseUnit'

const API_BASE = 'https://sarkariafsar.com/api'

const SECTION_COLORS = {
  'Results': 'bg-green-100 text-green-700',
  'Admit Card': 'bg-blue-100 text-blue-700',
  'Recruitment': 'bg-purple-100 text-purple-700',
  'Answer Key': 'bg-orange-100 text-orange-700',
  'Syllabus': 'bg-teal-100 text-teal-700',
  'General': 'bg-gray-100 text-gray-700',
}

function JobCard({ job }) {
  const badgeColor = SECTION_COLORS[job.sectionName] || 'bg-gray-100 text-gray-700'
  const date = job.applyLastDate ? new Date(job.applyLastDate).toLocaleDateString('en-IN') : null
  return (
    <Link href={`/jobs/${job.slug}`} className="block group">
      <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-[#1e3a5f]/20 transition-all duration-200 h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor} shrink-0`}>
            {job.sectionName || 'General'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
            {job.isActive ? 'Active' : 'Closed'}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-[#1e3a5f] transition-colors flex-1 line-clamp-3">
          {job.title}
        </h3>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">{job.category || 'Government'}</span>
          {date && <span className="text-xs text-red-500 font-medium">Last: {date}</span>}
        </div>
      </div>
    </Link>
  )
}

export default function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [section, setSection] = useState('')
  const [search, setSearch] = useState('')
  const [inputVal, setInputVal] = useState('')
  const LIMIT = 12

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      let url = `${API_BASE}/post/?page=${page}&limit=${LIMIT}`
      if (section) url += `&sectionName=${encodeURIComponent(section)}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      const res = await fetch(url)
      const data = await res.json()
      setJobs(data?.data || [])
      setTotal(data?.total || data?.data?.length || 0)
    } catch { setJobs([]) }
    setLoading(false)
  }, [page, section, search])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const SECTIONS = ['All', 'Results', 'Admit Card', 'Recruitment', 'Answer Key', 'Syllabus']

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-[#1e3a5f] text-white py-10 px-4">
        <div className="container mx-auto">
          <nav className="text-sm text-blue-300 mb-3">
            <Link href="/" className="hover:text-white">Home</Link> &rsaquo; <span className="text-white">Jobs</span>
          </nav>
          <h1 className="text-3xl font-bold">Latest Sarkari Jobs</h1>
          <p className="text-blue-200 mt-2">Government job notifications, results, admit cards and more</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search + Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-1">
              <input
                type="text"
                placeholder="Search jobs..."
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setSearch(inputVal); setPage(1) } }}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
              />
              <button
                onClick={() => { setSearch(inputVal); setPage(1) }}
                className="bg-[#1e3a5f] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#153060] transition-colors"
              >
                Search
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {SECTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setSection(s === 'All' ? '' : s); setPage(1) }}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  (s === 'All' && !section) || section === s
                    ? 'bg-[#1e3a5f] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-32">
                <div className="h-3 bg-gray-200 rounded mb-2 w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {jobs.map((job, idx) => (
              <>
                <JobCard key={job._id || job.slug} job={job} />
                {/* ===== AD PLACEMENT 4: In-Feed after 6th job card ===== */}
                {idx === 5 && (
                  <div key="ad-infeed" className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                    <AdsenseUnit placement="listing-infeed" className="w-full my-2" />
                  </div>
                )}
              </>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-4">🔍</div>
            <p className="font-medium">No jobs found. Try a different search.</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              &larr; Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i
              if (p < 1 || p > totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    page === p ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >{p}</button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
