'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * AdsenseUnit - Google AdSense Ad Component
 * Client-only rendering to prevent hydration mismatch
 *
 * Placement Strategy:
 * - 'home-below-stats'  : Home page, below stats bar
 * - 'listing-infeed'   : Jobs/Yojana listing, after 6th item
 * - 'detail-inarticle' : Job/Scheme detail, after content
 */
export default function AdsenseUnit({ placement, className = '' }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Never render on server — prevents hydration mismatch
  if (!mounted) {
    return <div className={`${className}`} style={{ minHeight: 90 }} aria-hidden="true" />
  }

  const client = 'ca-pub-5390089359360512'
  const slot = '5781285537'

  return (
    <ClientAd client={client} slot={slot} placement={placement} className={className} />
  )
}

function ClientAd({ client, slot, placement, className }) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    try {
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || []
        window.adsbygoogle.push({})
      }
    } catch (e) {
      // silent
    }
  }, [])

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ minHeight: 90 }}
      data-ad-placement={placement}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
