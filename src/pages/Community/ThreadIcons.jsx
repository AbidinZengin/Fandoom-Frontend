// Thread kartlarının ortak çizgi-ikonları (FeedCard, ThreadBody). Harici ikon
// paketi yok (yeni paket eklenmez) — inline SVG, boyut font-size'la (1em)
// yönetilir, renk currentColor. `filled` aktif durumu (beğenildi/kaydedildi).
const BASE = {
  width: '1em',
  height: '1em',
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function CommentIcon() {
  return (
    <svg {...BASE} fill="none">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function HeartIcon({ filled }) {
  return (
    <svg {...BASE} fill={filled ? 'currentColor' : 'none'}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg {...BASE} fill="none">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

export function BookmarkIcon({ filled }) {
  return (
    <svg {...BASE} fill={filled ? 'currentColor' : 'none'}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg {...BASE} fill="none">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
