import Link from 'next/link'
import { notFound } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export async function generateMetadata({ params }) {
  const { slug } = await params
  try {
    const res = await fetch(`${API_BASE}/blog/slug/${slug}`, { cache: 'no-store' })
    const data = await res.json()
    const blog = data?.data
    if (!blog) return { title: 'Blog - Sarkari Afsar' }
    const canonical = `${SITE_URL}/blog/${blog.slug || slug}`
    const title = blog.title || blog.slug?.replace(/-/g, ' ')
    const description = blog.excerpt || blog.intro?.slice(0, 155)
    const meta = {
      title: `${title} - Sarkari Afsar`,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'Sarkari Afsar',
        images: [{ url: `${SITE_URL}/api/og?title=${encodeURIComponent(title)}&type=blog`, width: 1200, height: 630, alt: title }],
        locale: 'en_IN',
        type: 'article',
      },
      twitter: { card: 'summary_large_image', title, description, site: '@sarkariafsar' },
    }
    if (blog.createdAt) meta.openGraph.publishedTime = new Date(blog.createdAt).toISOString()
    if (blog.updatedAt) meta.openGraph.modifiedTime = new Date(blog.updatedAt).toISOString()
    return meta
  } catch {
    return { title: 'Blog - Sarkari Afsar' }
  }
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params
  let blog = null
  try {
    const res = await fetch(`${API_BASE}/blog/slug/${slug}`, { cache: 'no-store' })
    const data = await res.json()
    blog = data?.data
  } catch {}

  if (!blog) return notFound()

  const date = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const title = blog.title || blog.slug?.replace(/-/g, ' ')
  const contentHtml = blog.scrapedContent?.contentHtml || ''
  const sections = Array.isArray(blog.sections) ? blog.sections : []
  const hasSections = sections.length > 0
  const readingTime = blog.readingTime || ''
  const canonical = `${SITE_URL}/blog/${blog.slug || slug}`
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: blog.excerpt || blog.intro?.slice(0, 155) || `${title} • Sarkari Afsar`,
    url: canonical,
    mainEntityOfPage: canonical,
    image: `${SITE_URL}/api/og?title=${encodeURIComponent(title)}&type=blog`,
    publisher: { '@type': 'Organization', name: 'Sarkari Afsar', url: SITE_URL },
    author: blog.author ? { '@type': 'Person', name: blog.author } : { '@type': 'Organization', name: 'Sarkari Afsar', url: SITE_URL },
  }
  if (blog.createdAt) articleSchema.datePublished = new Date(blog.createdAt).toISOString()
  if (blog.updatedAt) articleSchema.dateModified = new Date(blog.updatedAt).toISOString()

  return (
    <div className="bg-gray-50 min-h-screen">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="bg-[#1e3a5f] text-white py-10 px-4">
        <div className="container mx-auto max-w-3xl">
          <nav className="text-sm text-blue-300 mb-4">
            <Link href="/" className="hover:text-white">Home</Link> &rsaquo; <Link href="/blog" className="hover:text-white">Blog</Link> &rsaquo; <span className="text-white line-clamp-1">{title}</span>
          </nav>
          <span className="text-xs bg-purple-400/20 text-purple-200 px-3 py-1 rounded-full">{blog.category || 'Blog'}</span>
          <h1 className="text-2xl md:text-3xl font-bold mt-3 leading-tight capitalize">{title}</h1>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-blue-200">
            <span>✏️ {blog.author || 'Sarkari Afsar Editorial'}</span>
            {date && <span>📅 {date}</span>}
            {readingTime && <span>🕐 {readingTime}</span>}
          </div>
          {blog.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {blog.tags.map(tag => (
                <span key={tag} className="text-xs bg-white/10 text-blue-200 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Excerpt callout */}
        {blog.excerpt && (
          <div className="bg-blue-50 border-l-4 border-[#1e3a5f] p-4 rounded-r-xl mb-6">
            <p className="text-gray-700 text-sm italic leading-relaxed">{blog.excerpt}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Intro — always shown once */}
          {blog.intro && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <p className="text-gray-700 text-sm leading-relaxed">{blog.intro}</p>
            </div>
          )}

          {/* Sections */}
          {sections.map((section, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              {section.heading && (
                <h2 className="text-base font-bold text-white bg-[#1e3a5f] px-4 py-2.5 rounded-lg mb-4 -mx-2">
                  {section.heading}
                </h2>
              )}
              {section.paragraphs?.map((para, j) => (
                <p key={j} className="text-gray-700 text-sm leading-relaxed mb-3">{para}</p>
              ))}
              {section.bullets?.length > 0 && (
                <ul className="space-y-2 mt-2">
                  {section.bullets.map((bullet, k) => (
                    <li key={k} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                      <span className="text-[#f59e0b] mt-1 shrink-0">▸</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Fallback: scraped HTML */}
          {!hasSections && contentHtml && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="job-content prose max-w-none text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-[#1e3a5f] hover:text-[#f59e0b] text-sm font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back to Blog
          </Link>
        </div>
      </div>
    </div>
  )
}
