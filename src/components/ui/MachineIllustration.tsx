/** Illustration vectorielle stylisée de la machine (proportions 100 × 60 × 40). */
export function MachineIllustration({ alt }: { alt: string }) {
  return (
    <svg viewBox="0 0 520 380" role="img" aria-label={alt} className="h-auto w-full">
      <defs>
        <linearGradient id="top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e8f0fb" />
          <stop offset="1" stopColor="#b3c8ea" />
        </linearGradient>
        <linearGradient id="front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a5090" />
          <stop offset="1" stopColor="#122e5f" />
        </linearGradient>
        <linearGradient id="side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c3d78" />
          <stop offset="1" stopColor="#081a3b" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#3fd0e6" stopOpacity="0.45" />
          <stop offset="1" stopColor="#3fd0e6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="270" cy="330" rx="230" ry="26" fill="url(#glow)" />
      {/* face avant */}
      <polygon points="60,190 380,190 380,300 60,300" fill="url(#front)" />
      {/* côté droit */}
      <polygon points="380,190 470,140 470,250 380,300" fill="url(#side)" />
      {/* dessus */}
      <polygon points="60,190 150,140 470,140 380,190" fill="url(#top)" />
      {/* écran tactile */}
      <polygon points="90,184 140,158 205,158 155,184" fill="#050f26" />
      <polygon points="98,182 142,161 197,161 153,182" fill="#14b8d4" opacity="0.8" />
      {/* emplacements */}
      <polygon points="225,182 262,163 300,163 263,182" fill="#081a3b" />
      <polygon points="285,182 322,163 345,163 308,182" fill="#122e5f" />
      <polygon points="335,180 365,164 395,164 365,180" fill="#1c3d78" />
      {/* détail face avant */}
      <rect x="84" y="262" width="60" height="6" rx="3" fill="#3fd0e6" />
      <text x="84" y="240" fill="#d9e4f5" fontSize="22" fontWeight="800" letterSpacing="5" fontFamily="sans-serif">MDM</text>
      <circle cx="355" cy="250" r="5" fill="#3fd0e6" />
    </svg>
  );
}
