import Link from 'next/link'
import MockTestsClient from './MockTestsClient'
import { SERVER_API_BASE } from '@/lib/server-api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'Mock Tests — Sarkari Afsar',
  description: 'Practice with free and paid mock tests for SSC, UPSC, Railway, Banking, Police and State PSC exams. Attempt full-length tests and boost your score.',
  alternates: { canonical: `${SITE_URL}/mock-tests` },
  openGraph: {
    title: 'Mock Tests — Sarkari Afsar',
    url: `${SITE_URL}/mock-tests`,
    siteName: 'Sarkari Afsar',
    locale: 'en_IN',
    type: 'website',
  },
}

async function getMockTests() {
  try {
    const res = await fetch(`${SERVER_API_BASE}/mock-tests?status=published&limit=100`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch {
    return []
  }
}

export default async function MockTestsPage() {
  const tests = await getMockTests()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#7c3aed] text-white py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-blue-300 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>›</span>
            <span>Mock Tests</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3">📝 Mock Tests</h1>
          <p className="text-blue-200 text-lg max-w-2xl">Practice with full-length mock tests designed by experts for SSC, UPSC, Railway, Banking &amp; more. Attempt free tests or unlock premium series.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-medium">⏱️ Timed Exams</div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-medium">📊 Detailed Analysis</div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-medium">🏆 Leaderboard</div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-medium">✅ {tests.filter(t=>t.isFree).length} Free Tests</div>
          </div>
        </div>
      </div>

      <MockTestsClient tests={tests} />
    </div>
  )
}
