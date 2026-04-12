'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import LoginModal from './LoginModal'

export default function HeaderUserNav({ compact = false }) {
  const { user, loading, isLoggedIn, logout, loginWithGoogle } = useAuth()
  const [showModal,    setShowModal]    = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  if (loading) return null

  if (!isLoggedIn) {
    return (
      <>
        {showModal && <LoginModal onClose={() => setShowModal(false)} />}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
          {compact ? '' : 'Login'}
        </button>
      </>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(v => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-blue-800 transition-colors"
        aria-haspopup="true"
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="w-7 h-7 rounded-full bg-[#f59e0b] flex items-center justify-center text-white text-xs font-bold">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </span>
        )}
        {!compact && (
          <span className="text-xs font-semibold text-white max-w-[80px] truncate">{user.name?.split(' ')[0]}</span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100 mb-1">
              <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setShowDropdown(false)}>
              <span>📋</span> My Dashboard
            </Link>
            <Link href="/dashboard?tab=saved" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setShowDropdown(false)}>
              <span>🔖</span> Saved Jobs
            </Link>
            <Link href="/dashboard?tab=notifications" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setShowDropdown(false)}>
              <span>🔔</span> My Alerts
            </Link>
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => { logout(); setShowDropdown(false) }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <span>🚪</span> Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
