// VideoLightbox kontrol ikonları — currentColor, 24x24 kutu.
function Svg({ children }) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

const SPEAKER = 'M4 9.5v5a1 1 0 0 0 1 1h3l4.3 3.6a1 1 0 0 0 1.7-.77V5.67a1 1 0 0 0-1.7-.77L8 8.5H5a1 1 0 0 0-1 1Z';

export function PlayIcon() {
  return (
    <Svg>
      <path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" />
    </Svg>
  );
}

export function PauseIcon() {
  return (
    <Svg>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </Svg>
  );
}

export function PreviousIcon() {
  return (
    <Svg>
      <rect x="5" y="5" width="2.5" height="14" rx="1" />
      <path d="M19 6.2v11.6a1 1 0 0 1-1.55.83l-8.7-5.8a1 1 0 0 1 0-1.66l8.7-5.8A1 1 0 0 1 19 6.2Z" />
    </Svg>
  );
}

export function NextIcon() {
  return (
    <Svg>
      <rect x="16.5" y="5" width="2.5" height="14" rx="1" />
      <path d="M5 6.2v11.6a1 1 0 0 0 1.55.83l8.7-5.8a1 1 0 0 0 0-1.66l-8.7-5.8A1 1 0 0 0 5 6.2Z" />
    </Svg>
  );
}

export function VolumeIcon() {
  return (
    <Svg>
      <path d={SPEAKER} />
      <path
        d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MuteIcon() {
  return (
    <Svg>
      <path d={SPEAKER} />
      <path d="m16.5 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function CloseIcon() {
  return (
    <Svg>
      <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
