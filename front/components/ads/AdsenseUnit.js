'use client'
import { useEffect, useRef, useState } from 'react'

export default function AdsenseUnit({ placement, className = '' }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-5390089359360512'
  const slot = '7294493703'

  return (
    <ClientAd
      client={client}
      slot={slot}
      placement={placement}
      className={className}
    />
  )
}

function ClientAd({ client, slot, placement, className }) {
  const containerRef = useRef(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    const el = containerRef.current
    if (!el) return

    // Only push ad when element is within 200px of viewport
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !initialized.current) {
          initialized.current = true
          observer.disconnect()
          try {
            window.adsbygoogle = window.adsbygoogle || []
            window.adsbygoogle.push({})
          } catch (e) {
            // silent
          }
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      data-ad-placement={placement}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-layout="in-article"
        data-ad-format="fluid"
      />
    </div>
  )
}
