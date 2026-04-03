import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const SIZES = { 72: true, 96: true, 128: true, 144: true, 152: true, 192: true, 384: true, 512: true }

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const rawSize = parseInt(searchParams.get('size') ?? '192', 10)
  const size = SIZES[rawSize] ? rawSize : 192

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: '#1e3a5f',
          borderRadius: Math.round(size * 0.156),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        {/* Inner blue card */}
        <div
          style={{
            width: size * 0.84,
            height: size * 0.84,
            background: '#1d4ed8',
            borderRadius: Math.round(size * 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: Math.round(size * 0.42),
              fontWeight: 900,
              fontFamily: 'sans-serif',
              letterSpacing: '-2px',
              lineHeight: 1,
              marginTop: '-4px',
            }}
          >
            SA
          </span>
          {/* Gold accent bar */}
          <div
            style={{
              width: size * 0.46,
              height: Math.max(3, Math.round(size * 0.03)),
              background: '#f59e0b',
              borderRadius: 4,
              marginTop: Math.round(size * 0.05),
            }}
          />
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
    }
  )
}
