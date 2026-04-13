const nextConfig = {
  output: 'standalone',
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  serverExternalPackages: ['mongodb'],
  turbopack: {
    root: __dirname,
  },
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },

  // ── Compiler optimisations ──────────────────────────────────────────────
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // ── Bundle splitting ────────────────────────────────────────────────────
  webpack(config, { isServer }) {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
            priority: 40,
            enforce: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },

  async redirects() {
    return [
      // 301 redirects — old ?section= query params → canonical section URLs
      { source: '/jobs', has: [{ type: 'query', key: 'section', value: 'Results' }], destination: '/results', permanent: true },
      { source: '/jobs', has: [{ type: 'query', key: 'section', value: 'Latest Gov Jobs' }], destination: '/latest-jobs', permanent: true },
      { source: '/jobs', has: [{ type: 'query', key: 'section', value: 'Recent Admit Cards' }], destination: '/admit-cards', permanent: true },
      { source: '/jobs', has: [{ type: 'query', key: 'section', value: 'Admission' }], destination: '/admission', permanent: true },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          // ── Framing / clickjacking ──────────────────────────────────────
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },

          // ── XSS / injection ─────────────────────────────────────────────
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // ── HSTS (1 year, include subdomains) ───────────────────────────
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },

          // ── Cross-Origin isolation ───────────────────────────────────────
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },

          // ── Permissions policy (disable unused browser features) ─────────
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },

          // ── CSP (frame-ancestors + trusted types stub) ───────────────────
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.cashfree.com https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com https://adservice.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: https://lh3.googleusercontent.com",
              "connect-src 'self' https://sdk.cashfree.com https://api.cashfree.com https://sandbox.cashfree.com https://payments.cashfree.com https://fonts.googleapis.com https://fonts.gstatic.com https://sarkariafsar.com http://localhost:5000 https://www.google-analytics.com https://www.googletagmanager.com https://lh3.googleusercontent.com",
              "frame-src 'self' https://sdk.cashfree.com https://payments.cashfree.com https://api.cashfree.com https://sandbox.cashfree.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },

          // ── CORS ─────────────────────────────────────────────────────────
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.CORS_ORIGINS || 'https://sarkariafsar.com',
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      // ── Static assets — long cache ──────────────────────────────────────
      {
        source: '/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      // Note: /_next/static/(.*) headers removed — Next.js manages these automatically in dev
      // ── Fonts ────────────────────────────────────────────────────────────
      {
        source: '/(.*)\\.(woff|woff2|ttf|otf)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      // ── Images ──────────────────────────────────────────────────────────
      {
        source: '/(.*)\\.(jpg|jpeg|png|webp|avif|svg|ico|gif)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
