import Link from 'next/link'
import BooksClient from './BooksClient'
import { SERVER_API_BASE } from '@/lib/server-api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'Books & Study Material — Sarkari Afsar',
  description: 'Buy best books, notes, PYQs and study material for government exams — SSC, UPSC, Railway, Banking, State PSC and more.',
  alternates: { canonical: `${SITE_URL}/books` },
  openGraph: {
    title: 'Books & Study Material — Sarkari Afsar',
    url: `${SITE_URL}/books`,
    siteName: 'Sarkari Afsar',
    locale: 'en_IN',
    type: 'website',
  },
}

async function getResources() {
  try {
    const res = await fetch(`${SERVER_API_BASE}/resources?limit=100&isActive=true`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch {
    return []
  }
}

export default async function BooksPage() {
  const resources = await getResources()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#1d4ed8] text-white py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-blue-300 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>›</span>
            <span>Books & Study Material</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3">📚 Books &amp; Study Material</h1>
          <p className="text-blue-200 text-lg max-w-2xl">Expert-curated books, PYQs, notes and syllabus PDFs for SSC, UPSC, Railway, Banking &amp; State PSC exams. Instant digital delivery.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-medium">⚡ Instant Access</div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-medium">💰 Best Price Guarantee</div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-medium">📱 Read on Any Device</div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-medium">✅ {resources.filter(r=>r.isFree).length} Free Resources</div>
          </div>
        </div>
      </div>

      <BooksClient resources={resources} />
    </div>
  )
}
