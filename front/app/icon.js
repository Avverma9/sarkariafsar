import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#1e3a5f',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: '#1d4ed8',
            width: 26,
            height: 26,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 900,
              fontFamily: 'sans-serif',
              letterSpacing: '-0.5px',
            }}
          >
            SA
          </span>
        </div>
      </div>
    ),
    { width: 32, height: 32 }
  )
}
