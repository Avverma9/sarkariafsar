import Link from 'next/link'
import { Suspense } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { notFound } from 'next/navigation'
import AdsenseUnit from '@/components/ads/AdsenseUnitClient'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

// ============ Multi-Key + Multi-Model Fallback ============
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  ...(process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean),
].filter((k, i, a) => k && a.indexOf(k) === i) // dedupe

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
]

// Models that support Google Search grounding (live web fetch)
const GEMINI_GROUNDED_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash']

// Re-verify each post against the web at most once per 6 hours
const VERIFY_THROTTLE_MS = 6 * 60 * 60 * 1000

async function generateWithFallback(prompt, maxTokens = 250) {
  for (const apiKey of GEMINI_KEYS) {
    for (const modelName of GEMINI_MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 },
        })
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
        ])
        const text = result.response.text().trim()
        if (text && text.length > 10) return text
      } catch {
        // Rate limited or error — try next model/key
        continue
      }
    }
  }
  return null // All failed—hide summary
}

// ============ Web Verification (Gemini + Google Search Grounding) ============
// Uses live search to fetch official dates & apply link. Returns null on failure.
async function verifyJobDatesFromWeb(job) {
  if (!GEMINI_KEYS.length) return null
  const agency = job.conductingAuthority || job.conducting_authority || ''
  const advt = job.advertisementNumber || job.advertisement_number || ''
  const prompt = `Search for the latest official information about this Indian government job notification and return ONLY a JSON object (no markdown, no explanation).

Job Title: ${job.title}
Conducting Authority: ${agency}${advt ? `\nAdvertisement No: ${advt}` : ''}

Return this exact JSON structure:
{
  "dates": [
    { "label": "Fee Last Date", "originalText": "06 April 2026", "verifiedDate": "11 April 2026", "status": "EXTENDED" },
    { "label": "Last Date to Apply", "originalText": "15 April 2026", "verifiedDate": "15 April 2026", "status": "ACTIVE" }
  ],
  "applyLink": "https://official-site.gov.in/apply",
  "isApplicationOpen": true,
  "source": "https://official-source-url"
}

Rules:
- status must be one of: ACTIVE, CLOSED, EXTENDED, NOT_YET_OPEN
- originalText must exactly match the date text as scraped from the notification
- verifiedDate is the CURRENT correct date from official source
- If a date was extended, set status EXTENDED and put the new date in verifiedDate
- If application portal is not yet open, set isApplicationOpen: false and applyLink: null
- Include only dates confirmed from official government sources
- If you cannot find reliable information, return { "dates": [], "applyLink": null, "isApplicationOpen": null, "source": null }`

  for (const apiKey of GEMINI_KEYS) {
    for (const modelName of GEMINI_GROUNDED_MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
          model: modelName,
          tools: [{ googleSearch: {} }],
          generationConfig: { maxOutputTokens: 700, temperature: 0.1 },
        })
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
        ])
        const rawText = result.response.text().trim()
        if (!rawText) continue
        const clean = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
        const jsonMatch = clean.match(/\{[\s\S]*\}/)
        if (!jsonMatch) continue
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed && Array.isArray(parsed.dates)) return parsed
      } catch {
        continue
      }
    }
  }
  return null
}

// ============ generateMetadata ============
export async function generateMetadata({ params }) {
  const { slug } = await params
  try {
    const res = await fetch(`${API_BASE}/post/slug/${slug}`, { next: { revalidate: 3600 } })
    const data = await res.json()
    const job = data?.data
    if (!job) return { title: 'Job Not Found - Sarkari Afsar' }
    const canonical = `${SITE_URL}/jobs/${job.slug}`
    return {
      title: `${job.title} 2026 — Sarkari Afsar`,
      description: `Apply for ${job.title}. Category: ${job.category || 'Government'}. Last date: ${job.applyLastDate ? new Date(job.applyLastDate).toLocaleDateString('en-IN') : 'Check official site'}.`,
      alternates: { canonical },
      openGraph: { title: job.title, url: canonical, siteName: 'Sarkari Afsar', images: [{ url: `${SITE_URL}/api/og?title=${encodeURIComponent(job.title)}&type=job`, width: 1200, height: 630 }], locale: 'en_IN', type: 'article' },
      twitter: { card: 'summary_large_image', title: job.title, site: '@sarkariafsar' },
    }
  } catch { return { title: 'Job Details - Sarkari Afsar' } }
}

// ============ Date Utils ============
const MONTH_MAP = {
  jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
  january:0,february:1,march:2,april:3,may2:4,june:5,july:6,august:7,
  september:8,october:9,november:10,december:11
}

function parseTextDate(str) {
  const s = str.trim()
  // DD Month YYYY
  let m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s-]+([A-Za-z]+)[,\s]+(\d{4})/i)
  if (m) { const mo = MONTH_MAP[m[2].toLowerCase().slice(0,9)]; if (mo !== undefined) return new Date(+m[3], mo, +m[1]) }
  // Month DD, YYYY
  m = s.match(/^([A-Za-z]+)[\s]+([0-9]{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})/i)
  if (m) { const mo = MONTH_MAP[m[1].toLowerCase().slice(0,9)]; if (mo !== undefined) return new Date(+m[3], mo, +m[2]) }
  // DD-DD Month YYYY (range - use first)
  m = s.match(/^(\d{1,2})-(\d{1,2})[\s]+([A-Za-z]+)[,\s]+(\d{4})/i)
  if (m) { const mo = MONTH_MAP[m[3].toLowerCase().slice(0,9)]; if (mo !== undefined) return new Date(+m[4], mo, +m[1]) }
  return null
}

const DATE_LABEL_KEYWORDS = [
  { re: /fee\s*(?:payment|deposit)|last\s*date\s*for\s*fee|payment\s*last\s*date/i, label: 'Fee Last Date' },
  { re: /application\s*(?:start|begin|open)|apply\s*start\s*date|online\s*apply\s*start/i, label: 'Application Start' },
  { re: /(?:last\s*date|closing\s*date|apply\s*(?:by|before)|end\s*date)/i, label: 'Last Date to Apply' },
  { re: /(?:admit\s*card|hall\s*ticket)/i, label: 'Admit Card' },
  { re: /(?:exam\s*date|written\s*test|cbt|examination\s*date)/i, label: 'Exam Date' },
  { re: /(?:result|merit\s*list)/i, label: 'Result Date' },
  { re: /(?:interview|document\s*verif)/i, label: 'Interview' },
  { re: /(?:notification|advt|advertisement)/i, label: 'Notification' },
  { re: /(?:age\s*limit|age\s*as\s*on|as\s*on\s*date)/i, label: 'Age Cutoff Date' },
  { re: /(?:registration|apply\s*online)/i, label: 'Registration' },
  { re: /(?:dob|date\s*of\s*birth|born)/i, label: 'Date of Birth' },
]

function getDateLabel(text, idx) {
  // Use at most 80 chars before the date; the LAST (closest) keyword match wins.
  // This prevents a keyword from a far-away bullet being attributed to a date
  // that belongs to a completely different row in stripped HTML.
  const window = text.slice(Math.max(0, idx - 80), idx)
  let result = null
  let lastMatchEnd = -1
  for (const { re, label } of DATE_LABEL_KEYWORDS) {
    const gr = new RegExp(re.source, 'gi')
    let m
    while ((m = gr.exec(window)) !== null) {
      const end = m.index + m[0].length
      if (end > lastMatchEnd) { lastMatchEnd = end; result = label }
    }
  }
  return result
}

function extractAllDates(text) {
  const patterns = [
    /\d{1,2}-\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)[,\s]+\d{4}/gi,
    /\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)[,\s]+\d{4}/gi,
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?[,\s]+\d{4}/gi,
  ]
  const found = new Map()
  for (const p of patterns) {
    let m
    while ((m = p.exec(text)) !== null) {
      const raw = m[0].trim()
      if (!found.has(raw)) {
        const d = parseTextDate(raw)
        if (d) {
          const label = getDateLabel(text, m.index)
          found.set(raw, { text: raw, date: d, idx: m.index, label })
        }
      }
    }
  }
  return [...found.values()]
}

function classifyDates(html) {
  const today = new Date()
  today.setHours(0,0,0,0)
  // Only surface dates within a relevant window — this filters out DOB dates
  // like "01 December 2004" or "31 May 2009" that appear in age-limit sections.
  const minDate = new Date(today.getFullYear() - 1, 0, 1)   // Jan 1 of last year
  const maxDate = new Date(today.getFullYear() + 2, 11, 31)  // Dec 31 of year+2
  const text = html.replace(/<[^>]+>/g, ' ')
  const all = extractAllDates(text)
  const expired = [], upcoming = []
  for (const d of all) {
    if (d.date < minDate || d.date > maxDate) continue
    if (d.date < today) expired.push(d)
    else upcoming.push(d)
  }
  return { expired: expired.slice(0, 8), upcoming: upcoming.slice(0, 6) }
}

// ============ Extension detection ============
// When an expired date and a LATER upcoming date share the same label
// (e.g. both labelled "Fee Last Date"), it means the authority extended
// the deadline. Returns Map<expiredText, upcomingItem>.
function detectExtensions(expired, upcoming) {
  const extensionMap = new Map()
  for (const exp of expired) {
    if (!exp.label) continue
    // Only treat as extension when the new date is within 60 days of the old one.
    // This prevents pairing a far-future date with an old expired date by coincidence.
    const matches = upcoming
      .filter(up => {
        if (up.label !== exp.label) return false
        if (up.date <= exp.date) return false
        const diffDays = (up.date - exp.date) / (1000 * 60 * 60 * 24)
        return diffDays <= 60
      })
      .sort((a, b) => a.date - b.date)
    if (matches.length > 0) extensionMap.set(exp.text, matches[0])
  }
  return extensionMap
}

// Labels that represent start/cutoff dates — never worth badging in content
const NO_BADGE_LABELS = new Set(['Application Start', 'Date of Birth', 'Age Cutoff Date', 'Notification'])

// Logic:
//  - expired with LATER same-label upcoming (≤60d gap) → 🔄 Extended to {newDate}
//  - remaining expired + isActive=true                  → ✅ Active
//  - remaining expired + recently updated               → 🔄 Updated: {postUpdatedDate}
//  - remaining expired + stale                          → no badge
//  - upcoming (not an extension target)                 → ✅ Active
//  - Application Start / DOB / Age Cutoff / Notification → never badged
//  Single-pass combined regex prevents double-badge injection.
function injectDateBadges(html, expired, upcoming, jobMeta = {}) {
  if (!html) return html

  const { isActive, updatedAt } = jobMeta
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const postUpdatedAt = updatedAt ? new Date(updatedAt) : null
  const updatedDaysAgo = postUpdatedAt && !Number.isNaN(postUpdatedAt.getTime())
    ? Math.round((today - postUpdatedAt) / (1000 * 60 * 60 * 24))
    : Infinity
  const isRecentlyUpdated = updatedDaysAgo <= 60
  const formattedUpdatedAt = postUpdatedAt && !Number.isNaN(postUpdatedAt.getTime())
    ? postUpdatedAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

  const extensionMap = detectExtensions(expired, upcoming)
  // Texts that are extension targets — already referenced in an "Extended to X" badge;
  // they must NOT receive a separate standalone badge (prevents double-badge).
  const extensionTargetTexts = new Set([...extensionMap.values()].map(e => e.text))

  const ACTIVE_BADGE =
    `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;` +
    `font-weight:700;color:#16a34a;background:#f0fdf4;border:1px solid #86efac;` +
    `padding:1px 8px;border-radius:9999px;margin-left:5px;vertical-align:middle;` +
    `white-space:nowrap;line-height:1.4;">✅ Active</span>`

  const UPDATED_BADGE =
    `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;` +
    `font-weight:700;color:#1d4ed8;background:#eff6ff;border:1px solid #93c5fd;` +
    `padding:1px 8px;border-radius:9999px;margin-left:5px;vertical-align:middle;` +
    `white-space:nowrap;line-height:1.4;">🔄 Updated: ${formattedUpdatedAt}</span>`

  function extendedBadge(newDateText) {
    return (
      `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;` +
      `font-weight:700;color:#7c3aed;background:#f5f3ff;border:1px solid #c4b5fd;` +
      `padding:1px 8px;border-radius:9999px;margin-left:5px;vertical-align:middle;` +
      `white-space:nowrap;line-height:1.4;">🔄 Extended to ${newDateText}</span>`
    )
  }

  // Build text → badge map
  const badgeMap = new Map()

  for (const item of expired) {
    if (NO_BADGE_LABELS.has(item.label)) continue  // skip start/DOB/cutoff dates
    const ext = extensionMap.get(item.text)
    if (ext) {
      badgeMap.set(item.text, extendedBadge(ext.text))
    } else if (isActive) {
      badgeMap.set(item.text, ACTIVE_BADGE)
    } else if (isRecentlyUpdated && formattedUpdatedAt) {
      badgeMap.set(item.text, UPDATED_BADGE)
    }
    // else: stale expired → no badge
  }

  for (const item of upcoming) {
    if (extensionTargetTexts.has(item.text)) continue  // already shown in "Extended to X"
    if (NO_BADGE_LABELS.has(item.label)) continue
    if (!badgeMap.has(item.text)) {  // don't overwrite an extension badge
      badgeMap.set(item.text, ACTIVE_BADGE)
    }
  }

  if (!badgeMap.size) return html

  // Sort by text length descending so longer patterns match before substrings
  const sortedTexts = [...badgeMap.keys()].sort((a, b) => b.length - a.length)

  // Single-pass combined regex — JS replace() advances past each match so the
  // injected badge HTML can never be matched again, eliminating double-badge.
  const escapedParts = sortedTexts.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const combinedRe = new RegExp(`(${escapedParts.join('|')})(?![^<>]*>)`, 'g')
  return html.replace(combinedRe, (match) => match + (badgeMap.get(match) ?? ''))
}

// ============ Patch contentHtml with verified dates & apply link ============
const APPLY_LINK_TEXT_RE = /Apply\s*Online|Apply\s*Now|Apply\s*Here|Apply\s*Link|Submit\s*Application/i

function patchContentHtml(html, verifiedData) {
  if (!html || !verifiedData) return html
  let result = html

  // 1 — Replace outdated date strings with verified dates
  for (const d of (verifiedData.dates || [])) {
    if (!d.originalText || !d.verifiedDate) continue
    if (d.originalText === d.verifiedDate) continue
    const esc = d.originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(esc, 'gi'), d.verifiedDate)
  }

  // 2 — Patch apply links based on isApplicationOpen + applyLink
  result = result.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (match, attrs, inner) => {
    const plainInner = inner.replace(/<[^>]+>/g, '').trim()
    if (!APPLY_LINK_TEXT_RE.test(plainInner)) return match

    if (verifiedData.isApplicationOpen === false) {
      return (
        `<span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;` +
        `color:#b45309;background:#fff7ed;border:1px solid #f59e0b;` +
        `padding:4px 12px;border-radius:6px;font-weight:600;">` +
        `⚠️ Application link not yet active</span>`
      )
    }
    if (verifiedData.applyLink) {
      const hasHref = /\bhref\s*=/i.test(attrs)
      const newAttrs = hasHref
        ? attrs.replace(/\bhref\s*=\s*(['"])[^'"]*\1/i, `href="${verifiedData.applyLink}"`)
        : `href="${verifiedData.applyLink}" ${attrs}`
      return `<a ${newAttrs.trim()}>${inner}</a>`
    }
    return match
  })

  return result
}

// ============ Highlight parser for summary text ============
function parseHighlights(text) {
  const today = new Date(); today.setHours(0,0,0,0)
  const patterns = [
    { regex: /(?:Rs\.?\s*|\u20b9|INR\s*)[\d,]+(?:\/[-]?)?(?:\s*(?:rupees|only))?/gi, type: 'fee' },
    { regex: /\d{1,2}-\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)[,\s]+\d{4}/gi, type: 'date' },
    { regex: /\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)[,\s]+\d{4}/gi, type: 'date' },
    { regex: /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?[,\s]+\d{4}/gi, type: 'date' },
  ]
  const found = new Map()
  for (const { regex, type } of patterns) {
    let m
    while ((m = regex.exec(text)) !== null) {
      const raw = m[0].trim()
      if (found.has(raw)) continue
      let status = 'active', hType = type
      if (type === 'date') {
        const d = parseTextDate(raw)
        if (d) status = d < today ? 'expired' : 'upcoming'
        const before = text.slice(Math.max(0, m.index - 40), m.index).toLowerCase()
        if (before.includes('last') || before.includes('clos') || before.includes('dead') || before.includes('apply'))
          hType = 'deadline'
      }
      found.set(raw, { text: raw, type: hType, status })
    }
  }
  return [...found.values()]
}

// ============ Shimmer Skeleton ============
function AiSkeleton() {
  return (
    <div className="rounded-xl border border-amber-200 overflow-hidden mb-6" aria-label="Loading AI summary...">
      <div className="bg-amber-50 px-5 py-4">
        {/* Header shimmer */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full shimmer-wave" />
            <div className="h-3 w-40 rounded shimmer-wave" />
          </div>
          <div className="h-5 w-24 rounded-full shimmer-wave" />
        </div>
        {/* Text lines shimmer */}
        <div className="space-y-2.5">
          <div className="h-3.5 w-full rounded shimmer-wave" />
          <div className="h-3.5 w-11/12 rounded shimmer-wave" />
          <div className="h-3.5 w-4/5 rounded shimmer-wave" />
        </div>
        {/* Pills shimmer */}
        <div className="flex gap-2 mt-4">
          <div className="h-6 w-28 rounded-full shimmer-wave" />
          <div className="h-6 w-24 rounded-full shimmer-wave" />
          <div className="h-6 w-20 rounded-full shimmer-wave" />
        </div>
        <div className="h-2 w-48 rounded mt-3 shimmer-wave" />
      </div>
    </div>
  )
}

function FaqSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="h-4 w-48 rounded shimmer-wave mb-4" />
      {[1,2,3].map(i => (
        <div key={i} className="border border-gray-100 rounded-lg p-3 mb-2">
          <div className="h-3 w-3/4 rounded shimmer-wave mb-2" />
          <div className="h-3 w-full rounded shimmer-wave" />
        </div>
      ))}
    </div>
  )
}

// ============ Highlight Renderer ============
function HighlightedSummary({ text, highlights }) {
  if (!highlights.length) return <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
  const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length)
  const parts = []
  let rem = text
  for (const h of sorted) {
    const idx = rem.indexOf(h.text)
    if (idx !== -1) {
      if (idx > 0) parts.push({ kind: 'text', content: rem.slice(0, idx) })
      parts.push({ kind: 'tag', ...h })
      rem = rem.slice(idx + h.text.length)
    }
  }
  if (rem) parts.push({ kind: 'text', content: rem })

  const style = (type, status) => {
    if (type === 'fee') return { cls: 'bg-emerald-50 text-emerald-800 border border-emerald-300', icon: '💰', pulse: false }
    if (status === 'expired') return { cls: 'bg-red-100 text-red-700 border-2 border-red-400 line-through decoration-red-500 decoration-2', icon: '❌', pulse: false }
    if (type === 'deadline') return { cls: 'bg-orange-100 text-orange-800 border-2 border-orange-400 shadow-sm', icon: '⏰', pulse: true }
    return { cls: 'bg-blue-50 text-blue-800 border-2 border-blue-300 shadow-sm', icon: '📅', pulse: true }
  }
  return (
    <p className="text-sm text-gray-700 leading-relaxed">
      {parts.map((p, i) => {
        if (p.kind === 'text') return <span key={i}>{p.content}</span>
        const { cls, icon, pulse } = style(p.type, p.status)
        return (
          <span key={i}
            title={p.status==='expired'?'This date has passed':p.type==='fee'?'Application fee':p.type==='deadline'?'Important deadline':'Important date'}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold mx-0.5 my-0.5 align-middle cursor-help ${cls} ${pulse?'animate-pulse':''}`}>
            <span>{icon}</span><span>{p.text}</span>
          </span>
        )
      })}
    </p>
  )
}

const MS_DAY = 1000 * 60 * 60 * 24

function parseNumeric(value) {
  if (!value) return 0
  const digits = String(value).replace(/[^0-9]/g, '')
  return digits ? Number(digits) : 0
}

function buildJobIntro(job) {
  const parts = []
  const category = (job.category || 'Government').toLowerCase()
  const jobTitle = job.jobtitle || job.title
  const agency = job.conductingAuthority || 'a government department'
  parts.push(`The ${category} ${jobTitle} opportunity is published by ${agency}.`)
  if (job.location) parts.push(`It focuses on candidates in ${job.location}.`)
  if (job.totalVacancies) parts.push(`${job.totalVacancies} vacancies are listed.`)
  if (job.salary) parts.push(`The reported salary is ${job.salary}.`)
  if (job.selectionProcess) parts.push(`Selection will follow ${job.selectionProcess}.`)
  if (job.applyLastDate) {
    const safeDate = new Date(job.applyLastDate)
    if (!Number.isNaN(safeDate)) {
      parts.push(`Submit your application by ${safeDate.toLocaleDateString('en-IN')}.`)
    }
  }
  return parts.join(' ')
}

function buildJobPros(job) {
  const pros = []
  if (job.isActive) pros.push('Recruitment is currently active, so the notification can be immediately followed through.')
  const vacancies = parseNumeric(job.totalVacancies)
  if (vacancies && vacancies >= 100) {
    pros.push(`Over ${vacancies} vacancies widen the competition window for this post.`)
  } else if (vacancies) {
    pros.push(`${vacancies} vacancies means a more focused competition for determined candidates.`)
  }
  if (job.salary) pros.push(`Salary details are available (${job.salary}), so you can plan your expectations.`)
  if (job.selectionProcess) pros.push(`Selection hinges on ${job.selectionProcess}, helping you strategize preparation.`)
  if (job.location) pros.push(`The post is centered around ${job.location}, which helps local applicants track domicile requirements.`)
  return pros
}

function buildJobCons(job) {
  const cons = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (!job.isActive) cons.push('The notification is flagged inactive; verify whether the recruitment is reopened before applying.')
  if (job.applyLastDate) {
    const lastDate = new Date(job.applyLastDate)
    if (!Number.isNaN(lastDate)) {
      const diff = Math.round((lastDate - today) / MS_DAY)
      if (diff >= 0 && diff <= 14) {
        cons.push(`The deadline is ${diff} day${diff === 1 ? '' : 's'} away, so gather your documents quickly.`)
      } else if (diff < 0) {
        cons.push('The listed deadline has passed; confirm whether the authority has extended the window.')
      }
    }
  } else {
    cons.push('Closing date is not mentioned in this scraped excerpt; check the official PDF for clarity.')
  }
  if (!job.salary) cons.push('Salary band is not captured in this table; always verify the pay scale from the source notice.')
  return cons
}

function buildJobStateNote(job) {
  if (!job.location) return ''
  const segments = job.location.split(',').map(seg => seg.trim()).filter(Boolean)
  if (!segments.length) return ''
  const region = segments[segments.length - 1]
  return `${region} residents should double-check domicile, reservation and posting guidelines before applying.`
}

function buildJobInsights(job) {
  const candidates = []
  const push = (title, value) => {
    if (typeof value === 'string' && value.trim()) {
      candidates.push({ title, body: value.trim() })
    }
  }
  push('Exam Preparation Strategy', job.examPreparationStrategy)
  push('Syllabus Breakdown', job.syllabusBreakdown)
  push('Selection Process Notes', job.selectionProcess)
  push('Physical Test Details', job.physicalTestDetails)
  return candidates
}

// ============ Async AI Summary (Suspense) ============
async function AiSummaryBox({ content, title, type, contentHtml, isActive, updatedAt }) {
  const { expired: rawExpired, upcoming } = classifyDates(contentHtml || content)
  const expired = isActive ? [] : rawExpired
  // Detect which upcoming dates are extensions of an expired same-label date
  const extensionMap = detectExtensions(rawExpired, upcoming)
  const extensionTargetTexts = new Set([...extensionMap.values()].map(v => v.text))

  // --- Build structured date context for AI ---
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  const todayStr = todayDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const postUpdatedAt = updatedAt ? new Date(updatedAt) : null
  const postUpdatedStr = postUpdatedAt && !Number.isNaN(postUpdatedAt.getTime())
    ? postUpdatedAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  const dateCtxLines = []
  dateCtxLines.push(`Today: ${todayStr}`)
  dateCtxLines.push(`Post Status: ${isActive ? 'ACTIVE' : 'CLOSED/INACTIVE'}`)
  if (postUpdatedStr) dateCtxLines.push(`Post Last Modified: ${postUpdatedStr}`)
  for (const e of rawExpired) {
    const ext = extensionMap.get(e.text)
    if (ext) {
      dateCtxLines.push(`- ${e.label || 'Date'}: ${e.text} → EXTENDED to ${ext.text} (still ACTIVE)`)
    } else {
      dateCtxLines.push(`- ${e.label || 'Date'}: ${e.text} → CLOSED (date has passed)`)
    }
  }
  for (const u of upcoming) {
    if (!extensionTargetTexts.has(u.text)) {
      dateCtxLines.push(`- ${u.label || 'Date'}: ${u.text} → ACTIVE (upcoming)`)
    }
  }
  const dateContext = dateCtxLines.join('\n')

  // Call AI with fallback
  const prompt = type === 'scheme'
    ? `Summarize this government scheme in 3 sentences. Mention eligibility, benefits, and whether key dates are active, closed, or extended.\n\n${dateContext}\n\nTitle: ${title}\nContent: ${content.slice(0, 1500)}`
    : `Summarize this government job notification in 3 sentences. For each important date (fee date, apply deadline), state clearly whether it is ACTIVE, CLOSED, or EXTENDED based on the date context below. Include vacancies and eligibility.\n\n${dateContext}\n\nTitle: ${title}\nContent: ${content.slice(0, 1500)}`

  const summary = await generateWithFallback(prompt, 250)
  // If all API keys failed — hide the section entirely
  if (!summary) return null

  const rawHighlights = parseHighlights(summary)
  // When job is active, override expired status so the summary text
  // never shows strikethrough red on dates that are still in-window.
  const highlights = isActive
    ? rawHighlights.map(h => h.status === 'expired' ? { ...h, status: 'upcoming' } : h)
    : rawHighlights

  return (
    <div className="ai-summary-enter rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm mb-6 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">AI Assistant — Quick Summary</span>
          </div>
          <div className="flex gap-2">
            {expired.length > 0 && (
              <span className="text-xs bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded-full font-semibold">
                ❌ {expired.length} Expired
              </span>
            )}
            {upcoming.length > 0 && (
              <span className="text-xs bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                ✨ {upcoming.length} New Update{upcoming.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Highlighted Summary */}
        <HighlightedSummary text={summary} highlights={highlights} />

        {/* Legend */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3 text-[10px]">
            {highlights.some(h=>h.status==='expired') && <span className="text-red-500">❌ Expired date</span>}
            {highlights.some(h=>h.type==='deadline') && <span className="text-orange-600">⏰ Deadline</span>}
            {highlights.some(h=>h.type==='fee') && <span className="text-emerald-600">💰 Fee</span>}
            {highlights.some(h=>h.type==='date'&&h.status!=='expired') && <span className="text-blue-600">📅 Date</span>}
          </div>
        )}
      </div>

      {/* NEW UPDATES section */}
      {upcoming.length > 0 && (
        <div className="mx-5 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
            <span>✨</span> Latest Update{upcoming.length > 1 ? 's' : ''} in this post:
          </p>
          <div className="flex flex-wrap gap-2">
            {upcoming.map((item, i) => {
              const isExt = [...extensionMap.values()].some(ext => ext.text === item.text)
              const displayLabel = isExt ? `${item.label || 'Date'} Extended` : item.label
              return (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${isExt ? 'text-purple-700 bg-purple-50 border border-purple-300' : 'text-green-700 bg-green-100 border border-green-300'}`}>
                  <span>{isExt ? '🔄' : '📅'}</span>
                  {displayLabel && <span className={`font-normal ${isExt ? 'text-purple-600' : 'text-green-600'}`}>{displayLabel}:</span>}
                  <span>{item.text}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400 px-5 py-3 border-t border-amber-100 mt-3">
        Gemini AI • Always verify from the official source before applying.
      </p>
    </div>
  )
}

// ============ Async FAQ Box (Suspense) ============
async function AiFaqBox({ content, title }) {
  const prompt = `Generate 4 helpful FAQs for this Indian government content. Return ONLY a JSON array (no markdown): [{"question": "Q", "answer": "A"}]\n\nTitle: ${title}\nContent: ${content.slice(0, 1500)}`
  const text = await generateWithFallback(prompt, 600)
  if (!text) return null
  try {
    const clean = text.replace(/^\x60{3}json\s*/i, '').replace(/\x60{3}\s*$/i, '').trim()
    const match = clean.match(/\[.*\]/s)
    if (!match) return null
    const faqs = JSON.parse(match[0])
    if (!Array.isArray(faqs) || !faqs.length) return null
    const faqSchema = { '@context':'https://schema.org','@type':'FAQPage', mainEntity: faqs.map(f=>({'@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:f.answer}})) }
    return (
      <div className="ai-summary-enter bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <h2 className="font-bold text-[#1e3a5f] text-base mb-4 flex items-center gap-2"><span>❓</span> Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="border border-gray-100 rounded-lg overflow-hidden">
              <summary className="px-4 py-3 cursor-pointer flex justify-between items-start gap-3 hover:bg-gray-50 list-none">
                <span className="text-sm font-medium text-gray-800">{faq.question}</span>
                <span className="text-gray-400 shrink-0 text-lg">+</span>
              </summary>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    )
  } catch { return null }
}

// ============ Main Page ============
export default async function JobDetailPage({ params }) {
  const { slug } = await params
  let job = null
  try {
    const res = await fetch(`${API_BASE}/post/slug/${slug}`, { next: { revalidate: 3600 } })
    const data = await res.json()
    job = data?.data
  } catch {}

  if (!job) return notFound()

  let contentHtml = job.scrapedContent?.contentHtml || job.content || ''

  // ── AI Web Verification (Gemini + Google Search, throttled to once per 6 hours) ──
  const lastVerified = job.aiVerifiedAt ? new Date(job.aiVerifiedAt).getTime() : 0
  if ((Date.now() - lastVerified) > VERIFY_THROTTLE_MS) {
    try {
      const verified = await verifyJobDatesFromWeb(job)
      if (verified) {
        const patched = patchContentHtml(contentHtml, verified)
        if (patched !== contentHtml) {
          contentHtml = patched
        }
        // Find if the apply/last-date was extended — update applyLastDate in DB
        const applyExt = (verified.dates || []).find(
          d => /last\s*date|apply/i.test(d.label || '') && d.status === 'EXTENDED'
        )
        const newApplyDate = applyExt?.verifiedDate ? parseTextDate(applyExt.verifiedDate) : null
        const updatePayload = {
          scrapedContent: {
            contentHtml: patched ?? contentHtml,
            contentJson: job.scrapedContent?.contentJson ?? {},
            extractedAt: job.scrapedContent?.extractedAt ?? new Date().toISOString(),
          },
          aiVerifiedAt: new Date().toISOString(),
          ...(newApplyDate && !Number.isNaN(newApplyDate.getTime()) && {
            applyLastDate: newApplyDate.toISOString(),
          }),
        }
        // Fire-and-forget: save to DB without blocking the render
        const internalBase = process.env.INTERNAL_API_URL || API_BASE
        fetch(`${internalBase}/post/slug/${job.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: updatePayload }),
          cache: 'no-store',
        }).catch(() => {})
      }
    } catch {} // Silently fall through — render with existing contentHtml
  }

  const applyDate = job.applyLastDate ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'N/A'
  const postedDate = job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : ''
  const plainText = contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const { expired: expiredInContent, upcoming: upcomingInContent } = classifyDates(contentHtml)
  const annotatedContentHtml = injectDateBadges(
    contentHtml,
    expiredInContent,
    upcomingInContent,
    { isActive: job.isActive, updatedAt: job.updatedAt }
  )
  const canonical = `${SITE_URL}/jobs/${job.slug}`
  const jobIntro = buildJobIntro(job)
  const jobPros = buildJobPros(job)
  const jobCons = buildJobCons(job)
  const jobInsights = buildJobInsights(job)
  const jobStateNote = buildJobStateNote(job)

  const breadcrumbSchema = { '@context':'https://schema.org','@type':'BreadcrumbList', itemListElement:[{"@type":"ListItem",position:1,name:'Home',item:SITE_URL},{"@type":"ListItem",position:2,name:'Jobs',item:`${SITE_URL}/jobs`},{"@type":"ListItem",position:3,name:job.title,item:canonical}] }

  const descParts = [job.title]
  if (job.jobtitle) descParts.push(`Job Title: ${job.jobtitle}`)
  if (job.category) descParts.push(`Category: ${job.category}`)
  if (job.totalVacancies) descParts.push(`Total Vacancies: ${job.totalVacancies}`)
  if (job.salary) descParts.push(`Salary: ${job.salary}`)
  if (job.ageLimit) descParts.push(`Age Limit: ${job.ageLimit}`)
  if (job.applicationFee) descParts.push(`Application Fee: ${job.applicationFee}`)
  if (job.selectionProcess) descParts.push(`Selection Process: ${job.selectionProcess}`)

  const jobPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.jobtitle || job.title,
    description: descParts.join('. '),
    datePosted: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
    validThrough: job.applyLastDate ? new Date(job.applyLastDate).toISOString() : undefined,
    employmentType: 'FULL_TIME',
    url: canonical,
    identifier: job.advertisementNumber
      ? { '@type': 'PropertyValue', name: 'Advertisement Number', value: job.advertisementNumber }
      : { '@type': 'PropertyValue', name: 'SarkariAfsar', value: job.slug },
    hiringOrganization: { '@type': 'Organization', name: job.conductingAuthority || 'Government of India' },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: 'IN', addressLocality: job.location || '' } },
    ...(job.salary && { baseSalary: { '@type': 'MonetaryAmount', currency: 'INR', value: { '@type': 'QuantitativeValue', value: job.salary, unitText: 'MONTH' } } }),
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Header — INSTANT */}
      <div className="bg-[#1e3a5f] text-white py-10 px-4">
        <div className="mx-auto w-full max-w-5xl px-2">
          <nav aria-label="breadcrumb" className="text-sm text-blue-300 mb-4 flex flex-wrap gap-1">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>&rsaquo;</span>
            <Link href="/jobs" className="hover:text-white transition-colors">Jobs</Link>
            <span>&rsaquo;</span>
            <span className="text-white truncate max-w-xs">{job.title}</span>
          </nav>
          <div className="flex flex-wrap gap-2 mb-3">
            {job.sectionName && <span className="text-xs bg-[#f59e0b]/20 text-[#f59e0b] px-3 py-1 rounded-full font-semibold">{job.sectionName}</span>}
            {job.category && <span className="text-xs bg-white/10 text-white/80 px-3 py-1 rounded-full">{job.category}</span>}
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${job.isActive?'bg-green-500/20 text-green-300':'bg-red-500/20 text-red-300'}`}>
              {job.isActive ? 'Active' : 'Closed'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">{job.title}</h1>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-blue-200">
            {postedDate && <span>📅 Posted: {postedDate}</span>}
            {job.applyLastDate && <span>⏰ Last Date: <strong className="text-white">{applyDate}</strong></span>}
            {job.conductingAuthority && <span>🏢 {job.conductingAuthority}</span>}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-8">

        {/* Back link — top */}
        <div className="mb-4">
          <Link href="/jobs" className="inline-flex items-center gap-1.5 text-[#1e3a5f] hover:text-[#f59e0b] text-sm font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back to All Jobs
          </Link>
        </div>

        {jobIntro && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">What to know before you apply</h2>
            <p className="text-gray-700 text-sm leading-relaxed">{jobIntro}</p>
            {jobStateNote && (
              <p className="text-xs text-gray-500 mt-3 italic">{jobStateNote}</p>
            )}
          </div>
        )}

        {/* AI Summary — shimmer while loading, fades in when ready, hidden if all fail */}
        <Suspense fallback={<AiSkeleton />}>
          <AiSummaryBox content={plainText} title={job.title} type="job" contentHtml={contentHtml} isActive={job.isActive} updatedAt={job.updatedAt} />
        </Suspense>

        {/* Job Content — INSTANT, dates annotated inline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="job-content prose max-w-none text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: annotatedContentHtml }} />
        </div>

        {(jobInsights.length > 0 || jobPros.length || jobCons.length) && (
          <div className="space-y-6 mb-6">
            {jobInsights.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Detailed insights for this job</h2>
                <div className="space-y-4">
                  {jobInsights.map((insight, index) => (
                    <div key={`${insight.title}-${index}`}>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">{insight.title}</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{insight.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(jobPros.length || jobCons.length) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {jobPros.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1e3a5f] mb-3">Pros</div>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {jobPros.map((item, index) => (
                          <li key={`pro-${index}`} className="flex gap-2">
                            <span className="text-[#f59e0b] font-semibold">▸</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {jobCons.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1e3a5f] mb-3">Cons</div>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {jobCons.map((item, index) => (
                          <li key={`con-${index}`} className="flex gap-2">
                            <span className="text-red-500 font-semibold">▸</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <AdsenseUnit placement="detail-inarticle" className="mb-6" />

        {/* FAQ — shimmer while loading, fades in, hidden if fail */}
        <Suspense fallback={<FaqSkeleton />}>
          <AiFaqBox content={plainText} title={job.title} />
        </Suspense>
      </div>
    </div>
  )
}
