'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't already responded
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // Private browsing — show anyway but don't persist
      setVisible(true);
    }
  }, []);

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch { /* noop */ }
    setVisible(false);
  }

  function decline() {
    try { localStorage.setItem(STORAGE_KEY, 'declined'); } catch { /* noop */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-2xl"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-slate-600">
          <span className="text-lg mr-2">🍪</span>
          We use cookies to improve your experience and show relevant ads. By clicking{' '}
          <strong>&quot;Accept All&quot;</strong>, you agree to our use of cookies.{' '}
          <Link href="/cookie-policy" className="text-violet-700 underline hover:text-violet-900">
            Cookie Policy
          </Link>
          {' | '}
          <Link href="/privacy-policy" className="text-violet-700 underline hover:text-violet-900">
            Privacy Policy
          </Link>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={decline}
            className="text-sm text-slate-500 hover:text-slate-700 border border-slate-300 px-4 py-2 rounded-lg transition"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="text-sm bg-violet-700 text-white font-semibold px-5 py-2 rounded-lg hover:bg-violet-800 transition"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
