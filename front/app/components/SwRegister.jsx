'use client'

import { useEffect } from 'react'

export default function SwRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // Check for updates every hour
          setInterval(() => reg.update(), 60 * 60 * 1000)
        })
        .catch((err) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[SW] Registration failed:', err)
          }
        })
    })
  }, [])

  return null
}
