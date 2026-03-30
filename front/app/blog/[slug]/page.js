import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'

export async function generateMetadata({ params }) {
  const { slug } = await params
  try {
    const res = await fetch(`${API_BASE}/blog/slug/${slug}`, { next: { revalidate: 86400 } })
    const data = await res.json()
    const blog = data?.data
    if (!blog) return { title: 'Blog - Sarkari Afsar' }
    return {
      title: `${blog.title || blog.slug?.replace(/-/g, ' ')} - Sarkari Afsar`,
      description: blog.excerpt || blog.intro?.slice(0, 155),
    }
  } catch {
    return { title: 'Blog - Sarkari Afsar' }
  }
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params
  let blog = null
  try {
    const res = await fetch(`${API_BASE}/blog/slug/${slug}`, { next: { revalidate: 86400 } })
    const data = await res.json()
    blog = data?.data
  } catch {}

  if (!blog) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">📝</div>
        <h1 className="text-2xl font-bold text-gray-700 mb-2">Post Not Found</h1>
        <Link href="/blog" className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg hover:bg-[#153060] transition-colors">Back to Blog</Link>
      </div>
    )
  }

  const date = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const title = blog.title || blog.slug?.replace(/-/g, ' ')
  const content = blog.content || blog.intro || blog.excerpt || ''

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-[#1e3a5f] text-white py-10 px-4">
        <div className="container mx-auto max-w-3xl">
          <nav className="text-sm text-blue-300 mb-4">
            <Link href="/" className="hover:text-white">Home</Link> &rsaquo; <Link href="/blog" className="hover:text-white">Blog</Link> &rsaquo; <span className="text-white">{title}</span>
          </nav>
          <span className="text-xs bg-purple-400/20 text-purple-200 px-3 py-1 rounded-full">{blog.category || 'Blog'}</span>
          <h1 className="text-2xl md:text-3xl font-bold mt-3 leading-tight capitalize">{title}</h1>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-blue-200">
            <span>✏️ {blog.author || 'Sarkari Afsar Editorial'}</span>
            {date && <span>📅 {date}</span>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {blog.excerpt && (
          <div className="bg-blue-50 border-l-4 border-[#1e3a5f] p-4 rounded-r-xl mb-6">
            <p className="text-gray-700 text-sm italic">{blog.excerpt}</p>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div
            className="job-content prose max-w-none text-gray-700 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
          />
          {!content && blog.intro && (
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{blog.intro}</p>
          )}
        </div>
        <div className="mt-6">
          <Link href="/blog" className="text-[#1e3a5f] hover:underline text-sm font-medium">&larr; Back to Blog</Link>
        </div>
      </div>
    </div>
  )
}
