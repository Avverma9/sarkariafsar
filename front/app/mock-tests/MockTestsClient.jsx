'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'

const DIFF_META = {
  easy:   { label: 'Easy',   color: 'text-green-700 bg-green-50',  icon: '🟢' },
  medium: { label: 'Medium', color: 'text-amber-700 bg-amber-50',  icon: '🟡' },
  hard:   { label: 'Hard',   color: 'text-red-700 bg-red-50',     icon: '🔴' },
  mixed:  { label: 'Mixed',  color: 'text-indigo-700 bg-indigo-50', icon: '🔀' },
}

const DIFF_FILTERS = [
  { label: 'All Levels', value: '' },
  { label: '🟢 Easy',    value: 'easy' },
  { label: '🟡 Medium',  value: 'medium' },
  { label: '🔴 Hard',    value: 'hard' },
  { label: '🔀 Mixed',   value: 'mixed' },
]

export default function MockTestsClient({ tests }) {
  const [diffFilter, setDiffFilter] = useState('')
  const [authorityFilter, setAuthorityFilter] = useState('')
  const [pricingFilter, setPricingFilter] = useState('')
  const [search, setSearch] = useState('')

  const authorities = useMemo(() => {
    const set = new Set(tests.map(t => t.authorityKey).filter(Boolean))
    return Array.from(set).sort()
  }, [tests])

  const filtered = useMemo(() => {
    return tests.filter(t => {
      if (diffFilter && t.difficulty !== diffFilter) return false
      if (authorityFilter && t.authorityKey !== authorityFilter) return false
      if (pricingFilter === 'free' && !t.isFree) return false
      if (pricingFilter === 'paid' && t.isFree) return false
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [tests, diffFilter, authorityFilter, pricingFilter, search])

  const freeCount = tests.filter(t => t.isFree).length

  return (
    <div>
      {/* Stats bar */}
      <div className="bg-white border-b border-gray-100 py-5 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: `${tests.length}+`, label: 'Tests Available', icon: '📝' },
            { value: `${freeCount}`, label: 'Free Tests', icon: '✅' },
            { value: `${tests.length - freeCount}`, label: 'Premium Tests', icon: '⭐' },
            { value: '15+', label: 'Exams Covered', icon: '🏆' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="font-bold text-[#1e3a5f] text-lg leading-none">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto space-y-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search mock tests…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#7c3aed] transition-colors" />
          <div className="flex flex-wrap gap-2">
            {DIFF_FILTERS.map(f => (
              <button key={f.value} onClick={() => setDiffFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${diffFilter === f.value ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]'}`}>
                {f.label}
              </button>
            ))}
            <span className="w-px bg-gray-200 mx-1" />
            <button onClick={() => setPricingFilter(pricingFilter === 'free' ? '' : 'free')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${pricingFilter === 'free' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-500'}`}>
              ✅ Free Only
            </button>
            <button onClick={() => setPricingFilter(pricingFilter === 'paid' ? '' : 'paid')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${pricingFilter === 'paid' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400'}`}>
              💰 Premium
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
            <h3 className="text-xl font-bold text-gray-700 mb-2">No tests found</h3>
            <p className="text-gray-400 text-sm">Try changing filters or check back soon for new tests.</p>
            <button onClick={() => { setDiffFilter(''); setAuthorityFilter(''); setPricingFilter(''); setSearch('') }}
              className="mt-5 text-[#7c3aed] text-sm font-semibold hover:underline">Clear all filters</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-5">{filtered.length} test{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(test => {
                const diff = DIFF_META[test.difficulty] || DIFF_META.mixed
                const price = test.discountedPrice ?? test.price ?? 0
                return (
                  <div key={test._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
                    <div className="bg-gradient-to-r from-[#1e3a5f] to-[#1d4ed8] p-5 relative">
                      <div className="flex items-start justify-between">
                        <span className="text-4xl">📝</span>
                        <div className="flex flex-col items-end gap-1.5">
                          {test.isFree
                            ? <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">FREE</span>
                            : <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">₹{price}</span>}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diff.color}`}>{diff.icon} {diff.label}</span>
                        </div>
                      </div>
                      {test.authorityKey && <p className="text-xs text-blue-300 mt-3 font-medium uppercase">{test.authorityKey}</p>}
                      <h3 className="font-bold text-white text-base leading-snug mt-1 group-hover:text-[#f59e0b] transition-colors line-clamp-2">{test.title}</h3>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-base font-bold text-[#1e3a5f]">{test.totalQuestions || 0}</p>
                          <p className="text-xs text-gray-400">Questions</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-base font-bold text-[#1e3a5f]">{test.durationMin}</p>
                          <p className="text-xs text-gray-400">Minutes</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-base font-bold text-[#1e3a5f]">{test.examYear || '—'}</p>
                          <p className="text-xs text-gray-400">Year</p>
                        </div>
                      </div>

                      {test.examStage && (
                        <div className="mb-4">
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{test.examStage}</span>
                        </div>
                      )}

                      <div className="mt-auto">
                        {test.isFree ? (
                          <Link href={`/mock-tests/${test._id}`}
                            className="block w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors text-center">
                            ▶ Start Free Test
                          </Link>
                        ) : (
                          <div className="space-y-2">
                            <Link href="/dashboard"
                              className="block w-full bg-[#1e3a5f] hover:bg-[#1d4ed8] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors text-center">
                              Unlock — ₹{price}
                            </Link>
                            {test.price && test.discountedPrice && (
                              <p className="text-center text-xs text-gray-400">
                                <span className="line-through">₹{test.price}</span>
                                <span className="text-green-600 font-semibold ml-1">{Math.round(((test.price - test.discountedPrice)/test.price)*100)}% off</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="mt-12 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-8 text-center">
          <p className="text-3xl mb-3">🎯</p>
          <h2 className="text-xl font-bold text-purple-800 mb-2">More Mock Tests Being Added</h2>
          <p className="text-purple-700 text-sm max-w-lg mx-auto">Full test series for UPSC, State PSC, Defence, Police and more exams are coming soon. Create a free account to get notified.</p>
          <div className="flex flex-wrap gap-3 justify-center mt-5">
            <Link href="/dashboard" className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
              Create Free Account
            </Link>
            <Link href="/jobs" className="bg-white border border-purple-200 hover:border-purple-400 text-purple-700 text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
              Browse Jobs →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
