import type { ReactNode } from "react";

/** Cadre de téléphone dessiné en HTML/CSS. Le contenu est purement décoratif. */
export function PhoneFrame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="relative mx-auto h-[420px] w-[210px] shrink-0 rounded-[2rem] border-[7px] border-navy-900 bg-navy-900 shadow-soft"
    >
      <div className="absolute left-1/2 top-1.5 z-10 h-3.5 w-16 -translate-x-1/2 rounded-full bg-navy-900" />
      <div aria-hidden="true" className="flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-white text-navy-900">
        <div className="h-7 shrink-0" />
        {children}
      </div>
    </div>
  );
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  return <div className="px-4 pb-3 text-sm font-bold">{children}</div>;
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[9px] font-semibold text-navy-700">{children}</span>;
}
