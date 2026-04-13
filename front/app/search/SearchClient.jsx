'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.sarkariafsar.com/api'

function SearchResultItem({ item, type }) {
  const href = type === 'job' ? `/jobs/${item.slug}` : type === 'scheme' ? `/yojana/${item.slug}` : `/blog/${item.slug}`
  const title = item.title || item.schemeTitle || item.slug?.replace(/-/g, ' ')
  const desc = item.shortDesc || item.aboutScheme?.slice(0, 120) || item.excerpt?.slice(0, 120) || ''
  const badge = type === 'job' ? { label: item.sectionName || 'Job', color: 'bg-green-100 text-green-700' } :
    type === 'scheme' ? { label: item.schemetype || 'Scheme', color: 'bg-blue-100 text-blue-700' } :
    { label: 'Blog', color: 'bg-purple-100 text-purple-700' }

  return (
    <Link href={href} className="block group">
      <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-[#1e3a5f]/20 transition-all">
        <div className="flex items-start gap-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge.color}`}>{badge.label}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 group-hover:text-[#1e3a5f] transition-colors line-clamp-2 capitalize">{title}</h3>
            {desc && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{desc}</p>}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function SearchClient() {
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQ)
  const [inputVal, setInputVal] = useState(initialQ)
  const [results, setResults] = useState({ jobs: [], schemes: [], blogs: [] })
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const [jobsRes, schemesRes, blogsRes] = await Promise.all([
        fetch(`${API_BASE}/post/?search=${encodeURIComponent(q)}&limit=5`),
        fetch(`${API_BASE}/schemes/?search=${encodeURIComponent(q)}&limit=5`),
        fetch(`${API_BASE}/blog/?search=${encodeURIComponent(q)}&limit=5`),
      ])
      const [jobs, schemes, blogs] = await Promise.all([jobsRes.json(), schemesRes.json(), blogsRes.json()])
      setResults({
        jobs: jobs?.data || [],
        schemes: schemes?.data || [],
        blogs: blogs?.data || [],
      })
    } catch { setResults({ jobs: [], schemes: [], blogs: [] }) }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (initialQ) doSearch(initialQ)
  }, [initialQ, doSearch])

  const totalResults = results.jobs.length + results.schemes.length + results.blogs.length

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-[#1e3a5f] text-white py-10 px-4">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold mb-4"><span aria-hidden="true">🔍</span> Search Sarkari Afsar</h1>
          <form onSubmit={e => { e.preventDefault(); setQuery(inputVal); doSearch(inputVal) }} className="flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Search jobs, schemes, blog posts..."
              className="flex-1 px-5 py-3 rounded-xl text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] text-base"
            />
            <button type="submit" className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-6 py-3 rounded-xl font-semibold transition-colors">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-16">
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && searched && (
          <>
            <p className="text-sm text-gray-500 mb-6">
              Found <strong>{totalResults}</strong> results for &quot;<strong>{query}</strong>&quot;
            </p>
            {totalResults === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-4" aria-hidden="true">🔍</div>
                <p className="font-medium">No results found. Try a different keyword.</p>
              </div>
            )}
            {results.jobs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-base font-bold text-[#1e3a5f] mb-3"><span aria-hidden="true">💼</span> Jobs ({results.jobs.length})</h2>
                <div className="space-y-2">{results.jobs.map(j => <SearchResultItem key={j._id || j.slug} item={j} type="job" />)}</div>
              </div>
            )}
            {results.schemes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-base font-bold text-[#1e3a5f] mb-3"><span aria-hidden="true">🏛️</span> Schemes ({results.schemes.length})</h2>
                <div className="space-y-2">{results.schemes.map(s => <SearchResultItem key={s._id || s.slug} item={s} type="scheme" />)}</div>
              </div>
            )}
            {results.blogs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-base font-bold text-[#1e3a5f] mb-3"><span aria-hidden="true">📝</span> Blog ({results.blogs.length})</h2>
                <div className="space-y-2">{results.blogs.map(b => <SearchResultItem key={b._id || b.slug} item={b} type="blog" />)}</div>
              </div>
            )}
          </>
        )}

        {!loading && !searched && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4" aria-hidden="true">🔍</div>
            <p className="text-base">Type a keyword to search for jobs, schemes, or blog posts.</p>
          </div>
        )}
      </div>
    </div>
  )
}
