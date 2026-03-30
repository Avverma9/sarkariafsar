'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const API_BASE = 'https://sarkariafsar.com/api'

function BlogCard({ blog }) {
  const date = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  const title = blog.title || blog.slug?.replace(/-/g, ' ')
  return (
    <Link href={`/blog/${blog.slug}`} className="block group">
      <div className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-[#1e3a5f]/20 transition-all h-full flex flex-col">
        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium w-fit mb-3">
          {blog.category || 'Blog'}
        </span>
        <h3 className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-[#1e3a5f] transition-colors flex-1 line-clamp-2 capitalize">
          {title}
        </h3>
        <p className="text-xs text-gray-500 mt-2 line-clamp-3 flex-1">
          {blog.excerpt || blog.intro?.slice(0, 150)}
        </p>
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400">{blog.author || 'Sarkari Afsar'}</span>
          <span className="text-xs text-gray-400">{date}</span>
        </div>
      </div>
    </Link>
  )
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [inputVal, setInputVal] = useState('')
  const LIMIT = 9

  const fetchBlogs = useCallback(async () => {
    setLoading(true)
    try {
      let url = `${API_BASE}/blog/?page=${page}&limit=${LIMIT}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      const res = await fetch(url)
      const data = await res.json()
      setBlogs(data?.data || [])
      setTotal(data?.total || data?.data?.length || 0)
    } catch { setBlogs([]) }
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchBlogs() }, [fetchBlogs])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-[#1e3a5f] text-white py-10 px-4">
        <div className="container mx-auto">
          <nav className="text-sm text-blue-300 mb-3">
            <Link href="/" className="hover:text-white">Home</Link> &rsaquo; <span className="text-white">Blog</span>
          </nav>
          <h1 className="text-3xl font-bold">📝 Sarkari Afsar Blog</h1>
          <p className="text-blue-200 mt-2">Tips, guides and updates on government jobs & schemes</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search blog posts..."
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSearch(inputVal); setPage(1) } }}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
            />
            <button
              onClick={() => { setSearch(inputVal); setPage(1) }}
              className="bg-[#1e3a5f] text-white px-4 py-2.5 rounded-lg text-sm hover:bg-[#153060] transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-48">
                <div className="h-3 bg-gray-200 rounded mb-3 w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {blogs.map(b => <BlogCard key={b._id || b.slug} blog={b} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-4">📝</div>
            <p>No blog posts found.</p>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">&larr; Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i
              if (p < 1 || p > totalPages) return null
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    page === p ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}>{p}</button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">Next &rarr;</button>
          </div>
        )}
      </div>
    </div>
  )
}
