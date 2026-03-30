'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
// AdsenseUnit is imported directly - 'use client' parent handles hydration
import AdsenseUnit from '@/components/ads/AdsenseUnit'

const API_BASE = 'https://sarkariafsar.com/api'

const INDIAN_STATES = [
  'All States', 'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Delhi', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
]

function SchemeCard({ scheme }) {
  return (
    <Link href={`/yojana/${scheme.slug}`} className="block group">
      <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-[#1e3a5f]/20 transition-all duration-200 h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full line-clamp-1 max-w-[65%]">
            {scheme.schemetype || 'Government Scheme'}
          </span>
          <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full shrink-0">
            {scheme.state?.split('(')[0]?.trim().replace('All States', 'Pan-India') || 'All India'}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-[#1e3a5f] transition-colors flex-1 line-clamp-2 mt-1">
          {scheme.schemeTitle}
        </h3>
        <p className="text-xs text-gray-500 mt-2 line-clamp-2 flex-1">
          {scheme.aboutScheme?.slice(0, 120)}
        </p>
        <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
          <span className="text-xs text-[#1e3a5f] font-medium">View Details</span>
          <span className="text-gray-300 text-xs">&rarr;</span>
        </div>
      </div>
    </Link>
  )
}

export default function YojanaPage() {
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [state, setState] = useState('')
  const [search, setSearch] = useState('')
  const [inputVal, setInputVal] = useState('')
  const LIMIT = 12

  const fetchSchemes = useCallback(async () => {
    setLoading(true)
    try {
      let url = `${API_BASE}/schemes/?page=${page}&limit=${LIMIT}`
      if (state && state !== 'All States') url += `&state=${encodeURIComponent(state)}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      const res = await fetch(url)
      const data = await res.json()
      setSchemes(data?.data || [])
      setTotal(data?.total || data?.data?.length || 0)
    } catch { setSchemes([]) }
    setLoading(false)
  }, [page, state, search])

  useEffect(() => { fetchSchemes() }, [fetchSchemes])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#153060] text-white py-10 px-4">
        <div className="container mx-auto">
          <nav className="text-sm text-blue-300 mb-3">
            <Link href="/" className="hover:text-white">Home</Link> &rsaquo; <span className="text-white">Yojana</span>
          </nav>
          <h1 className="text-3xl font-bold">🏛️ Government Yojana & Schemes</h1>
          <p className="text-blue-200 mt-2">Central & state government welfare schemes for citizens</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="flex gap-2 flex-1">
              <input
                type="text"
                placeholder="Search schemes..."
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
            <select
              value={state}
              onChange={e => { setState(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 bg-white"
            >
              {INDIAN_STATES.map(s => <option key={s} value={s === 'All States' ? '' : s}>{s}</option>)}
            </select>
          </div>
          {/* State pills */}
          <div className="flex flex-wrap gap-2">
            {['Bihar', 'UP', 'Gujarat', 'Jharkhand', 'Maharashtra', 'Rajasthan', 'MP', 'Delhi', 'Punjab'].map(s => (
              <button
                key={s}
                onClick={() => { setState(s); setPage(1) }}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  state === s ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Schemes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-40">
                <div className="h-3 bg-gray-200 rounded mb-3 w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : schemes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {schemes.map((s, idx) => (
              <>
                <SchemeCard key={s._id || s.slug} scheme={s} />
                {/* ===== AD PLACEMENT 5: In-Feed after 6th scheme card ===== */}
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
            <p>No schemes found. Try a different filter.</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition-colors">
              &larr; Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i
              if (p < 1 || p > totalPages) return null
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    page === p ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}>{p}</button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition-colors">
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
