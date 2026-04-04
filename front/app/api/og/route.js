import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') ?? 'Sarkari Afsar'
  const type = searchParams.get('type') ?? 'job'

  const bgColor = type === 'scheme' ? '#1e5f3a' : type === 'blog' ? '#3a1e5f' : '#1e3a5f'
  const typeLabel = type === 'scheme' ? 'Government Scheme' : type === 'blog' ? 'Blog Post' : 'Sarkari Job'

  return new ImageResponse(
    (
      <div
        style={{
          background: bgColor,
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          width: '1200px',
          height: '630px',
          padding: '60px',
          justifyContent: 'space-between',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 28, color: '#f59e0b', fontWeight: 700 }}>★ SarkariAfsar.com</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 16, color: '#f59e0b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 2 }}>
            {typeLabel}
          </div>
          <div style={{ display: 'flex', fontSize: 48, fontWeight: 700, lineHeight: 1.2, color: 'white' }}>
            {title.length > 80 ? title.slice(0, title.lastIndexOf(' ', 80)) || title.slice(0, 80) : title}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 18, color: 'rgba(255,255,255,0.6)' }}>
          सरकारी खबर, सबसे पहले — India&#39;s Trusted Govt Portal
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
