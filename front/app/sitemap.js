const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

// ── Shard IDs ─────────────────────────────────────────────────────────────────
// Next.js generates /sitemap/0, /sitemap/1 ... and a sitemap index at /sitemap.xml
// 0 = static pages  |  1 = jobs  |  2 = yojana  |  3 = blog
export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]
}

// ── Shard router ──────────────────────────────────────────────────────────────
export default async function sitemap({ id }) {
  switch (id) {
    case 0: return staticPages()
    case 1: return jobsPages()
    case 2: return yojanaPages()
    case 3: return blogPages()
    default: return []
  }
}

// ── Static pages ──────────────────────────────────────────────────────────────
function staticPages() {
  return [
    { url: `${SITE_URL}`,              lastModified: new Date(),               changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/jobs`,         lastModified: new Date(),               changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/results`,      lastModified: new Date(),               changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/latest-jobs`,  lastModified: new Date(),               changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/admit-cards`,  lastModified: new Date(),               changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/admission`,    lastModified: new Date(),               changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE_URL}/yojana`,       lastModified: new Date(),               changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE_URL}/blog`,         lastModified: new Date(),               changeFrequency: 'daily',   priority: 0.7 },
    { url: `${SITE_URL}/about`,        lastModified: new Date('2024-01-01'),   changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/contact`,      lastModified: new Date('2024-01-01'),   changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/privacy-policy`, lastModified: new Date('2024-01-01'), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${SITE_URL}/disclaimer`,   lastModified: new Date('2024-01-01'),   changeFrequency: 'yearly',  priority: 0.2 },
  ]
}

// ── Jobs (noIndex:true already excluded by server endpoint) ──────────────────
async function jobsPages() {
  try {
    const res = await fetch(`${API_BASE}/post/sitemap`, { next: { revalidate: 3600 } })
    const data = await res.json()
    return (data?.data || []).map(j => ({
      url: `${SITE_URL}/jobs/${j.slug}`,
      lastModified: j.updatedAt ? new Date(j.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  } catch { return [] }
}

// ── Yojana ────────────────────────────────────────────────────────────────────
async function yojanaPages() {
  try {
    const res = await fetch(`${API_BASE}/schemes/sitemap`, { next: { revalidate: 86400 } })
    const data = await res.json()
    return (data?.data || []).map(s => ({
      url: `${SITE_URL}/yojana/${s.slug}`,
      lastModified: s.updatedAt ? new Date(s.updatedAt) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))
  } catch { return [] }
}

// ── Blog ──────────────────────────────────────────────────────────────────────
async function blogPages() {
  const urls = []
  try {
    let page = 1
    while (true) {
      const res = await fetch(`${API_BASE}/blog/?page=${page}&limit=100`, { next: { revalidate: 86400 } })
      const data = await res.json()
      const batch = data?.data || []
      urls.push(...batch.map(b => ({
        url: `${SITE_URL}/blog/${b.slug}`,
        lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      })))
      if (batch.length < 100) break
      page++
    }
  } catch {}
  return urls
}
