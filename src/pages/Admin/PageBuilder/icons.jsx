// Küçük, tutarlı çizgi-ikon seti (Lucide/Feather tarzı: 20x20, stroke=
// currentColor) — kullanıcı düzeltmesi: referans mockup'taki emoji/unicode
// glif (🖥📱🔒👁 vb.) SADECE örnekti, birebir kopyalanmamalıydı. Yeni bir
// paket eklemeden (CLAUDE.md: yeni npm paketi yok) elle çizilmiş, projeye
// özel minimal ikon seti.
const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function IconPointer(props) {
  // Kullanıcı düzeltmesi: "şekilleri ortada" — orijinal path'in dikey
  // ağırlık merkezi viewBox'un (12,12) merkezinden 1 birim yukarıdaydı,
  // diğer ikonlarla (hepsi tam 12,12 merkezli) yan yana durunca "yamuk"
  // görünüyordu. +1y kaydırma ile bounding box artık tam ortalı.
  return (
    <svg {...base} {...props}>
      <path d="M5 4l14 8-6.2 1.6L10.5 20 5 4z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconRectangle(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="6" width="16" height="12" rx="1.5" />
    </svg>
  );
}

export function IconDiamond(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l9 9-9 9-9-9 9-9z" />
    </svg>
  );
}

export function IconCircle(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export function IconType(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 6h14M12 6v12" />
    </svg>
  );
}

export function IconImage(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M20 15l-5-5-9 9" />
    </svg>
  );
}

export function IconButtonTool(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" />
      <path d="M8 12h8" />
    </svg>
  );
}

export function IconLogoTool(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="12" r="5.5" />
      <circle cx="15" cy="12" r="5.5" />
    </svg>
  );
}

export function IconStarTool(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l2.4 5.8L20.5 9.4l-4.6 4.2 1.3 6.4L12 16.8l-5.2 3.2 1.3-6.4L3.5 9.4l6.1-0.6L12 3z" />
    </svg>
  );
}

export function IconDesktop(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

export function IconTablet(props) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="2.5" width="14" height="19" rx="2" />
      <path d="M11.5 18h1" />
    </svg>
  );
}

export function IconMobile(props) {
  return (
    <svg {...base} {...props}>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11.5 18h1" />
    </svg>
  );
}

export function IconUndo(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 8H4V5" />
      <path d="M4 8c1.6-2.6 4.3-4.2 7.4-4.2 4.5 0 8.1 3.6 8.1 8.1s-3.6 8.1-8.1 8.1c-3.4 0-6.3-2-7.5-5" />
    </svg>
  );
}

export function IconRedo(props) {
  return (
    <svg {...base} {...props}>
      <path d="M17 8h3V5" />
      <path d="M20 8c-1.6-2.6-4.3-4.2-7.4-4.2-4.5 0-8.1 3.6-8.1 8.1s3.6 8.1 8.1 8.1c3.4 0 6.3-2 7.5-5" />
    </svg>
  );
}

export function IconLock(props) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
      <path d="M8 10.5V7a4 4 0 018 0v3.5" />
    </svg>
  );
}

export function IconUnlock(props) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
      <path d="M8 10.5V7a4 4 0 017.5-2" />
    </svg>
  );
}

export function IconEye(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function IconEyeOff(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.6A10.6 10.6 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 01-3.2 3.9M6.5 7.8A15.7 15.7 0 002.5 12S6 18.5 12 18.5c1.3 0 2.5-.2 3.6-.6" />
      <path d="M9.9 10.1a2.6 2.6 0 003.6 3.6" />
    </svg>
  );
}

export function IconDuplicate(props) {
  return (
    <svg {...base} {...props}>
      <rect x="8" y="8" width="12" height="12" rx="1.5" />
      <path d="M5 15.5H4.5A1.5 1.5 0 013 14V5a2 2 0 012-2h9a1.5 1.5 0 011.5 1.5V5" />
    </svg>
  );
}

export function IconBringFront(props) {
  return (
    <svg {...base} {...props}>
      <rect x="7" y="7" width="12" height="12" rx="1.5" fill="currentColor" stroke="none" opacity="0.25" />
      <rect x="7" y="7" width="12" height="12" rx="1.5" />
      <path d="M11 5.5V3M11 3H8.5M11 3l-3 3" />
    </svg>
  );
}

export function IconSendBack(props) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="5" width="12" height="12" rx="1.5" fill="currentColor" stroke="none" opacity="0.25" />
      <rect x="7" y="7" width="12" height="12" rx="1.5" />
      <path d="M11 5.5V3M11 3H8.5M11 3l-3 3" transform="translate(6,6)" />
    </svg>
  );
}

export function IconTrash(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M9 7V4.5A1.5 1.5 0 0110.5 3h3A1.5 1.5 0 0115 4.5V7M6.5 7l1 12.5A1.5 1.5 0 009 21h6a1.5 1.5 0 001.5-1.5L17.5 7" />
    </svg>
  );
}

export function IconMenu(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function IconChevronLeft(props) {
  return (
    <svg {...base} {...props}>
      <path d="M14.5 5l-7 7 7 7" />
    </svg>
  );
}

export function IconGrid(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.2" />
      <rect x="13" y="4" width="7" height="7" rx="1.2" />
      <rect x="4" y="13" width="7" height="7" rx="1.2" />
      <rect x="13" y="13" width="7" height="7" rx="1.2" />
    </svg>
  );
}

export function IconDatabase(props) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="12" cy="5.5" rx="8" ry="3" />
      <path d="M4 5.5V12c0 1.7 3.6 3 8 3s8-1.3 8-3V5.5" />
      <path d="M4 12v6.5c0 1.7 3.6 3 8 3s8-1.3 8-3V12" />
    </svg>
  );
}

export function IconCode(props) {
  return (
    <svg {...base} {...props}>
      <path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5" />
    </svg>
  );
}

export function IconLayers(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" />
      <path d="M4 12l8 4.5 8-4.5" />
      <path d="M4 16.5L12 21l8-4.5" />
    </svg>
  );
}

export function IconHistory(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12a9 9 0 109-9 9 9 0 00-7.4 3.9" />
      <path d="M3 3v5h5" />
      <path d="M12 7.5V12l3.2 2" />
    </svg>
  );
}
