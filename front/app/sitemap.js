const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export default async function sitemap() {
  const staticPages = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
      images: [ { url: `${SITE_URL}/api/og?title=Sarkari+Afsar` } ],
    },
    {
      url: `${SITE_URL}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
      images: [ { url: `${SITE_URL}/api/og?title=Latest+Sarkari+Jobs+2026&type=jobs` } ],
    },
    // Section-canonical URLs (clean URLs, no query params)
    {
      url: `${SITE_URL}/results`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
      images: [ { url: `${SITE_URL}/api/og?title=Sarkari+Results+2026&type=results` } ],
    },
    {
      url: `${SITE_URL}/latest-jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
      images: [ { url: `${SITE_URL}/api/og?title=Latest+Government+Jobs+2026&type=jobs` } ],
    },
    {
      url: `${SITE_URL}/admit-cards`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
      images: [ { url: `${SITE_URL}/api/og?title=Admit+Cards+2026&type=admit-cards` } ],
    },
    {
      url: `${SITE_URL}/admission`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
      images: [ { url: `${SITE_URL}/api/og?title=Admission+2026&type=admission` } ],
    },
    {
      url: `${SITE_URL}/yojana`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
      images: [ { url: `${SITE_URL}/api/og?title=Government+Yojana+2026&type=yojana` } ],
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
      images: [ { url: `${SITE_URL}/api/og?title=Sarkari+Afsar+Blog&type=blog` } ],
    },
    { url: `${SITE_URL}/about`,          lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/contact`,        lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${SITE_URL}/disclaimer`,     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  ]

  let jobUrls = []
  let schemeUrls = []
  let blogUrls = []

  try {
    const jobsRes = await fetch(`${API_BASE}/post/sitemap`, { next: { revalidate: 3600 } })
    const jobsData = await jobsRes.json()
    jobUrls = (jobsData?.data || []).map(j => ({
      url: `${SITE_URL}/jobs/${j.slug}`,
      lastModified: j.updatedAt ? new Date(j.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
      images: [ { url: `${SITE_URL}/api/og?title=${encodeURIComponent(j.title || j.slug)}&type=job` } ],
    }))
  } catch {}

  try {
    const schemesRes = await fetch(`${API_BASE}/schemes/sitemap`, { next: { revalidate: 86400 } })
    const schemesData = await schemesRes.json()
    schemeUrls = (schemesData?.data || []).map(s => ({
      url: `${SITE_URL}/yojana/${s.slug}`,
      lastModified: s.updatedAt ? new Date(s.updatedAt) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
      images: [ { url: `${SITE_URL}/api/og?title=${encodeURIComponent(s.title || s.slug)}&type=yojana` } ],
    }))
  } catch {}

  try {
    let page = 1
    while (true) {
      const blogsRes = await fetch(`${API_BASE}/blog/?page=${page}&limit=100`, { next: { revalidate: 86400 } })
      const blogsData = await blogsRes.json()
      const batch = blogsData?.data || []
      blogUrls.push(...batch.map(b => ({
        url: `${SITE_URL}/blog/${b.slug}`,
        lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      })))
      if (batch.length < 100) break
      page++
    }
  } catch {}

  return [...staticPages, ...jobUrls, ...schemeUrls, ...blogUrls]
}
