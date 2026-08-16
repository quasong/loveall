import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * The card iMessage, Slack, WhatsApp and the rest show in place of a bare link.
 * Generated at build time, so it costs nothing at request time.
 */
export const alt = 'Love All — find a hitting partner wherever you land'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  // The mark is read from the icon rather than redrawn, so the two can never
  // drift apart. Satori has no filesystem, hence the data URI.
  const mark = await readFile(join(process.cwd(), 'src/app/icon.svg'))
  const markSrc = `data:image/svg+xml;base64,${mark.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 88px',
          background: 'linear-gradient(160deg, #f2f8f4 0%, #f6f7f4 55%, #dcece2 100%)',
          color: '#14201a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={markSrc} width={104} height={104} alt="" />
          <div
            style={{
              marginLeft: 26,
              fontSize: 60,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            Love All
          </div>
        </div>

        <div
          style={{
            marginTop: 44,
            fontSize: 74,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: 900,
          }}
        >
          A hitting partner wherever you land.
        </div>

        <div style={{ marginTop: 30, fontSize: 34, color: '#6b7a70', maxWidth: 860 }}>
          Post a match at your home court, or find a game the week you arrive somewhere new.
        </div>

        <div style={{ display: 'flex', marginTop: 46 }}>
          {['NTRP 1.5 – 6.0', 'Any time zone', 'Singles, doubles, drills'].map((chip) => (
            <div
              key={chip}
              style={{
                display: 'flex',
                marginRight: 16,
                padding: '12px 26px',
                borderRadius: 999,
                border: '2px solid #b9d8c6',
                background: '#ffffff',
                color: '#17643f',
                fontSize: 26,
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  )
}
