const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export default async function sitemap() {
  const staticPages = [
    { url: `${SITE_URL}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/jobs`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/yojana`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/disclaimer`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ]

  let jobUrls = []
  let schemeUrls = []
  let blogUrls = []

  try {
    const jobsRes = await fetch(`${API_BASE}/post/?page=1&limit=200`, { next: { revalidate: 3600 } })
    const jobsData = await jobsRes.json()
    jobUrls = (jobsData?.data || []).map(j => ({
      url: `${SITE_URL}/jobs/${j.slug}`,
      lastModified: j.updatedAt ? new Date(j.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  } catch {}

  try {
    const schemesRes = await fetch(`${API_BASE}/schemes/?page=1&limit=200`, { next: { revalidate: 86400 } })
    const schemesData = await schemesRes.json()
    schemeUrls = (schemesData?.data || []).map(s => ({
      url: `${SITE_URL}/yojana/${s.slug}`,
      lastModified: s.updatedAt ? new Date(s.updatedAt) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))
  } catch {}

  try {
    const blogsRes = await fetch(`${API_BASE}/blog/?page=1&limit=131`, { next: { revalidate: 86400 } })
    const blogsData = await blogsRes.json()
    blogUrls = (blogsData?.data || []).map(b => ({
      url: `${SITE_URL}/blog/${b.slug}`,
      lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))
  } catch {}

  return [...staticPages, ...jobUrls, ...schemeUrls, ...blogUrls]
}
