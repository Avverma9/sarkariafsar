'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * AiSummaryBox — fetches a Gemini-generated ~200-word summary for a job post.
 * Calls the internal /api/generate-summary route (server-side keys, never exposed).
 * Silently disappears on failure.
 *
 * Props:
 *   post  — the job object (title, conductingAuthority, totalVacancies, salary,
 *           applyLastDate, category, location, sectionName)
 */
export default function AiSummaryBox({ post }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current || !post?.title) return
    fetched.current = true

    const ctrl = new AbortController()
    ;(async () => {
      try {
        const res = await fetch('/api/generate-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post }),
          signal: ctrl.signal,
        })
        if (!res.ok) return
        const data = await res.json()
        if (data?.summary) setSummary(data.summary)
      } catch {
        // silent fail — box disappears
      } finally {
        setLoading(false)
      }
    })()

    return () => ctrl.abort()
  }, [post])

  // Don't render anything once we know there's no summary
  if (!loading && !summary) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0f6ff 0%, #fafbff 100%)',
      border: '1px solid #c7d9f5',
      borderLeft: '4px solid #2563eb',
      borderRadius: 10,
      padding: '16px 20px',
      marginBottom: 20,
      boxShadow: '0 1px 6px rgba(37,99,235,0.07)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
      }}>
        <span style={{ fontSize: 16 }} aria-hidden="true">✨</span>
        <span style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#2563eb',
        }}>
          AI Overview
        </span>
        <span style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 10,
          color: '#94a3b8',
          marginLeft: 'auto',
          fontStyle: 'italic',
        }}>
          Powered by Gemini
        </span>
      </div>

      {/* Loading shimmer */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[90, 100, 80, 95, 60].map((w, i) => (
            <div key={i} style={{
              height: 13,
              width: `${w}%`,
              borderRadius: 6,
              background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
            }} />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      ) : (
        /* Summary text */
        <div style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 13.5,
          color: '#1e293b',
          lineHeight: 1.75,
        }}>
          {summary.split('\n').filter(p => p.trim()).map((para, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : '10px 0 0' }}>{para}</p>
          ))}
        </div>
      )}
    </div>
  )
}
