'use client'

import { useAuth } from '@/context/AuthContext'

export default function LoginModal({ onClose, message = 'इस feature को use करने के लिए login करें' }) {
  const { loginWithGoogle } = useAuth()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold leading-none"
          aria-label="Close"
        >
          ×
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#1e3a5f] text-white text-sm font-bold">SA</span>
          <span className="font-bold text-lg text-[#1e3a5f]">Sarkari<span className="text-[#f59e0b]">Afsar</span></span>
        </div>

        <h2 className="text-xl font-extrabold text-gray-900 mb-1">Login करें</h2>
        <p className="text-sm text-gray-500 mb-6">{message}</p>

        {/* Google Sign In Button */}
        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl px-5 py-3 font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M43.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11c-.5 2.5-1.9 4.6-4 6v5h6.5c3.8-3.5 6.1-8.7 6.1-15z" fill="#4285F4"/>
            <path d="M24 44c5.4 0 10-1.8 13.3-4.9l-6.5-5c-1.8 1.2-4.1 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.3H5v5.2C8.3 39.1 15.6 44 24 44z" fill="#34A853"/>
            <path d="M12.8 27.7c-.4-1.2-.6-2.5-.6-3.7 0-1.3.2-2.5.6-3.7V15H5c-1.3 2.6-2 5.5-2 8.5s.7 5.9 2 8.5l7.8-6z" fill="#FBBC05"/>
            <path d="M24 10.7c2.9 0 5.5 1 7.6 3l5.7-5.7C33.9 4.8 29.4 3 24 3c-8.4 0-15.7 4.9-19 12l7.8 6.1c1.6-4.8 6-8.4 11.2-8.4z" fill="#EA4335"/>
          </svg>
          Google से Sign In करें
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Sign in करके आप हमारी <a href="/privacy-policy" className="underline">Privacy Policy</a> से सहमत हैं
        </p>
      </div>
    </div>
  )
}
