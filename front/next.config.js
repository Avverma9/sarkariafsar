const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['mongodb'],
  turbopack: {},
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
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
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self';" },
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
