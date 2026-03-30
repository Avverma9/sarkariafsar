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
].filter((k, i, a) => k && a.indexOf(k) === i)

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash']

async function generateWithFallback(prompt, maxTokens = 250) {
  for (const apiKey of GEMINI_KEYS) {
    for (const modelName of GEMINI_MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 } })
        const result = await model.generateContent(prompt)
        const text = result.response.text().trim()
        if (text && text.length > 10) return text
      } catch { continue }
    }
  }
  return null
}

// ============ generateMetadata ============
export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`${API_BASE}/schemes/slug/${params.slug}`, { next: { revalidate: 86400 } })
    const data = await res.json()
    const scheme = data?.data
    if (!scheme) return { title: 'Scheme Not Found - Sarkari Afsar' }
    const canonical = `${SITE_URL}/yojana/${scheme.slug}`
    return {
      title: `${scheme.schemeTitle} — Sarkari Afsar`,
      description: scheme.aboutScheme?.slice(0, 155) || `${scheme.schemeTitle} details.`,
      alternates: { canonical },
      openGraph: { title: scheme.schemeTitle, url: canonical, siteName: 'Sarkari Afsar', images: [{ url: `${SITE_URL}/api/og?title=${encodeURIComponent(scheme.schemeTitle)}&type=scheme`, width: 1200, height: 630 }], locale: 'en_IN', type: 'article' },
      twitter: { card: 'summary_large_image', title: scheme.schemeTitle, site: '@sarkariafsar' },
    }
  } catch { return { title: 'Scheme Details - Sarkari Afsar' } }
}

// ============ Date Utils ============
const MONTH_MAP = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11, january:0,february:1,march:2,april:3,june:5,july:6,august:7,september:8,october:9,november:10,december:11 }

function parseTextDate(str) {
  let m = str.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s-]+([A-Za-z]+)[,\s]+(\d{4})/i)
  if (m) { const mo = MONTH_MAP[m[2].toLowerCase().slice(0,9)]; if (mo !== undefined) return new Date(+m[3], mo, +m[1]) }
  m = str.match(/^([A-Za-z]+)[\s]+([0-9]{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})/i)
  if (m) { const mo = MONTH_MAP[m[1].toLowerCase().slice(0,9)]; if (mo !== undefined) return new Date(+m[3], mo, +m[2]) }
  m = str.match(/^(\d{1,2})-(\d{1,2})[\s]+([A-Za-z]+)[,\s]+(\d{4})/i)
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
    let m; while ((m = p.exec(text)) !== null) {
      const raw = m[0].trim()
      if (!found.has(raw)) { const d = parseTextDate(raw); if (d) found.set(raw, { text: raw, date: d }) }
    }
  }
  return [...found.values()]
}

function classifyDates(content) {
  const today = new Date(); today.setHours(0,0,0,0)
  const all = extractAllDates(content)
  return { expired: all.filter(d => d.date < today).slice(0, 8), upcoming: all.filter(d => d.date >= today).slice(0, 6) }
}

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
    let m; while ((m = regex.exec(text)) !== null) {
      const raw = m[0].trim(); if (found.has(raw)) continue
      let status = 'active', hType = type
      if (type === 'date') {
        const d = parseTextDate(raw); if (d) status = d < today ? 'expired' : 'upcoming'
        const before = text.slice(Math.max(0, m.index-40), m.index).toLowerCase()
        if (before.includes('last')||before.includes('clos')||before.includes('apply')) hType = 'deadline'
      }
      found.set(raw, { text: raw, type: hType, status })
    }
  }
  return [...found.values()]
}

// ============ Shimmer Skeletons ============
function AiSkeleton() {
  return (
    <div className="rounded-xl border border-amber-200 overflow-hidden mb-6">
      <div className="bg-amber-50 px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full shimmer-wave" />
            <div className="h-3 w-40 rounded shimmer-wave" />
          </div>
          <div className="h-5 w-24 rounded-full shimmer-wave" />
        </div>
        <div className="space-y-2.5">
          <div className="h-3.5 w-full rounded shimmer-wave" />
          <div className="h-3.5 w-11/12 rounded shimmer-wave" />
          <div className="h-3.5 w-4/5 rounded shimmer-wave" />
        </div>
        <div className="flex gap-2 mt-4">
          {[1,2,3].map(i => <div key={i} className="h-6 w-28 rounded-full shimmer-wave" />)}
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
      {[1,2,3].map(i => <div key={i} className="border border-gray-100 rounded-lg p-3 mb-2"><div className="h-3 w-3/4 rounded shimmer-wave mb-2" /><div className="h-3 w-full rounded shimmer-wave" /></div>)}
    </div>
  )
}

// ============ Highlight Renderer ============
function HighlightedSummary({ text, highlights }) {
  if (!highlights.length) return <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
  const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length)
  const parts = []; let rem = text
  for (const h of sorted) {
    const idx = rem.indexOf(h.text)
    if (idx !== -1) {
      if (idx > 0) parts.push({ kind:'text', content:rem.slice(0,idx) })
      parts.push({ kind:'tag', ...h })
      rem = rem.slice(idx + h.text.length)
    }
  }
  if (rem) parts.push({ kind:'text', content:rem })
  const style = (type, status) => {
    if (type === 'fee') return { cls:'bg-emerald-50 text-emerald-800 border border-emerald-300', icon:'💰', pulse:false }
    if (status === 'expired') return { cls:'bg-red-100 text-red-700 border-2 border-red-400 line-through decoration-red-500 decoration-2', icon:'❌', pulse:false }
    if (type === 'deadline') return { cls:'bg-orange-100 text-orange-800 border-2 border-orange-400 shadow-sm', icon:'⏰', pulse:true }
    return { cls:'bg-blue-50 text-blue-800 border-2 border-blue-300 shadow-sm', icon:'📅', pulse:true }
  }
  return (
    <p className="text-sm text-gray-700 leading-relaxed">
      {parts.map((p, i) => {
        if (p.kind === 'text') return <span key={i}>{p.content}</span>
        const { cls, icon, pulse } = style(p.type, p.status)
        return <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold mx-0.5 my-0.5 align-middle ${cls} ${pulse?'animate-pulse':''}`}><span>{icon}</span><span>{p.text}</span></span>
      })}
    </p>
  )
}

// ============ Async AI Summary Box ============
async function AiSummaryBox({ content, title }) {
  const { expired, upcoming } = classifyDates(content)
  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })
  const summary = await generateWithFallback(
    `Summarize this government scheme in 3 sentences. Include eligibility, benefits, key dates and fees.\n\nTitle: ${title}\nToday: ${today}\nContent: ${content.slice(0, 1800)}`,
    250
  )
  if (!summary) return null
  const highlights = parseHighlights(summary)
  return (
    <div className="ai-summary-enter rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm mb-6 overflow-hidden">
      <div className="px-5 pt-5 pb-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">AI Assistant — Quick Summary</span>
          </div>
          <div className="flex gap-2">
            {expired.length > 0 && <span className="text-xs bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded-full font-semibold">❌ {expired.length} Expired</span>}
            {upcoming.length > 0 && <span className="text-xs bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded-full font-semibold animate-pulse">✨ {upcoming.length} Update{upcoming.length>1?'s':''}</span>}
          </div>
        </div>
        <HighlightedSummary text={summary} highlights={highlights} />
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3 text-[10px]">
            {highlights.some(h=>h.status==='expired') && <span className="text-red-500">❌ Expired</span>}
            {highlights.some(h=>h.type==='deadline') && <span className="text-orange-600">⏰ Deadline</span>}
            {highlights.some(h=>h.type==='fee') && <span className="text-emerald-600">💰 Fee</span>}
            {highlights.some(h=>h.type==='date'&&h.status!=='expired') && <span className="text-blue-600">📅 Date</span>}
          </div>
        )}
      </div>
      {upcoming.length > 0 && (
        <div className="mx-5 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs font-bold text-green-700 mb-2">✨ Latest Updates:</p>
          <div className="flex flex-wrap gap-2">
            {upcoming.map((item, i) => <span key={i} className="text-xs text-green-700 bg-green-100 border border-green-300 px-2.5 py-1 rounded-full font-semibold">📅 {item.text}</span>)}
          </div>
        </div>
      )}
      {expired.length > 0 && (
        <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-bold text-red-700 mb-2">❌ These dates have passed:</p>
          <div className="flex flex-wrap gap-2">
            {expired.map((item, i) => <del key={i} className="text-xs text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded decoration-red-500 decoration-2">{item.text}</del>)}
          </div>
        </div>
      )}
      <p className="text-[10px] text-gray-400 px-5 py-3 border-t border-amber-100 mt-3">Gemini AI • Verify from official source.</p>
    </div>
  )
}

async function AiFaqBox({ content, title }) {
  const text = await generateWithFallback(
    `Generate 4 FAQs for this Indian government scheme. Return ONLY a JSON array (no markdown): [{"question": "Q", "answer": "A"}]\n\nTitle: ${title}\nContent: ${content.slice(0, 1500)}`,
    600
  )
  if (!text) return null
  try {
    const clean = text.replace(/^\x60{3}json\s*/i,'').replace(/\x60{3}\s*$/i,'').trim()
    const match = clean.match(/\[.*\]/s)
    if (!match) return null
    const faqs = JSON.parse(match[0])
    if (!Array.isArray(faqs) || !faqs.length) return null
    const faqSchema = {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(f=>({'@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:f.answer}}))}
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
export default async function SchemeDetailPage({ params }) {
  let scheme = null
  try {
    const res = await fetch(`${API_BASE}/schemes/slug/${params.slug}`, { next: { revalidate: 86400 } })
    const data = await res.json()
    scheme = data?.data
  } catch {}

  if (!scheme) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-gray-700 mb-2">Scheme Not Found</h1>
      <Link href="/yojana" className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg hover:bg-[#153060]">Back to Yojana</Link>
    </div>
  )

  const startDate = scheme.schemeStartDate ? new Date(scheme.schemeStartDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : null
  const lastDate = scheme.schemeLastDate ? new Date(scheme.schemeLastDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'Ongoing'
  const aiContent = `${scheme.schemeTitle}\n${scheme.aboutScheme||''}\n${scheme.process||''}\n${(scheme.requiredDocs||[]).join(', ')}`
  const canonical = `${SITE_URL}/yojana/${scheme.slug}`

  const govServiceSchema = {'@context':'https://schema.org','@type':'GovernmentService',name:scheme.schemeTitle,description:scheme.aboutScheme?.slice(0,300)||scheme.schemeTitle,serviceType:scheme.schemetype,provider:{'@type':'GovernmentOrganization',name:scheme.state?`Government of ${scheme.state.split('(')[0].trim()}`:'Government of India'},areaServed:{'@type':'State',name:scheme.state||'India'},url:scheme.applyLink,termsOfService:canonical}
  const breadcrumbSchema = {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:SITE_URL},{'@type':'ListItem',position:2,name:'Yojana',item:`${SITE_URL}/yojana`},{'@type':'ListItem',position:3,name:scheme.schemeTitle,item:canonical}]}

  return (
    <div className="bg-gray-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(govServiceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#153060] text-white py-10 px-4">
        <div className="container mx-auto max-w-4xl">
          <nav className="text-sm text-blue-300 mb-4 flex flex-wrap gap-1">
            <Link href="/" className="hover:text-white transition-colors">Home</Link><span>&rsaquo;</span>
            <Link href="/yojana" className="hover:text-white transition-colors">Yojana</Link><span>&rsaquo;</span>
            <span className="text-white truncate max-w-xs">{scheme.schemeTitle}</span>
          </nav>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs bg-[#f59e0b]/20 text-[#f59e0b] px-3 py-1 rounded-full font-semibold">{scheme.schemetype||'Government Scheme'}</span>
            <span className="text-xs bg-white/10 text-white/80 px-3 py-1 rounded-full">{scheme.state||'All India'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">{scheme.schemeTitle}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Info Box */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[{label:'State',value:scheme.state?.includes('Pan-India')||scheme.state?.includes('All States')?'All India':scheme.state?.split('(')[0]?.trim()||'All India',icon:'🗺️'},{label:'Type',value:scheme.schemetype||'N/A',icon:'🏦'},{label:'Start Date',value:startDate||'N/A',icon:'📅'},{label:'Last Date',value:lastDate,icon:'⏰'}].map(item => (
            <div key={item.label} className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-xs text-gray-500">{item.label}</div>
              <div className="text-sm font-semibold text-gray-800 mt-0.5 line-clamp-1">{item.value}</div>
            </div>
          ))}
        </div>

        {/* AI Summary — shimmer → fade in → hidden if all fail */}
        <Suspense fallback={<AiSkeleton />}>
          <AiSummaryBox content={aiContent} title={scheme.schemeTitle} />
        </Suspense>

        {scheme.aboutScheme && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">📌 About This Scheme</h2>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{scheme.aboutScheme}</p>
          </div>
        )}

        <AdsenseUnit placement="detail-inarticle" className="mb-6" />

        {scheme.requiredDocs && scheme.requiredDocs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">📄 Required Documents</h2>
            <ul className="space-y-2">
              {scheme.requiredDocs.map((doc, i) => <li key={i} className="flex items-start gap-3 text-sm text-gray-700"><span className="text-green-500 mt-0.5 shrink-0">✓</span><span>{doc}</span></li>)}
            </ul>
          </div>
        )}

        {scheme.process && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">🛠️ How to Apply</h2>
            <div className="space-y-3">
              {scheme.process.split('\n').filter(Boolean).map((step, i) => (
                <div key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className="w-6 h-6 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i+1}</span>
                  <span className="leading-relaxed">{step.replace(/^\d+\.\s*/,'')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Suspense fallback={<FaqSkeleton />}>
          <AiFaqBox content={aiContent} title={scheme.schemeTitle} />
        </Suspense>

        {scheme.applyLink && (
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#1e4a7f] rounded-2xl p-6 text-center text-white mb-6">
            <h3 className="text-lg font-bold mb-2">Apply for This Scheme</h3>
            <p className="text-blue-200 text-sm mb-4">Click below to visit the official portal.</p>
            <a href={scheme.applyLink} target="_blank" rel="nofollow noopener noreferrer"
              className="inline-block bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-lg">
              Apply Now →
            </a>
          </div>
        )}
        <Link href="/yojana" className="text-[#1e3a5f] hover:underline text-sm font-medium">&larr; Back to All Yojana</Link>
      </div>
    </div>
  )
}
