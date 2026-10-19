"use client";

import { useEffect, useRef, useState } from "react";

type Props = { src: string; alt: string; placeholderLabel: string; className?: string };

/** Image avec visuel de remplacement si le fichier est absent de /public. */
export function SafeImage({ src, alt, placeholderLabel, className = "" }: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  // L'erreur peut survenir avant l'hydratation : on revérifie au montage.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-navy-800 to-navy-600 text-navy-100 ${className}`}
      >
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="6" y="20" width="44" height="22" rx="4" />
          <rect x="12" y="25" width="12" height="8" rx="1.5" />
          <path d="M32 27h12M32 33h8" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-medium">{placeholderLabel}</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
