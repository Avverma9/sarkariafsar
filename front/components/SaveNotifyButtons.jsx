'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import LoginModal from './LoginModal'
import { getToken, SERVER_BASE } from '@/lib/auth'

export default function SaveNotifyButtons({ postId, postTitle }) {
  const { isLoggedIn, loading } = useAuth()
  const [saved,        setSaved]        = useState(false)
  const [subscribed,   setSubscribed]   = useState(false)
  const [savePending,  setSavePending]  = useState(false)
  const [notifyPending, setNotifyPending] = useState(false)
  const [modal,        setModal]        = useState(null) // 'save' | 'notify' | null
  const [toast,        setToast]        = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load current status when user logs in
  useEffect(() => {
    if (!isLoggedIn || !postId) return
    const token = getToken()
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(`${SERVER_BASE}/api/user/saved`, { headers }).then(r => r.json()),
      fetch(`${SERVER_BASE}/api/notify/status/${postId}`, { headers }).then(r => r.json()),
    ]).then(([savedRes, notifyRes]) => {
      if (savedRes.success) {
        setSaved(savedRes.data?.some(j => j.postId === postId) ?? false)
      }
      if (notifyRes.success) setSubscribed(notifyRes.subscribed)
    }).catch(() => {})
  }, [isLoggedIn, postId])

  const handleSave = useCallback(async () => {
    if (!isLoggedIn) { setModal('save'); return }
    setSavePending(true)
    try {
      const res = await fetch(`${SERVER_BASE}/api/user/save/${postId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (data.success) {
        setSaved(data.saved)
        showToast(data.saved ? '✅ Job saved!' : '🗑️ Removed from saved')
      }
    } catch { showToast('Something went wrong', 'error') }
    setSavePending(false)
  }, [isLoggedIn, postId])

  const handleNotify = useCallback(async () => {
    if (!isLoggedIn) { setModal('notify'); return }
    setNotifyPending(true)
    try {
      const method = subscribed ? 'DELETE' : 'POST'
      const url    = subscribed
        ? `${SERVER_BASE}/api/notify/unsubscribe/${postId}`
        : `${SERVER_BASE}/api/notify/subscribe/${postId}`
      const res  = await fetch(url, { method, headers: { Authorization: `Bearer ${getToken()}` } })
      const data = await res.json()
      if (data.success) {
        setSubscribed(data.subscribed)
        showToast(data.subscribed ? '🔔 Notification enabled!' : '🔕 Notification off')
      }
    } catch { showToast('Something went wrong', 'error') }
    setNotifyPending(false)
  }, [isLoggedIn, postId, subscribed])

  if (loading) return null

  return (
    <>
      {modal && (
        <LoginModal
          onClose={() => setModal(null)}
          message={modal === 'notify'
            ? 'Job की latest updates के लिए notification enable करने के लिए login करें'
            : 'Job save करने के लिए login करें'}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex gap-3 flex-wrap mb-4">
        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={savePending}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            saved
              ? 'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {savePending ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>{saved ? '🔖' : '🔖'}</span>
          )}
          {saved ? 'Saved' : 'Save Job'}
        </button>

        {/* Notify button */}
        <button
          onClick={handleNotify}
          disabled={notifyPending}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            subscribed
              ? 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {notifyPending ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>{subscribed ? '🔔' : '🔕'}</span>
          )}
          {subscribed ? 'Notified' : 'Get Notified'}
        </button>
      </div>
    </>
  )
}
