import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

const SECTION_NAME = 'Admission'
const SECTION_SLUG = 'admission'
const COLOR = { bg: 'bg-orange-600', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🎓' }

export async function generateMetadata({ searchParams }) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const canonical = page > 1
    ? `${SITE_URL}/${SECTION_SLUG}?page=${page}`
    : `${SITE_URL}/${SECTION_SLUG}`
  return {
    title: `Sarkari Admission 2026 — Government College Admissions — Sarkari Afsar`,
    description: 'Latest Sarkari Admission 2026. Government college admissions, university entrance exams, state and central admission notifications at Sarkari Afsar.',
    alternates: { canonical },
    openGraph: {
      title: 'Sarkari Admission 2026 — Sarkari Afsar',
      description: 'Latest government college admissions 2026 — university entrance exams, state and central admission notifications.',
      url: canonical,
      siteName: 'Sarkari Afsar',
      images: [{ url: `${SITE_URL}/api/og?title=Sarkari+Admission+2026&type=admission`, width: 1200, height: 630, alt: 'Sarkari Admission 2026 — Sarkari Afsar' }],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: 'Sarkari Admission 2026 — Sarkari Afsar', description: 'Latest government college admissions 2026 — university entrance exams and state notifications.', site: '@sarkariafsar' },
    robots: page > 1 ? { index: false, follow: true } : { index: true, follow: true },
  }
}

async function fetchSection(page = 1, limit = 30) {
  try {
    const res = await fetch(
      `${API_BASE}/post/?page=${page}&limit=${limit}&sectionName=${encodeURIComponent(SECTION_NAME)}`,
      { next: { revalidate: 1800 } }
    )
    const data = await res.json()
    return { jobs: data?.data || [], total: data?.pagination?.total || 0, totalPages: data?.pagination?.totalPages || 1 }
  } catch { return { jobs: [], total: 0, totalPages: 1 } }
}

function JobRow({ job }) {
  const lastDate = job.applyLastDate
    ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-2.5">
        <Link href={`/jobs/${job.slug}`} className="text-orange-700 hover:underline font-medium leading-snug line-clamp-2">
          {job.title}
        </Link>
      </td>
      <td className="px-4 py-2.5 text-center text-xs text-gray-500 hidden sm:table-cell whitespace-nowrap">{lastDate}</td>
      <td className="px-4 py-2.5 text-center">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${job.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {job.isActive ? 'Active' : 'Closed'}
        </span>
      </td>
    </tr>
  )
}

function Pagination({ page, totalPages }) {
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
      {page > 1
        ? <Link href={`/${SECTION_SLUG}?page=${page - 1}`} className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">← Prev</Link>
        : <span className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white opacity-40 cursor-not-allowed">← Prev</span>
      }
      {pages.map(p => (
        <Link key={p} href={`/${SECTION_SLUG}?page=${p}`}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${p === page ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
        >{p}</Link>
      ))}
      {page < totalPages
        ? <Link href={`/${SECTION_SLUG}?page=${page + 1}`} className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">Next →</Link>
        : <span className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white opacity-40 cursor-not-allowed">Next →</span>
      }
    </div>
  )
}

export default async function AdmissionPage({ searchParams }) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const { jobs, total, totalPages } = await fetchSection(page, 30)

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Admission', item: `${SITE_URL}/admission` },
    ],
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="bg-[#1e3a5f] text-white py-14 px-4">
        <div className="container mx-auto max-w-5xl">
          <nav className="text-sm text-blue-300 mb-3" aria-label="breadcrumb">
            <Link href="/" className="hover:text-white">Home</Link> &rsaquo;{' '}
            <span className="text-white">Admission</span>
          </nav>
          <h1 className="text-3xl font-bold">Sarkari Admission 2026</h1>
          <p className="text-blue-200 mt-2">Government college admissions and university entrance notifications</p>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className={`bg-white rounded-xl border ${COLOR.border} overflow-hidden shadow-sm`}>
          <div className={`${COLOR.bg} text-white px-4 py-3 flex items-center justify-between`}>
            <h2 className="font-bold text-base flex items-center gap-2">
              <span>{COLOR.icon}</span> {SECTION_NAME}
              <span className="text-white/70 font-normal text-sm ml-1">({total} posts)</span>
            </h2>
            <Link href="/jobs" className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors">
              ← All Categories
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${COLOR.light} ${COLOR.text} text-xs font-semibold`}>
                  <th className="px-4 py-2.5 text-left w-[60%]">Post Name</th>
                  <th className="px-4 py-2.5 text-center hidden sm:table-cell">Last Date</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.length === 0
                  ? <tr><td colSpan={3} className="py-20 text-center text-gray-400">No admissions found</td></tr>
                  : jobs.map((job, i) => <JobRow key={job._id || i} job={job} />)
                }
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} />}
      </div>
    </div>
  )
}
