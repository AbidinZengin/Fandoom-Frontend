import { useEffect, useState } from 'react';

export function FandoomLogo({ showTagline = true, glowOpacity = 0.55, scale = 1 }) {
  const [zoom, setZoom] = useState(() => Math.min(1, (window.innerWidth - 60) / 1200) * scale);

  useEffect(() => {
    const onResize = () => setZoom(Math.min(1, (window.innerWidth - 60) / 1200) * scale);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [scale]);

  return (
    <div
      className="fandoom-logo"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '30px',
        padding: '40px',
        zoom,
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <div className="fandoom-logo__mark" style={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}>
        <span
          style={{
            fontSize: '158px',
            fontWeight: 800,
            letterSpacing: '5px',
            backgroundImage:
              'linear-gradient(90deg, #e8112d 0%, #e01275 55%, #d5128f 75%, #7b2ff0 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}
        >
          FAND
        </span>

        <span
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '268px',
            height: '200px',
            margin: '0 -6px 0 -14px',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              width: '380px',
              height: '320px',
              background: `radial-gradient(ellipse, rgba(60,60,235,${glowOpacity * 0.55}) 0%, rgba(110,50,235,${glowOpacity * 0.3}) 40%, rgba(60,60,235,0) 70%)`,
              filter: 'blur(16px)',
              pointerEvents: 'none',
            }}
          />

          <svg
            viewBox="0 0 268 200"
            style={{ position: 'relative', width: '268px', height: '200px', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="ringA" gradientUnits="userSpaceOnUse" x1="52.6" y1="38" x2="120.8" y2="162">
                <stop offset="0%" stopColor="#7a2ff0" />
                <stop offset="45%" stopColor="#a02cd8" />
                <stop offset="75%" stopColor="#f01878" />
                <stop offset="100%" stopColor="#c02aa8" />
              </linearGradient>
              <linearGradient id="ringB" gradientUnits="userSpaceOnUse" x1="213.2" y1="38" x2="151.2" y2="162">
                <stop offset="0%" stopColor="#8a2cf0" />
                <stop offset="50%" stopColor="#6a3cff" />
                <stop offset="100%" stopColor="#f0186a" />
              </linearGradient>
              <filter id="neonBlur" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>

            <g filter="url(#neonBlur)" opacity="0.6">
              <circle cx="96" cy="100" r="62" fill="none" stroke="url(#ringA)" strokeWidth="11" />
              <circle cx="96" cy="100" r="44" fill="none" stroke="url(#ringA)" strokeWidth="7" />
              <circle cx="176" cy="100" r="62" fill="none" stroke="url(#ringB)" strokeWidth="11" />
              <circle cx="176" cy="100" r="44" fill="none" stroke="url(#ringB)" strokeWidth="7" />
            </g>
            <g filter="url(#neonBlur)" opacity="0.32">
              <circle cx="96" cy="100" r="62" fill="none" stroke="url(#ringA)" strokeWidth="22" />
              <circle cx="176" cy="100" r="62" fill="none" stroke="url(#ringB)" strokeWidth="22" />
            </g>

            <circle cx="96" cy="100" r="62" fill="none" stroke="url(#ringA)" strokeWidth="8" />
            <circle cx="96" cy="100" r="44" fill="none" stroke="url(#ringA)" strokeWidth="5" />
            <circle cx="176" cy="100" r="62" fill="none" stroke="url(#ringB)" strokeWidth="8" />
            <circle cx="176" cy="100" r="44" fill="none" stroke="url(#ringB)" strokeWidth="5" />

            <path
              d="M 150.8 133.8 A 62 62 0 0 1 113.4 158.4"
              fill="none"
              stroke="url(#ringA)"
              strokeWidth="8.5"
            />
          </svg>
        </span>

        <span
          style={{
            fontSize: '158px',
            fontWeight: 800,
            letterSpacing: '5px',
            marginLeft: '-8px',
            backgroundImage: 'linear-gradient(90deg, #3223e8 0%, #1b1bef 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}
        >
          M
        </span>
      </div>

      {showTagline && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div
            className="fandoom-logo__tagline"
            style={{
              fontSize: '46px',
              fontWeight: 600,
              letterSpacing: '7px',
              color: '#e9e9e9',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            ENTERTAINMENT PLATFORM
          </div>
          <div
            className="fandoom-logo__subline"
            style={{
              fontSize: '30px',
              fontWeight: 600,
              letterSpacing: '4px',
              color: '#dcdcdc',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            THEORIES&nbsp;&nbsp;|&nbsp;&nbsp;NEWS&nbsp;&nbsp;|&nbsp;&nbsp;BLOGS&nbsp;&nbsp;|&nbsp;&nbsp;3D
          </div>
        </div>
      )}
    </div>
  );
}
