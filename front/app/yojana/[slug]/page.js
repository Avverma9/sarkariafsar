import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import AdsenseUnit from '@/components/ads/AdsenseUnitClient'

import { SERVER_API_BASE } from '@/lib/server-api'
const API_BASE = SERVER_API_BASE
const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL  || 'https://sarkariafsar.com'

// ============ generateMetadata ============
export async function generateMetadata({ params }) {
  const { slug } = await params
  try {
    const res = await fetch(`${API_BASE}/schemes/slug/${slug}`, {
      next: { revalidate: 7200 },
    })
    if (!res.ok) return { title: 'Scheme Not Found — Sarkari Afsar' }
    const data = await res.json()
    const scheme = data?.data
    if (!scheme) return { title: 'Scheme Not Found — Sarkari Afsar' }

    const canonical = `${SITE_URL}/yojana/${scheme.slug}`
    const title     = scheme.schemeTitle
    const description =
      scheme.aboutScheme?.slice(0, 155) ||
      `${scheme.schemeTitle} details, eligibility, benefits and how to apply.`
    const keywords = [
      ...new Set(
        [title, scheme.state, scheme.category, ...(scheme.tags || []),
         'sarkari yojana', 'government scheme', 'sarkari afsar']
          .filter(Boolean),
      ),
    ].slice(0, 15)

    return {
      title: `${title} — Sarkari Afsar`,
      description,
      keywords,
      alternates: {
        canonical,
        languages: { 'en-IN': canonical, 'x-default': canonical },
      },
      openGraph: {
        title, description, url: canonical, siteName: 'Sarkari Afsar',
        images: [{ url: `${SITE_URL}/api/og?title=${encodeURIComponent(title)}&type=scheme`, width: 1200, height: 630, alt: title }],
        locale: 'en_IN', type: 'article',
      },
      twitter: { card: 'summary_large_image', title, description, site: '@sarkariafsar' },
    }
  } catch {
    return { title: 'Scheme Details — Sarkari Afsar' }
  }
}

// ============ Helpers ============
const MS_DAY = 86_400_000

function formatDate(value) {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d) ? null : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isPanIndia(state) {
  return !!state && /pan|all/i.test(state)
}

function buildSchemeIntro(scheme) {
  const coverage = scheme.state && !isPanIndia(scheme.state) ? scheme.state : 'all states'
  const parts = [
    `${scheme.schemeTitle} is a ${scheme.schemetype || 'government'} initiative targeting ${coverage === 'all states' ? 'residents across India' : coverage}.`,
  ]
  if (scheme.aboutScheme) {
    const sentence = scheme.aboutScheme.split('.').find(Boolean)
    if (sentence) parts.push(sentence.trim())
  }
  if (scheme.applyLink) parts.push('Applications are routed through the official portal, so save the link for reference.')
  const deadline = formatDate(scheme.schemeLastDate)
  if (deadline) parts.push(`Deadline: ${deadline}.`)
  return parts.join(' ')
}

function buildSchemePros(scheme) {
  const pros = []
  if (scheme.requiredDocs?.length) {
    pros.push(`Specifies ${scheme.requiredDocs.length} document${scheme.requiredDocs.length === 1 ? '' : 's'}, making it easier to collect proof ahead of time.`)
  }
  if (scheme.applyLink) pros.push('Direct application link is recorded so you can jump to the source notice quickly.')
  const startDate = formatDate(scheme.schemeStartDate)
  if (startDate) pros.push(`Rolled out from ${startDate}, so the timeline is clear.`)
  if (isPanIndia(scheme.state)) {
    pros.push('Pan-India coverage ensures the scheme is available widely.')
  } else if (scheme.state) {
    pros.push(`Tailored for ${scheme.state} residents with localized support.`)
  }
  return pros
}

function buildSchemeCons(scheme) {
  const cons = []
  const today = new Date(); today.setHours(0, 0, 0, 0)
  if (!scheme.applyLink) {
    cons.push('Application link is missing, so you may need to navigate to the portal manually.')
  }
  if (scheme.schemeLastDate) {
    const diff = Math.round((new Date(scheme.schemeLastDate) - today) / MS_DAY)
    if (diff >= 0 && diff <= 14) {
      cons.push(`Deadline arrives in ${diff} day${diff === 1 ? '' : 's'}; plan submissions accordingly.`)
    } else if (diff < 0) {
      cons.push('The deadline noted here has already passed; check if the authority extended the window.')
    }
  } else {
    cons.push('Closing date is not listed yet, so keep following the official source for updates.')
  }
  if (scheme.state && !isPanIndia(scheme.state)) {
    cons.push(`Limited to ${scheme.state} residents, so other states will need a different benefit portal.`)
  }
  return cons
}

function buildSchemeStateNote(scheme) {
  if (!scheme.state) return ''
  if (isPanIndia(scheme.state)) return 'Available across states, yet district offices may still ask for local attestations.'
  return `${scheme.state} residents should confirm the nodal office and preferred document formats before applying.`
}

function buildSchemeInsights(scheme) {
  const insights = []
  const timeline = []
  const start = formatDate(scheme.schemeStartDate)
  const end   = formatDate(scheme.schemeLastDate)
  if (start) timeline.push(`Launched on ${start}`)
  if (end)   timeline.push(`Closes on ${end}`)
  if (timeline.length) insights.push({ title: 'Timeline snapshot', body: timeline.join(' • ') })
  if (scheme.requiredDocs?.length) {
    const docs    = scheme.requiredDocs.map(d => d.trim()).filter(Boolean)
    const preview = docs.slice(0, 3).join(', ')
    const suffix  = docs.length > 3 ? ', …' : ''
    insights.push({ title: 'Documents to gather', body: `Prepare ${docs.length} doc${docs.length === 1 ? '' : 's'} such as ${preview}${suffix}.` })
  }
  if (scheme.officialSourceUrl) {
    insights.push({ title: 'Official source', body: `Verify the latest notification at ${scheme.officialSourceUrl}.` })
  }
  return insights
}

// ============ Main Page ============
export default async function SchemeDetailPage({ params }) {
  const { slug } = await params
  let scheme = null

  try {
    // ✅ PERFORMANCE: Single fetch, proper error check
    const res = await fetch(`${API_BASE}/schemes/slug/${slug}`, {
      next: { revalidate: 7200 },
    })
    if (res.ok) {
      const data = await res.json()
      scheme = data?.data ?? null
    }
  } catch {
    // intentionally silent — notFound() handles null below
  }

  if (!scheme) return notFound()

  const startDate      = formatDate(scheme.schemeStartDate) ?? 'N/A'
  const lastDate       = formatDate(scheme.schemeLastDate)  ?? 'Ongoing'
  const canonical      = `${SITE_URL}/yojana/${scheme.slug}`
  const schemeIntro    = buildSchemeIntro(scheme)
  const schemePros     = buildSchemePros(scheme)
  const schemeCons     = buildSchemeCons(scheme)
  const schemeStateNote = buildSchemeStateNote(scheme)
  const schemeInsights = buildSchemeInsights(scheme)

  // ✅ BEST PRACTICES: Stable, serialisable JSON — no circular refs, no undefined values
  const govServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: scheme.schemeTitle,
    description: (scheme.aboutScheme?.slice(0, 300) || scheme.schemeTitle),
    serviceType: scheme.schemetype || null,
    provider: {
      '@type': 'GovernmentOrganization',
      name: scheme.state
        ? `Government of ${scheme.state.split('(')[0].trim()}`
        : 'Government of India',
    },
    areaServed: { '@type': 'State', name: scheme.state || 'India' },
    ...(scheme.applyLink ? { url: scheme.applyLink } : {}),
    termsOfService: canonical,
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: scheme.schemeTitle,
    description: scheme.aboutScheme?.slice(0, 155) || `${scheme.schemeTitle} details`,
    url: canonical,
    mainEntityOfPage: canonical,
    image: `${SITE_URL}/api/og?title=${encodeURIComponent(scheme.schemeTitle)}&type=scheme`,
    publisher: { '@type': 'Organization', name: 'Sarkari Afsar', url: SITE_URL },
    author: scheme.authorName
      ? {
          '@type': 'Person',
          name: scheme.authorName,
          ...(scheme.authorProfileUrl ? { url: scheme.authorProfileUrl } : {}),
          ...(scheme.authorBio        ? { description: scheme.authorBio }  : {}),
        }
      : { '@type': 'Organization', name: 'Sarkari Afsar', url: SITE_URL },
    ...(scheme.createdAt ? { datePublished: new Date(scheme.createdAt).toISOString() } : {}),
    ...(scheme.updatedAt ? { dateModified:  new Date(scheme.updatedAt).toISOString() } : {}),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',   item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Yojana', item: `${SITE_URL}/yojana` },
      { '@type': 'ListItem', position: 3, name: scheme.schemeTitle, item: canonical },
    ],
  }

  const infoCards = [
    {
      label: 'State',
      value: isPanIndia(scheme.state) ? 'All India' : (scheme.state?.split('(')[0]?.trim() || 'All India'),
      icon: '🗺️',
    },
    { label: 'Type',       value: scheme.schemetype || 'N/A', icon: '🏦' },
    { label: 'Start Date', value: startDate,                   icon: '📅' },
    { label: 'Last Date',  value: lastDate,                    icon: '⏰' },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ✅ BEST PRACTICES: JSON-LD in <head> via Next.js metadata is preferred,
          but inline scripts are fine — ensure JSON is always valid */}
      <script
        type="application/ld+json"
        // ✅ suppressHydrationWarning prevents React hydration mismatch warnings
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(govServiceSchema) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* ✅ PERFORMANCE: Use <header> semantic element → better LCP hint */}
      <header className="bg-gradient-to-r from-[#1e3a5f] to-[#153060] text-white py-10 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* ✅ ACCESSIBILITY: aria-label on nav */}
          <nav aria-label="Breadcrumb" className="text-sm text-blue-300 mb-4 flex flex-wrap gap-1">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span aria-hidden="true">&rsaquo;</span>
            <Link href="/yojana" className="hover:text-white transition-colors">Yojana</Link>
            <span aria-hidden="true">&rsaquo;</span>
            {/* ✅ ACCESSIBILITY: aria-current for active breadcrumb */}
            <span className="text-white truncate max-w-xs" aria-current="page">{scheme.schemeTitle}</span>
          </nav>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs bg-[#f59e0b]/20 text-[#f59e0b] px-3 py-1 rounded-full font-semibold">
              {scheme.schemetype || 'Government Scheme'}
            </span>
            <span className="text-xs bg-white/10 text-white/80 px-3 py-1 rounded-full">
              {scheme.state || 'All India'}
            </span>
          </div>

          {/* ✅ PERFORMANCE: h1 is the LCP element — keep it lean */}
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">{scheme.schemeTitle}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {infoCards.map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
              {/* ✅ ACCESSIBILITY: aria-hidden on decorative emoji */}
              <div className="text-xl mb-1" aria-hidden="true">{icon}</div>
              <div className="text-xs text-gray-500">{label}</div>
              <div className="text-sm font-semibold text-gray-800 mt-0.5 line-clamp-1">{value}</div>
            </div>
          ))}
        </div>

        {schemeIntro && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">Why this scheme matters now</h2>
            <p className="text-gray-700 text-sm leading-relaxed">{schemeIntro}</p>
            {schemeStateNote && (
              <p className="text-xs text-gray-500 mt-3 italic">{schemeStateNote}</p>
            )}
          </section>
        )}

        {scheme.aboutScheme && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">
              <span aria-hidden="true">📌 </span>About This Scheme
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{scheme.aboutScheme}</p>
          </section>
        )}

        {/* ✅ PERFORMANCE: Ad loads lazily — wrapped in Suspense as extra safety */}
        <Suspense fallback={<div className="mb-6 h-[100px] bg-gray-100 rounded-2xl" aria-hidden="true" />}>
          <AdsenseUnit placement="detail-inarticle" className="mb-6" />
        </Suspense>

        {scheme.requiredDocs?.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">
              <span aria-hidden="true">📄 </span>Required Documents
            </h2>
            {/* ✅ ACCESSIBILITY: use <ul> with proper role */}
            <ul className="space-y-2">
              {scheme.requiredDocs.map((doc, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  {/* ✅ ACCESSIBILITY: screen-reader text instead of bare emoji */}
                  <span className="text-green-500 mt-0.5 shrink-0" aria-label="Checked">✓</span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {scheme.process && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">
              <span aria-hidden="true">🛠️ </span>How to Apply
            </h2>
            <ol className="space-y-3">
              {scheme.process.split('\n').filter(Boolean).map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span
                    className="w-6 h-6 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {(schemeInsights.length > 0 || schemePros.length > 0 || schemeCons.length > 0) && (
          <div className="space-y-6 mb-6">
            {schemeInsights.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Snapshot insights</h2>
                <div className="space-y-4">
                  {schemeInsights.map((insight, index) => (
                    <div key={index}>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">{insight.title}</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{insight.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(schemePros.length > 0 || schemeCons.length > 0) && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {schemePros.length > 0 && (
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1e3a5f] mb-3">Pros</h2>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {schemePros.map((item, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="text-[#f59e0b] font-semibold" aria-hidden="true">▸</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {schemeCons.length > 0 && (
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1e3a5f] mb-3">Cons</h2>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {schemeCons.map((item, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="text-red-500 font-semibold" aria-hidden="true">▸</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        <Link href="/yojana" className="text-[#1e3a5f] hover:underline text-sm font-medium">
          &larr; Back to All Yojana
        </Link>
      </main>
    </div>
  )
}