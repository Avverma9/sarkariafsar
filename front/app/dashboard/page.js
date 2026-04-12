'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getToken, SERVER_BASE } from '@/lib/auth'
import LoginModal from '@/components/LoginModal'

function authFetch(path) {
  return fetch(`${SERVER_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  }).then(r => r.json())
}

function DashboardContent() {
  const { user, isLoggedIn, loading, logout } = useAuth()
  const router      = useRouter()
  const params      = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') || 'saved')

  const [savedJobs,  setSavedJobs]  = useState([])
  const [notifs,     setNotifs]     = useState([])
  const [mockHist,   setMockHist]   = useState([])
  const [fetching,   setFetching]   = useState(false)
  const [showLogin,  setShowLogin]  = useState(false)

  useEffect(() => {
    if (!loading && !isLoggedIn) setShowLogin(true)
  }, [loading, isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) return
    setFetching(true)
    Promise.all([
      authFetch('/api/user/saved'),
      authFetch('/api/notify/my'),
      authFetch('/api/user/mock-history'),
    ]).then(([s, n, m]) => {
      setSavedJobs(s.data || [])
      setNotifs(n.data || [])
      setMockHist(m.data || [])
      setFetching(false)
    }).catch(() => setFetching(false))
  }, [isLoggedIn])

  async function unsaveJob(postId) {
    await fetch(`${SERVER_BASE}/api/user/save/${postId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    setSavedJobs(prev => prev.filter(j => j.postId !== postId))
  }

  async function unsubscribeNotif(postId) {
    await fetch(`${SERVER_BASE}/api/notify/unsubscribe/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    setNotifs(prev => prev.filter(n => n.postId !== postId))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <>
        {showLogin && (
          <LoginModal
            onClose={() => router.push('/')}
            message="Dashboard access करने के लिए login करें"
          />
        )}
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Please login to continue
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover border-2 border-amber-400" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-amber-400 flex items-center justify-center text-2xl font-bold text-white">
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="text-blue-200 text-sm">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="ml-auto text-xs bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg font-semibold transition"
            >
              Logout
            </button>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Saved Jobs',    value: savedJobs.length,  icon: '🔖' },
              { label: 'Notifications', value: notifs.length,     icon: '🔔' },
              { label: 'Mock Tests',    value: mockHist.length,   icon: '📝' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-blue-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-1 border-b border-gray-200 mt-0 bg-white sticky top-16 z-10">
          {[
            { key: 'saved',         label: '🔖 Saved Jobs' },
            { key: 'notifications', label: '🔔 Notifications' },
            { key: 'mock',          label: '📝 Mock Tests' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="py-5">
          {fetching ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Saved Jobs Tab */}
              {tab === 'saved' && (
                <div>
                  {savedJobs.length === 0 ? (
                    <EmptyState icon="🔖" msg="कोई job save नहीं है। Job detail page पर 'Save Job' button दबाएं।" />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {savedJobs.map((j, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <Link href={`/jobs/${j.slug}`} className="font-bold text-gray-900 hover:text-blue-700 text-sm leading-tight line-clamp-2">
                              {j.title || j.slug}
                            </Link>
                            <p className="text-xs text-gray-400 mt-1">
                              Saved {new Date(j.savedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Link href={`/jobs/${j.slug}`} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 rounded-lg transition">
                              View
                            </Link>
                            <button
                              onClick={() => unsaveJob(j.postId)}
                              className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-1.5 rounded-lg transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {tab === 'notifications' && (
                <div>
                  {notifs.length === 0 ? (
                    <EmptyState icon="🔔" msg="आपने किसी job के लिए notification enable नहीं की। Job page पर 'Get Notified' दबाएं।" />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {notifs.map((n, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm line-clamp-2">{n.postTitle || n.slug}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Since {new Date(n.subscribedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {n.lastNotifiedAt && ` · Last alert: ${new Date(n.lastNotifiedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Link href={`/jobs/${n.slug}`} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 rounded-lg transition">
                              View
                            </Link>
                            <button
                              onClick={() => unsubscribeNotif(n.postId)}
                              className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-1.5 rounded-lg transition"
                            >
                              Turn Off
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mock Test Tab */}
              {tab === 'mock' && (
                <div>
                  {mockHist.length === 0 ? (
                    <EmptyState icon="📝" msg="आपने अभी तक कोई mock test नहीं दिया।" />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {mockHist.map((m, i) => {
                        const pct = m.totalQ ? Math.round((m.score / m.totalQ) * 100) : 0
                        return (
                          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-bold text-gray-900 text-sm">{m.testTitle || 'Mock Test'}</p>
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${pct >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                {pct}%
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Score: <strong className="text-gray-800">{m.score}/{m.totalQ}</strong></span>
                              {m.timeTakenSec > 0 && <span>Time: <strong className="text-gray-800">{Math.round(m.timeTakenSec / 60)} min</strong></span>}
                              <span>{new Date(m.takenAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct >= 60 ? 'bg-green-500' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, msg }) {
  return (
    <div className="text-center py-14">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-gray-500 text-sm max-w-xs mx-auto">{msg}</p>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
