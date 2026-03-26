content = (
    "'use client';\n\n"
    "import { useEffect } from 'react';\n"
    "import { useParams } from 'next/navigation';\n"
    "import Link from 'next/link';\n"
    "import { useDispatch, useSelector } from 'react-redux';\n"
    "import { fetchPostBySlug } from '../../../store/slices/postsSlice';\n"
    "import Header from '../../components/header';\n"
    "import Footer from '../../components/footer';\n"
    "import PostContent from '../../components/PostContent';\n\n"
    "export default function PostDetailPage() {\n"
    "  const { slug } = useParams();\n"
    "  const dispatch = useDispatch();\n"
    "  const { currentPost, loading, error } = useSelector((s) => s.posts);\n\n"
    "  useEffect(() => {\n"
    "    if (slug) dispatch(fetchPostBySlug(slug));\n"
    "  }, [dispatch, slug]);\n\n"
    "  if (loading) {\n"
    "    return (\n"
    "      <>\n"
    "        <Header />\n"
    '        <main className="max-w-4xl mx-auto px-4 py-10 animate-pulse space-y-4">\n'
    '          <div className="h-8 bg-slate-200 rounded w-3/4" />\n'
    '          <div className="h-4 bg-slate-100 rounded w-1/3" />\n'
    '          <div className="h-4 bg-slate-100 rounded w-full" />\n'
    '          <div className="h-4 bg-slate-100 rounded w-5/6" />\n'
    '          <div className="h-64 bg-slate-100 rounded" />\n'
    "        </main>\n"
    "        <Footer />\n"
    "      </>\n"
    "    );\n"
    "  }\n\n"
    "  if (error) {\n"
    "    return (\n"
    "      <>\n"
    "        <Header />\n"
    '        <main className="max-w-4xl mx-auto px-4 py-10">\n'
    '          <p className="text-red-500 mb-4">Failed to load post: {error}</p>\n'
    '          <Link href="/jobpost" className="text-indigo-600 hover:underline">\u2190 Back to Jobs</Link>\n'
    "        </main>\n"
    "        <Footer />\n"
    "      </>\n"
    "    );\n"
    "  }\n\n"
    "  if (!currentPost) return null;\n\n"
    "  const _raw = currentPost?.data ?? currentPost;\n"
    "  const post = Array.isArray(_raw) ? _raw[0] : _raw;\n"
    "  if (!post) return null;\n\n"
    "  const html = post.contentHtml || post.content || '';\n\n"
    "  return (\n"
    "    <>\n"
    "      <Header />\n"
    "      <PostContent slug={slug} initialPost={post} initialHtml={html} />\n"
    "      <Footer />\n"
    "    </>\n"
    "  );\n"
    "}\n"
)

with open("app/post/[slug]/page.jsx", "w", encoding="utf8") as f:
    f.write(content)

print("wrote", len(content), "bytes")
