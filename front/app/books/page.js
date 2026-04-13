import Link from 'next/link'

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

const CATEGORIES = [
  { label: 'All', value: 'all', icon: '📦' },
  { label: 'Books', value: 'book', icon: '📚' },
  { label: 'PYQ Papers', value: 'pyq', icon: '📄' },
  { label: 'Notes', value: 'notes', icon: '🗒️' },
  { label: 'Syllabus', value: 'syllabus', icon: '📋' },
  { label: 'Video Course', value: 'video', icon: '🎥' },
]

const EXAMS = ['SSC CGL', 'UPSC', 'Railway NTPC', 'Banking', 'State PSC', 'Police', 'Defence']

const BOOKS = [
  {
    id: 1,
    title: 'SSC CGL Complete Guide 2026',
    author: 'Sarkari Afsar Editorial',
    type: 'book',
    exam: 'SSC CGL',
    price: 299,
    originalPrice: 499,
    rating: 4.7,
    reviews: 218,
    badge: 'Bestseller',
    badgeColor: 'bg-amber-500',
    cover: '📗',
    desc: 'Complete study material covering all sections — Quant, English, Reasoning, GK with practice sets.',
  },
  {
    id: 2,
    title: 'UPSC Prelims PYQ 10 Years',
    author: 'Sarkari Afsar Editorial',
    type: 'pyq',
    exam: 'UPSC',
    price: 199,
    originalPrice: 349,
    rating: 4.8,
    reviews: 154,
    badge: 'New',
    badgeColor: 'bg-green-500',
    cover: '📘',
    desc: 'Last 10 years UPSC Prelims solved papers with detailed explanations and topic-wise analysis.',
  },
  {
    id: 3,
    title: 'Railway NTPC General Science Notes',
    author: 'Sarkari Afsar Editorial',
    type: 'notes',
    exam: 'Railway NTPC',
    price: 149,
    originalPrice: 249,
    rating: 4.5,
    reviews: 97,
    badge: null,
    badgeColor: '',
    cover: '📙',
    desc: 'Concise, exam-focused notes for General Science — Physics, Chemistry, Biology in simple Hindi & English.',
  },
  {
    id: 4,
    title: 'Banking Awareness Capsule 2026',
    author: 'Sarkari Afsar Editorial',
    type: 'book',
    exam: 'Banking',
    price: 179,
    originalPrice: 299,
    rating: 4.6,
    reviews: 131,
    badge: 'Hot',
    badgeColor: 'bg-red-500',
    cover: '📒',
    desc: 'Complete Banking Awareness + Current Affairs capsule for IBPS PO, Clerk, SBI PO exams.',
  },
  {
    id: 5,
    title: 'State PSC GK Handbook',
    author: 'Sarkari Afsar Editorial',
    type: 'notes',
    exam: 'State PSC',
    price: 129,
    originalPrice: 199,
    rating: 4.4,
    reviews: 76,
    badge: null,
    badgeColor: '',
    cover: '📓',
    desc: 'State-wise GK notes covering History, Geography, Polity and Economy for all major State PSC exams.',
  },
  {
    id: 6,
    title: 'SSC MTS + CHSL Full Syllabus PDF',
    author: 'Sarkari Afsar Editorial',
    type: 'syllabus',
    exam: 'SSC CGL',
    price: 49,
    originalPrice: 99,
    rating: 4.3,
    reviews: 52,
    badge: null,
    badgeColor: '',
    cover: '📃',
    desc: 'Official + updated syllabus PDF with exam pattern, marking scheme and important topics highlighted.',
  },
]

const TYPE_LABELS = {
  book: { label: 'Book', color: 'bg-blue-100 text-blue-700' },
  pyq: { label: 'PYQ', color: 'bg-purple-100 text-purple-700' },
  notes: { label: 'Notes', color: 'bg-green-100 text-green-700' },
  syllabus: { label: 'Syllabus', color: 'bg-orange-100 text-orange-700' },
  video: { label: 'Video', color: 'bg-red-100 text-red-700' },
}

function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

export default function BooksPage() {
  const discount = (orig, price) => Math.round(((orig - price) / orig) * 100)

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
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(c => (
            <button key={c.value} className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${c.value === 'all' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f] hover:text-[#1e3a5f]'}`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Exam filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {EXAMS.map(e => (
            <span key={e} className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">{e}</span>
          ))}
        </div>

        {/* Books grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BOOKS.map(book => {
            const type = TYPE_LABELS[book.type] || { label: book.type, color: 'bg-gray-100 text-gray-600' }
            return (
              <div key={book.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
                {/* Cover */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 h-36 flex items-center justify-center relative">
                  <span className="text-6xl">{book.cover}</span>
                  {book.badge && (
                    <span className={`absolute top-3 left-3 ${book.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>{book.badge}</span>
                  )}
                  <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full ${type.color}`}>{type.label}</span>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs text-blue-600 font-medium mb-1">{book.exam}</p>
                  <h3 className="font-bold text-[#1e3a5f] text-base leading-tight mb-1 group-hover:text-blue-700 transition-colors">{book.title}</h3>
                  <p className="text-xs text-gray-400 mb-2">by {book.author}</p>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-4">{book.desc}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <Stars rating={book.rating} />
                    <span className="text-xs text-gray-500">{book.rating} ({book.reviews} reviews)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-[#1e3a5f]">₹{book.price}</span>
                      <span className="text-sm text-gray-400 line-through mb-0.5">₹{book.originalPrice}</span>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded mb-0.5">{discount(book.originalPrice, book.price)}% off</span>
                    </div>
                  </div>

                  <button className="mt-4 w-full bg-[#1e3a5f] hover:bg-[#1d4ed8] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                    Buy Now — ₹{book.price}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Coming soon banner */}
        <div className="mt-12 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-8 text-center">
          <p className="text-3xl mb-3">🚀</p>
          <h2 className="text-xl font-bold text-amber-800 mb-2">More Resources Coming Soon</h2>
          <p className="text-amber-700 text-sm max-w-md mx-auto">We are continuously adding more books, video courses and study materials. Stay tuned!</p>
          <Link href="/blog" className="inline-block mt-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
            Read Exam Tips on Blog →
          </Link>
        </div>
      </div>
    </div>
  )
}
