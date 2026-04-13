'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'

const TYPE_META = {
  book:     { label: 'Book',     color: 'bg-blue-100 text-blue-700',   icon: '📚' },
  pyq:      { label: 'PYQ',      color: 'bg-purple-100 text-purple-700', icon: '📄' },
  notes:    { label: 'Notes',    color: 'bg-green-100 text-green-700',  icon: '🗒️' },
  syllabus: { label: 'Syllabus', color: 'bg-orange-100 text-orange-700', icon: '📋' },
  video:    { label: 'Video',    color: 'bg-red-100 text-red-700',     icon: '🎥' },
  other:    { label: 'Other',    color: 'bg-gray-100 text-gray-600',   icon: '📦' },
}

const CATEGORIES = [
  { label: 'All',      value: '' },
  { label: '📚 Books',  value: 'book' },
  { label: '📄 PYQ',    value: 'pyq' },
  { label: '🗒️ Notes',  value: 'notes' },
  { label: '📋 Syllabus', value: 'syllabus' },
  { label: '🎥 Video',  value: 'video' },
]

export default function BooksClient({ resources }) {
  const [typeFilter, setTypeFilter] = useState('')
  const [authorityFilter, setAuthorityFilter] = useState('')
  const [pricingFilter, setPricingFilter] = useState('')
  const [search, setSearch] = useState('')

  const authorities = useMemo(() => {
    const set = new Set(resources.map(r => r.authorityKey).filter(Boolean))
    return Array.from(set).sort()
  }, [resources])

  const filtered = useMemo(() => {
    return resources.filter(r => {
      if (typeFilter && r.type !== typeFilter) return false
      if (authorityFilter && r.authorityKey !== authorityFilter) return false
      if (pricingFilter === 'free' && !r.isFree) return false
      if (pricingFilter === 'paid' && r.isFree) return false
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [resources, typeFilter, authorityFilter, pricingFilter, search])

  const getPrice = (r) => r.discountedPrice ?? r.price ?? 0
  const getDiscount = (r) => r.price && r.discountedPrice
    ? Math.round(((r.price - r.discountedPrice) / r.price) * 100) : 0
  const getLink = (r) => r.fileUrl || r.url || '#'
  const getSampleUrl = (r) => `${API}/resources/${r._id}/sample`
  const hasSample = (r) => (r.samplePages ?? 5) > 0 && r.fileUrl

  return (
    <div>
      {/* Search + filters */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto space-y-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search books, notes, PYQs…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1e3a5f] transition-colors" />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setTypeFilter(c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${typeFilter === c.value ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]'}`}>
                {c.label}
              </button>
            ))}
            <span className="w-px bg-gray-200 mx-1" />
            <button onClick={() => setPricingFilter(pricingFilter === 'free' ? '' : 'free')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${pricingFilter === 'free' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-500'}`}>
              ✅ Free
            </button>
            <button onClick={() => setPricingFilter(pricingFilter === 'paid' ? '' : 'paid')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${pricingFilter === 'paid' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400'}`}>
              💰 Paid
            </button>
            {authorities.length > 0 && (
              <select value={authorityFilter} onChange={e => setAuthorityFilter(e.target.value)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 bg-white text-gray-600 outline-none cursor-pointer">
                <option value="">🏛️ All Authorities</option>
                {authorities.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">📭</p>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No resources found</h3>
            <p className="text-gray-400 text-sm">Try changing filters or check back later for new uploads.</p>
            <button onClick={() => { setTypeFilter(''); setAuthorityFilter(''); setPricingFilter(''); setSearch('') }}
              className="mt-5 text-[#1e3a5f] text-sm font-semibold hover:underline">Clear all filters</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-5">{filtered.length} resource{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(r => {
                const tm = TYPE_META[r.type] || TYPE_META.other
                const price = getPrice(r)
                const discount = getDiscount(r)
                const link = getLink(r)
                return (
                  <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 h-36 flex items-center justify-center relative">
                      <span className="text-5xl">{tm.icon}</span>
                      <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full ${tm.color}`}>{tm.label}</span>
                      {r.isFree
                        ? <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">FREE</span>
                        : discount > 0 && <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{discount}% OFF</span>}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      {r.authorityKey && <p className="text-xs text-blue-600 font-medium mb-1 uppercase">{r.authorityKey}</p>}
                      <h3 className="font-bold text-[#1e3a5f] text-base leading-tight mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">{r.title}</h3>
                      {r.description && <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-4 line-clamp-2">{r.description}</p>}

                      <div className="mt-auto space-y-2">
                        {r.isFree ? (
                          <a href={link} target="_blank" rel="noopener noreferrer"
                            className="block w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors text-center">
                            📥 Download Free
                          </a>
                        ) : (
                          <>
                            <div className="flex items-end gap-2 mb-1">
                              <span className="text-2xl font-bold text-[#1e3a5f]">₹{price}</span>
                              {r.price && r.discountedPrice && (
                                <span className="text-sm text-gray-400 line-through mb-0.5">₹{r.price}</span>
                              )}
                            </div>

                            {hasSample(r) && (
                              <a href={getSampleUrl(r)} target="_blank" rel="noopener noreferrer"
                                className="block w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold py-2.5 rounded-xl transition-colors text-center border border-blue-200">
                                📖 Read Sample ({r.samplePages ?? 5} pages)
                              </a>
                            )}

                            <Link href={`/books/${r._id}/buy`}
                              className="block w-full bg-[#1e3a5f] hover:bg-[#1d4ed8] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors text-center">
                              🔓 Buy Now — ₹{price}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="mt-12 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-8 text-center">
          <p className="text-3xl mb-3">🚀</p>
          <h2 className="text-xl font-bold text-amber-800 mb-2">More Resources Coming Soon</h2>
          <p className="text-amber-700 text-sm max-w-md mx-auto">We continuously add more books, video courses and study material. Stay tuned!</p>
          <Link href="/blog" className="inline-block mt-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
            Read Exam Tips on Blog →
          </Link>
        </div>
      </div>
    </div>
  )
}
