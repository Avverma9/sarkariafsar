import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#1e3a5f',
          borderRadius: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            background: '#1d4ed8',
            width: 150,
            height: 150,
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: 76,
              fontWeight: 900,
              fontFamily: 'sans-serif',
              letterSpacing: '-2px',
              lineHeight: 1,
            }}
          >
            SA
          </span>
          <div
            style={{
              width: 80,
              height: 6,
              background: '#f59e0b',
              borderRadius: 3,
              marginTop: 8,
            }}
          />
        </div>
      </div>
    ),
    { width: 180, height: 180 }
  )
}
