import Link from 'next/link'
import { Suspense } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import dynamic from 'next/dynamic'

const AdsenseUnit = dynamic(() => import('@/components/ads/AdsenseUnit'), { ssr: false })

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

async function generateWithFallback(prompt, maxTokens = 250) {
  for (const apiKey of GEMINI_KEYS) {
    for (const modelName of GEMINI_MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 },
        })
        const result = await model.generateContent(prompt)
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

// ============ generateMetadata ============
export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`${API_BASE}/post/slug/${params.slug}`, { next: { revalidate: 3600 } })
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
        if (d) found.set(raw, { text: raw, date: d, idx: m.index })
      }
    }
  }
  return [...found.values()]
}

function classifyDates(html) {
  const today = new Date()
  today.setHours(0,0,0,0)
  const text = html.replace(/<[^>]+>/g, ' ')
  const all = extractAllDates(text)
  const expired = [], upcoming = []
  for (const d of all) {
    if (d.date < today) expired.push(d)
    else upcoming.push(d)
  }
  return { expired: expired.slice(0, 8), upcoming: upcoming.slice(0, 6) }
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

// ============ Async AI Summary (Suspense) ============
async function AiSummaryBox({ content, title, type, contentHtml }) {
  const { expired, upcoming } = classifyDates(contentHtml || content)

  // Call AI with fallback
  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })
  const prompt = type === 'scheme'
    ? `Summarize this government scheme in 3 sentences. Include eligibility, benefits, key dates and fees.\n\nTitle: ${title}\nToday: ${today}\nContent: ${content.slice(0, 1800)}`
    : `Summarize this government job in 3 sentences. Include key dates, fees, vacancies and eligibility.\n\nTitle: ${title}\nToday: ${today}\nContent: ${content.slice(0, 1800)}`

  const summary = await generateWithFallback(prompt, 250)
  // If all API keys failed — hide the section entirely
  if (!summary) return null

  const highlights = parseHighlights(summary)

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
            {upcoming.map((item, i) => (
              <span key={i} className="text-xs text-green-700 bg-green-100 border border-green-300 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <span>📅</span> {item.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* EXPIRED DATES section */}
      {expired.length > 0 && (
        <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
            <span>❌</span> These dates in the post have already passed:
          </p>
          <div className="flex flex-wrap gap-2">
            {expired.map((item, i) => (
              <del key={i} className="text-xs text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded decoration-red-500 decoration-2">
                {item.text}
              </del>
            ))}
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
  let job = null
  try {
    const res = await fetch(`${API_BASE}/post/slug/${params.slug}`, { next: { revalidate: 3600 } })
    const data = await res.json()
    job = data?.data
  } catch {}

  if (!job) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-gray-700 mb-2">Job Not Found</h1>
      <Link href="/jobs" className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg hover:bg-[#153060]">Back to Jobs</Link>
    </div>
  )

  const contentHtml = job.scrapedContent?.contentHtml || job.content || ''
  const applyDate = job.applyLastDate ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'N/A'
  const postedDate = job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : ''
  const plainText = contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const canonical = `${SITE_URL}/jobs/${job.slug}`

  const breadcrumbSchema = { '@context':'https://schema.org','@type':'BreadcrumbList', itemListElement:[{"@type":"ListItem",position:1,name:'Home',item:SITE_URL},{"@type":"ListItem",position:2,name:'Jobs',item:`${SITE_URL}/jobs`},{"@type":"ListItem",position:3,name:job.title,item:canonical}] }
  const jobPostingSchema = { '@context':'https://schema.org','@type':'JobPosting', title:job.title, description:`${job.title} - Government job notification`, identifier:{'@type':'PropertyValue',name:'SarkariAfsar',value:job.slug}, datePosted:job.createdAt, validThrough:job.applyLastDate, employmentType:'FULL_TIME', hiringOrganization:{'@type':'Organization',name:job.conductingAuthority||'Government of India'}, jobLocation:{'@type':'Place',address:{'@type':'PostalAddress',addressCountry:'IN'}}, url:canonical }

  return (
    <div className="bg-gray-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Header — INSTANT */}
      <div className="bg-[#1e3a5f] text-white py-10 px-4">
        <div className="container mx-auto max-w-4xl">
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* AI Summary — shimmer while loading, fades in when ready, hidden if all fail */}
        <Suspense fallback={<AiSkeleton />}>
          <AiSummaryBox content={plainText} title={job.title} type="job" contentHtml={contentHtml} />
        </Suspense>

        {/* Job Content — INSTANT */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="job-content prose max-w-none text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </div>

        <AdsenseUnit placement="detail-inarticle" className="mb-6" />

        {/* FAQ — shimmer while loading, fades in, hidden if fail */}
        <Suspense fallback={<FaqSkeleton />}>
          <AiFaqBox content={plainText} title={job.title} />
        </Suspense>

        {job.sourceUrl && (
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#1e4a7f] rounded-2xl p-6 text-center text-white mb-6">
            <h3 className="text-lg font-bold mb-2">Ready to Apply?</h3>
            <p className="text-blue-200 text-sm mb-4">Click below to visit the official website.</p>
            <a href={job.sourceUrl} target="_blank" rel="nofollow noopener noreferrer"
              className="inline-block bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-lg">
              Apply Now →
            </a>
          </div>
        )}
        <Link href="/jobs" className="text-[#1e3a5f] hover:underline text-sm font-medium">&larr; Back to All Jobs</Link>
      </div>
    </div>
  )
}
