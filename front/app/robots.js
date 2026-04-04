const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /search is crawlable but declared noindex in page metadata
        disallow: ['/api/', '/admin', '/search'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
