import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'Sitemap - Sarkari Afsar',
  description: 'Complete sitemap of SarkariAfsar.com - All pages and sections.',
  alternates: { canonical: `${SITE_URL}/sitemap-page` },
  robots: { index: false, follow: true },
}

export default function SitemapPage() {
  const sections = [
    {
      title: '💼 Government Jobs',
      links: [
        { name: 'All Jobs', href: '/jobs' },
        { name: 'Results', href: '/jobs?section=Results' },
        { name: 'Admit Card', href: '/jobs?section=Admit+Card' },
        { name: 'Recruitment', href: '/jobs?section=Recruitment' },
        { name: 'Answer Key', href: '/jobs?section=Answer+Key' },
        { name: 'Syllabus', href: '/jobs?section=Syllabus' },
      ]
    },
    {
      title: '🏛️ Government Yojana',
      links: [
        { name: 'All Schemes', href: '/yojana' },
        { name: 'Bihar Schemes', href: '/yojana?state=Bihar' },
        { name: 'UP Schemes', href: '/yojana?state=Uttar+Pradesh' },
        { name: 'Gujarat Schemes', href: '/yojana?state=Gujarat' },
        { name: 'Maharashtra Schemes', href: '/yojana?state=Maharashtra' },
        { name: 'Rajasthan Schemes', href: '/yojana?state=Rajasthan' },
      ]
    },
    {
      title: '📝 Blog',
      links: [
        { name: 'All Posts', href: '/blog' },
      ]
    },
    {
      title: '🔍 Search',
      links: [
        { name: 'Search Jobs & Schemes', href: '/search' },
      ]
    },
    {
      title: 'ℹ️ Information Pages',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Contact Us', href: '/contact' },
        { name: 'Privacy Policy', href: '/privacy-policy' },
        { name: 'Disclaimer', href: '/disclaimer' },
      ]
    },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-[#1e3a5f] text-white py-10 px-4">
        <div className="container mx-auto max-w-4xl">
          <nav className="text-sm text-blue-300 mb-3">
            <Link href="/" className="hover:text-white">Home</Link> &rsaquo; <span className="text-white">Sitemap</span>
          </nav>
          <h1 className="text-3xl font-bold">HTML Sitemap</h1>
          <p className="text-blue-200 mt-2">All pages on SarkariAfsar.com</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map(section => (
            <div key={section.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-[#1e3a5f] text-base mb-4">{section.title}</h2>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-600 hover:text-[#1e3a5f] hover:underline flex items-center gap-2">
                      <span className="text-[#f59e0b]">&rsaquo;</span>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
