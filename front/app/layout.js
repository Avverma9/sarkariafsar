import './globals.css'
import Link from 'next/link'
import Script from 'next/script'
import SwRegister from './components/SwRegister'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || ''
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || ''

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Sarkari Afsar — Sarkari Naukri & Government Yojana Portal 2026',
    template: '%s | Sarkari Afsar',
  },
  description: 'Latest Sarkari Jobs, Government Schemes, Results, Admit Cards 2026. Find all government job notifications, yojana updates and exam results at Sarkari Afsar.',
  keywords: 'sarkari naukri, government jobs 2026, sarkari yojana, results, admit card, India, sarkari afsar',
  authors: [{ name: 'Sarkari Afsar Editorial Team' }],
  creator: 'Sarkari Afsar',
  publisher: 'SarkariAfsar.com',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'Sarkari Afsar',
    title: 'Sarkari Afsar — Sarkari Naukri & Government Yojana Portal 2026',
    description: 'Latest Sarkari Jobs, Government Schemes, Results, Admit Cards 2026.',
    images: [{ url: `${SITE_URL}/api/og?title=Sarkari+Afsar`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@sarkariafsar',
    title: 'Sarkari Afsar — Sarkari Naukri & Government Yojana',
    description: 'Latest Sarkari Jobs, Government Schemes, Results & Admit Cards 2026.',
    images: [`${SITE_URL}/api/og?title=Sarkari+Afsar`],
  },
  alternates: { canonical: SITE_URL },
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1e3a5f' },
    { media: '(prefers-color-scheme: dark)',  color: '#1e3a5f' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sarkari Afsar',
  },
  formatDetection: { telephone: false },
  other: {
    'google-adsense-account': ADSENSE_CLIENT || 'ca-pub-5390089359360512',
  },
}

// JSON-LD for WebSite + SiteLinksSearchBox
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: `${SITE_URL}/`,
  name: 'Sarkari Afsar',
  description: 'India\'s trusted portal for Sarkari Naukri, Government Schemes, Results and Admit Cards',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Sarkari Afsar',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  contactPoint: { '@type': 'ContactPoint', telephone: '+919153630507', email: 'support@sarkariafsar.com', contactType: 'customer support' },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Bakhtiyarpur Purani Bazar',
    addressLocality: 'Patna',
    addressRegion: 'Bihar',
    postalCode: '803212',
    addressCountry: 'IN',
  },
  sameAs: ['https://twitter.com/sarkariafsar'],
}

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#1e3a5f] text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#1d4ed8] text-white text-sm font-bold tracking-wide">SA</span>
            <span>Sarkari<span className="text-[#f59e0b]">Afsar</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/jobs" className="hover:text-[#f59e0b] transition-colors">Jobs</Link>
            <Link href="/yojana" className="hover:text-[#f59e0b] transition-colors">Yojana</Link>
            <Link href="/blog" className="hover:text-[#f59e0b] transition-colors">Blog</Link>
            <Link href="/about" className="hover:text-[#f59e0b] transition-colors">About</Link>
            <Link href="/search" className="hover:text-[#f59e0b] transition-colors flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </Link>
          </nav>
          <div className="md:hidden flex items-center gap-3">
            <Link href="/search" className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <details className="relative">
              <summary className="list-none cursor-pointer p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </summary>
              <div className="absolute right-0 mt-2 w-48 bg-[#1e3a5f] rounded-lg shadow-xl border border-blue-700 py-2 z-50">
                <Link href="/jobs" className="block px-4 py-2 hover:bg-blue-800 text-sm">Jobs</Link>
                <Link href="/yojana" className="block px-4 py-2 hover:bg-blue-800 text-sm">Yojana</Link>
                <Link href="/blog" className="block px-4 py-2 hover:bg-blue-800 text-sm">Blog</Link>
                <Link href="/about" className="block px-4 py-2 hover:bg-blue-800 text-sm">About</Link>
                <Link href="/contact" className="block px-4 py-2 hover:bg-blue-800 text-sm">Contact</Link>
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  const states = ['Bihar', 'UP', 'Gujarat', 'Jharkhand', 'Maharashtra', 'Rajasthan', 'MP', 'Delhi']
  return (
    <footer className="bg-[#1e3a5f] text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-xl mb-3">
              <span className="text-[#f59e0b]">&#9733;</span>
              <span>Sarkari<span className="text-[#f59e0b]">Afsar</span></span>
            </div>
            <p className="text-blue-200 text-sm">सरकारी खबर, सबसे पहले.<br/>India's trusted government jobs &amp; schemes portal.</p>
          </div>
          <div>
            <h4 className="font-semibold text-[#f59e0b] mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link href="/jobs" className="hover:text-white transition-colors">Latest Jobs</Link></li>
              <li><Link href="/yojana" className="hover:text-white transition-colors">Government Yojana</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/search" className="hover:text-white transition-colors">Search</Link></li>
              <li><Link href="/sitemap-page" className="hover:text-white transition-colors">Sitemap</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#f59e0b] mb-3">Important</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#f59e0b] mb-3">States</h4>
            <div className="flex flex-wrap gap-2">
              {states.map(s => (
                <Link key={s} href={`/yojana?state=${s}`} className="text-xs bg-blue-800 hover:bg-blue-700 px-2 py-1 rounded transition-colors">{s}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-blue-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-blue-200 text-sm">&copy; 2026 SarkariAfsar.com &mdash; All Rights Reserved</p>
          <div className="flex gap-4 text-xs text-blue-300">
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/disclaimer" className="hover:text-white">Disclaimer</Link>
            <Link href="/sitemap-page" className="hover:text-white">Sitemap</Link>
          </div>
        </div>
        <p className="text-center text-blue-400 text-xs mt-4">
          Disclaimer: SarkariAfsar.com is an independent information portal not affiliated with any government department.
        </p>
      </div>
    </footer>
  )
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Google AdSense — afterInteractive prevents hydration mismatch with JSON-LD in <head> */}
        {ADSENSE_CLIENT && (
          <Script
            id="adsense-script"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
        {/* GA4 */}
        {GA4_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}');`}
            </Script>
          </>
        )}
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <SwRegister />
      </body>
    </html>
  )
}
