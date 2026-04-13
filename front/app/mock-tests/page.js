import Link from 'next/link'

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

const FILTERS = [
  { label: 'All', icon: '📦' },
  { label: 'SSC', icon: '📝' },
  { label: 'UPSC', icon: '🏛️' },
  { label: 'Railway', icon: '🚂' },
  { label: 'Banking', icon: '🏦' },
  { label: 'Police', icon: '👮' },
  { label: 'State PSC', icon: '🗺️' },
]

const TESTS = [
  {
    id: 1,
    title: 'SSC CGL Tier-1 Full Mock Test 1',
    exam: 'SSC CGL',
    questions: 100,
    duration: '60 min',
    difficulty: 'Medium',
    diffColor: 'text-amber-600 bg-amber-50',
    price: 0,
    attempts: '12,430',
    badge: 'Free',
    badgeColor: 'bg-green-500',
    icon: '📝',
    topics: ['Quant', 'English', 'Reasoning', 'GK'],
  },
  {
    id: 2,
    title: 'UPSC Prelims GS Paper-1 Mock Test',
    exam: 'UPSC',
    questions: 100,
    duration: '120 min',
    difficulty: 'Hard',
    diffColor: 'text-red-600 bg-red-50',
    price: 99,
    attempts: '5,871',
    badge: 'Popular',
    badgeColor: 'bg-blue-500',
    icon: '🏛️',
    topics: ['History', 'Geography', 'Polity', 'Economy', 'Environment'],
  },
  {
    id: 3,
    title: 'Railway NTPC CBT-1 Mock Test',
    exam: 'Railway NTPC',
    questions: 100,
    duration: '90 min',
    difficulty: 'Easy',
    diffColor: 'text-green-600 bg-green-50',
    price: 0,
    attempts: '9,214',
    badge: 'Free',
    badgeColor: 'bg-green-500',
    icon: '🚂',
    topics: ['Maths', 'General Intelligence', 'General Awareness'],
  },
  {
    id: 4,
    title: 'IBPS PO Prelims Full Mock Test',
    exam: 'Banking',
    questions: 100,
    duration: '60 min',
    difficulty: 'Medium',
    diffColor: 'text-amber-600 bg-amber-50',
    price: 79,
    attempts: '7,503',
    badge: 'New',
    badgeColor: 'bg-purple-500',
    icon: '🏦',
    topics: ['Quant', 'English', 'Reasoning'],
  },
  {
    id: 5,
    title: 'SSC CHSL Tier-1 Practice Test',
    exam: 'SSC CGL',
    questions: 100,
    duration: '60 min',
    difficulty: 'Easy',
    diffColor: 'text-green-600 bg-green-50',
    price: 0,
    attempts: '8,102',
    badge: 'Free',
    badgeColor: 'bg-green-500',
    icon: '📄',
    topics: ['Quant', 'English', 'Reasoning', 'GK'],
  },
  {
    id: 6,
    title: 'Bihar Police Constable Mock Test',
    exam: 'Police',
    questions: 100,
    duration: '120 min',
    difficulty: 'Medium',
    diffColor: 'text-amber-600 bg-amber-50',
    price: 49,
    attempts: '4,219',
    badge: null,
    badgeColor: '',
    icon: '👮',
    topics: ['GK', 'Hindi', 'Maths', 'Science'],
  },
]

const STATS = [
  { value: '50,000+', label: 'Students Attempted', icon: '👨‍🎓' },
  { value: '200+', label: 'Mock Tests Available', icon: '📝' },
  { value: '15+', label: 'Exams Covered', icon: '🏆' },
  { value: '4.8★', label: 'Average Rating', icon: '⭐' },
]

export default function MockTestsPage() {
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
            <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-medium">✅ Instant Results</div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white border-b border-gray-100 py-5 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="font-bold text-[#1e3a5f] text-lg leading-none">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f, i) => (
            <button key={f.label} className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${i === 0 ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f] hover:text-[#1e3a5f]'}`}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {/* Tests grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTS.map(test => (
            <div key={test.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
              {/* Top color strip */}
              <div className="bg-gradient-to-r from-[#1e3a5f] to-[#1d4ed8] p-5 relative">
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{test.icon}</span>
                  <div className="flex flex-col items-end gap-1.5">
                    {test.badge && (
                      <span className={`${test.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>{test.badge}</span>
                    )}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${test.diffColor}`}>{test.difficulty}</span>
                  </div>
                </div>
                <p className="text-xs text-blue-300 mt-3 font-medium">{test.exam}</p>
                <h3 className="font-bold text-white text-base leading-snug mt-1 group-hover:text-[#f59e0b] transition-colors">{test.title}</h3>
              </div>

              <div className="p-5 flex flex-col flex-1">
                {/* Meta */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-base font-bold text-[#1e3a5f]">{test.questions}</p>
                    <p className="text-xs text-gray-400">Questions</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-base font-bold text-[#1e3a5f]">{test.duration}</p>
                    <p className="text-xs text-gray-400">Duration</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-base font-bold text-[#1e3a5f]">{test.attempts}</p>
                    <p className="text-xs text-gray-400">Attempts</p>
                  </div>
                </div>

                {/* Topics */}
                <div className="flex flex-wrap gap-1.5 mb-5 flex-1">
                  {test.topics.map(t => (
                    <span key={t} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>

                {/* CTA */}
                {test.price === 0 ? (
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Start Free Test
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button className="w-full bg-[#1e3a5f] hover:bg-[#1d4ed8] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                      Unlock — ₹{test.price}
                    </button>
                    <button className="w-full border border-gray-200 text-gray-500 hover:text-[#1e3a5f] hover:border-[#1e3a5f] text-xs py-1.5 rounded-xl transition-colors">
                      Preview (10 Qs)
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon */}
        <div className="mt-12 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-8 text-center">
          <p className="text-3xl mb-3">🎯</p>
          <h2 className="text-xl font-bold text-purple-800 mb-2">More Mock Tests Being Added</h2>
          <p className="text-purple-700 text-sm max-w-lg mx-auto">Full test series for UPSC, State PSC, Defence, Police and more exams are coming soon. Create a free account to get notified.</p>
          <div className="flex flex-wrap gap-3 justify-center mt-5">
            <Link href="/dashboard" className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
              Create Free Account
            </Link>
            <Link href="/jobs" className="bg-white border border-purple-200 hover:border-purple-400 text-purple-700 text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
              Browse Jobs →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
