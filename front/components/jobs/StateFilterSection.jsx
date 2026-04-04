'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'

// Home-page design tokens
const T = {
  ink:    '#1c1c1c',
  faint:  '#9c8f7a',
  muted:  '#6b6355',
  rule:   '#e8e3d8',
  bg:     '#faf8f4',
  white:  '#ffffff',
  green:  '#15803d',
  greenL: '#f0fdf4',
}
const serif = "'Lora', Georgia, serif"
const sans  = "'DM Sans', system-ui, sans-serif"

function StateSelect({ states, statesLoading, value, onChange, accent }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        padding: '3px 8px',
        border: `1px solid ${accent}60`,
        borderRadius: 6,
        fontSize: 11,
        fontFamily: sans,
        background: value ? `${accent}12` : T.white,
        color: value ? accent : T.muted,
        fontWeight: value ? 700 : 400,
        cursor: 'pointer',
        outline: 'none',
        maxWidth: 130,
      }}
    >
      <option value="">{statesLoading ? 'Loading…' : 'All States'}</option>
      {states.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}

/**
 * StateFilterSection
 *
 * Drop-in replacement for SectionBlock (home) / SectionCard (jobs).
 * Fetches /api/post/states on mount and re-queries /api/post/filter
 * whenever the user picks a state.
 *
 * Props:
 *   initialJobs   – server-fetched jobs array
 *   sectionName   – e.g. "Results", "Latest Gov Jobs"
 *   meta          – { icon, accent, accentL|accentLight, accentText }
 *   viewAllHref   – URL for the "View All →" link
 *   total         – total job count (shown in jobs variant header)
 *   limit         – jobs per page  (10 for home, 20 for jobs)
 *   variant       – 'home' | 'jobs'
 */
export default function StateFilterSection({
  initialJobs = [],
  sectionName,
  meta,
  viewAllHref,
  total: initialTotal = 0,
  limit = 10,
  variant = 'home',
}) {
  const [states,        setStates]        = useState([])
  const [statesLoading, setStatesLoading] = useState(true)
  const [selState,      setSelState]      = useState('')
  const [jobs,          setJobs]          = useState(initialJobs)
  const [loading,       setLoading]       = useState(false)
  const [total,         setTotal]         = useState(initialTotal)
  const abortRef = React.useRef(null)

  // fetch state list once on mount
  useEffect(() => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000) // 8s timeout
    fetch(`${API_BASE}/post/states`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => {
        setStates((d.data || []).filter(Boolean).sort())
        setStatesLoading(false)
      })
      .catch(() => setStatesLoading(false))
      .finally(() => clearTimeout(timer))
  }, [])

  function handleStateChange(e) {
    const state = e.target.value
    setSelState(state)

    // cancel any in-flight filter request
    if (abortRef.current) abortRef.current.abort()

    if (!state) {
      setJobs(initialJobs)
      setTotal(initialTotal)
      setLoading(false)
      return
    }

    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    const params = new URLSearchParams({ state, sectionName, limit: String(limit) })
    fetch(`${API_BASE}/post/filter?${params}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => {
        setJobs(d.data || [])
        setTotal(d.total || 0)
        setLoading(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') setLoading(false)
      })
  }

  const accentBg = meta.accentL || meta.accentLight || '#f5f5f5'

  /* ── JOBS VARIANT (jobs/page.js) ──────────────────────────────────────── */
  if (variant === 'jobs') {
    return (
      <div style={{
        background: '#fff',
        border: '1px solid #e8e3d8',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}>
        {/* Card header */}
        <div style={{
          background: accentBg,
          borderBottom: `2px solid ${meta.accent}`,
          padding: '13px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: meta.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>
              {meta.icon}
            </div>
            <div>
              <div style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: 15, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.2,
              }}>
                {sectionName}
              </div>
              <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#9c8f7a', marginTop: 1 }}>
                {loading ? 'Loading…' : `${total} posts available`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <StateSelect
              states={states}
              statesLoading={statesLoading}
              value={selState}
              onChange={handleStateChange}
              accent={meta.accent}
            />
            <Link
              href={viewAllHref}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 12px', borderRadius: 20,
                border: `1px solid ${meta.accent}`,
                background: 'transparent', color: meta.accent,
                fontFamily: 'sans-serif', fontSize: 11, fontWeight: 700,
                textDecoration: 'none', letterSpacing: '0.03em',
                transition: 'all .15s',
              }}
              className="hover:opacity-80"
            >
              View All →
            </Link>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#faf8f4' }}>
                <th style={{ padding: '8px 16px', textAlign: 'left', fontFamily: 'sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9c8f7a', width: '58%' }}>
                  Post Name
                </th>
                <th style={{ padding: '8px 16px', textAlign: 'center', fontFamily: 'sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9c8f7a' }} className="hidden sm:table-cell">
                  Last Date
                </th>
                <th style={{ padding: '8px 16px', textAlign: 'center', fontFamily: 'sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9c8f7a' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} style={{ padding: '28px 16px', textAlign: 'center', fontFamily: 'sans-serif', fontSize: 12, color: '#c6bfb4', fontStyle: 'italic' }}>Loading…</td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: '28px 16px', textAlign: 'center', fontFamily: 'sans-serif', fontSize: 12, color: '#c6bfb4', fontStyle: 'italic' }}>No posts available</td></tr>
              ) : jobs.map((job, i) => {
                const lastDate = job.applyLastDate
                  ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—'
                return (
                  <tr key={job._id || i} style={{ borderBottom: '1px solid #f1f0eb' }}>
                    <td style={{ padding: '11px 16px', verticalAlign: 'middle' }}>
                      <Link href={`/jobs/${job.slug}`} style={{
                        color: meta.accentText,
                        fontFamily: "'Lora', Georgia, serif",
                        fontSize: 13.5, fontWeight: 500, lineHeight: 1.5,
                        textDecoration: 'none',
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }} className="hover:underline">
                        {job.title}
                      </Link>
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'center', fontFamily: 'sans-serif', fontSize: 11.5, color: '#9c8f7a', whiteSpace: 'nowrap', verticalAlign: 'middle' }} className="hidden sm:table-cell">
                      {lastDate}
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                        fontSize: 10.5, fontWeight: 700, fontFamily: 'sans-serif', letterSpacing: '0.04em',
                        background: job.isActive ? '#f0fdf4' : '#fef2f2',
                        color: job.isActive ? '#15803d' : '#b91c1c',
                        border: `1px solid ${job.isActive ? '#bbf7d0' : '#fecaca'}`,
                      }}>
                        {job.isActive ? 'Active' : 'Closed'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  /* ── HOME VARIANT (app/page.js) ───────────────────────────────────────── */
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.rule}`,
      borderTop: `3px solid ${meta.accent}`,
      borderRadius: 8,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {/* header */}
      <div style={{
        padding: '11px 16px',
        borderBottom: `1px solid ${T.rule}`,
        background: accentBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: meta.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>
            {meta.icon}
          </div>
          <span style={{ fontFamily: serif, fontSize: 14, fontWeight: 600, color: T.ink }}>
            {sectionName}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <StateSelect
            states={states}
            statesLoading={statesLoading}
            value={selState}
            onChange={handleStateChange}
            accent={meta.accent}
          />
          <Link href={viewAllHref} style={{
            fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
            color: meta.accent, textDecoration: 'none',
            padding: '3px 10px', borderRadius: 20,
            border: `1px solid ${meta.accent}`,
          }}>
            View All →
          </Link>
        </div>
      </div>

      {/* table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: T.bg }}>
            <th style={{ padding: '7px 14px', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.faint, textAlign: 'left', borderBottom: `1px solid ${T.rule}` }}>
              Post Name
            </th>
            <th style={{ padding: '7px 14px', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.faint, textAlign: 'center', borderBottom: `1px solid ${T.rule}` }} className="hidden sm:table-cell">
              Last Date
            </th>
            <th style={{ padding: '7px 14px', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.faint, textAlign: 'center', borderBottom: `1px solid ${T.rule}` }}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', fontFamily: sans, fontSize: 12, color: T.faint, fontStyle: 'italic' }}>Loading…</td></tr>
          ) : jobs.length === 0 ? (
            <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', fontFamily: sans, fontSize: 12, color: T.faint, fontStyle: 'italic' }}>No posts available</td></tr>
          ) : jobs.map((job, i) => {
            const lastDate = job.applyLastDate
              ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—'
            return (
              <tr key={job._id || i} style={{ borderBottom: `1px solid ${T.rule}` }}>
                <td style={{ padding: '9px 14px' }}>
                  <Link href={`/jobs/${job.slug}`} style={{
                    fontFamily: sans, fontSize: 12.5, fontWeight: 500,
                    color: meta.accentText, textDecoration: 'none',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.45,
                  }} className="hover:underline">
                    {job.title}
                  </Link>
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'center', fontFamily: sans, fontSize: 11, color: T.faint, whiteSpace: 'nowrap' }} className="hidden sm:table-cell">
                  {lastDate}
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 9px', borderRadius: 20,
                    fontSize: 10, fontWeight: 700, fontFamily: sans,
                    background: job.isActive ? T.greenL : '#fef2f2',
                    color: job.isActive ? T.green : '#b91c1c',
                    border: `1px solid ${job.isActive ? '#bbf7d0' : '#fecaca'}`,
                  }}>
                    {job.isActive ? 'Active' : 'Closed'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
