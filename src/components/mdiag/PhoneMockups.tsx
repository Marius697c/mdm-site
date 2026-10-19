import { useTranslations } from "next-intl";
import { PhoneFrame, Pill, ScreenTitle } from "./PhoneFrame";

export type MockupKind = "results" | "history" | "map" | "prescription" | "signup";

function ListRow({ title, status, check }: { title: string; status: string; check?: boolean }) {
  return (
    <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl border border-navy-100 p-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-800 text-[10px] text-cyan-300">
        {check ? "✓" : "●"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold leading-tight">{title}</p>
        <div className="mt-1 h-1.5 w-3/4 rounded bg-navy-100" />
      </div>
      <span className="shrink-0"><Pill>{status}</Pill></span>
    </div>
  );
}

export function PhoneMockup({ kind }: { kind: MockupKind }) {
  const t = useTranslations("Mdiag.mock");
  const tc = useTranslations("Common");
  const label = `${tc("mockupCaption")} — ${t(`${kind}.screenTitle`)}`;

  return (
    <PhoneFrame label={label}>
      <ScreenTitle>{t(`${kind}.screenTitle`)}</ScreenTitle>

      {(kind === "results" || kind === "history") && (
        <div>
          {(t.raw(`${kind}.rows`) as string[]).map((row) => (
            <ListRow key={row} title={row} status={t(`${kind}.status`)} check={kind === "history"} />
          ))}
        </div>
      )}

      {kind === "map" && (
        <div className="flex flex-1 flex-col">
          <div className="mx-3 mb-2 rounded-full bg-navy-50 px-3 py-1.5 text-[10px] text-navy-500">{t("map.search")}</div>
          <div className="relative flex-1 bg-navy-50">
            <svg viewBox="0 0 200 260" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
              <path d="M-10 60 L120 90 L210 40" stroke="#b3c8ea" strokeWidth="10" fill="none" />
              <path d="M40 -10 L70 120 L50 270" stroke="#d9e4f5" strokeWidth="12" fill="none" />
              <path d="M-10 190 L210 170" stroke="#d9e4f5" strokeWidth="8" fill="none" />
              <rect x="110" y="120" width="40" height="28" rx="4" fill="#d9e4f5" />
            </svg>
            {[["30%", "28%"], ["62%", "52%"], ["40%", "74%"]].map(([l, tp]) => (
              <span key={l} style={{ left: l, top: tp }} className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cyan-500 text-[11px] font-bold text-navy-950 ring-4 ring-white">+</span>
            ))}
            <span className="absolute inset-x-3 bottom-3 rounded-lg bg-white p-2 text-[10px] font-semibold shadow">{t("map.pin")}</span>
          </div>
        </div>
      )}

      {kind === "prescription" && (
        <div className="px-3">
          <p className="mb-2 text-[10px] text-navy-500">{t("prescription.from")}</p>
          <div className="rounded-xl border border-navy-100 p-3">
            <p className="mb-2 text-[11px] font-semibold">{t("prescription.line")}</p>
            {[90, 70, 80, 55].map((w) => <div key={w} style={{ width: `${w}%` }} className="mb-2 h-1.5 rounded bg-navy-100" />)}
            <div className="mt-3 grid grid-cols-6 gap-0.5">
              {Array.from({ length: 36 }, (_, i) => (
                <span key={i} className={`aspect-square ${(i * 7 + (i % 5)) % 3 === 0 ? "bg-navy-900" : "bg-navy-100"}`} />
              ))}
            </div>
          </div>
          <div className="mt-3 rounded-full bg-navy-800 py-2 text-center text-[11px] font-semibold text-white">{t("prescription.button")}</div>
        </div>
      )}

      {kind === "signup" && (
        <div className="px-3">
          {[t("signup.vitale"), t("signup.ins")].map((name) => (
            <div key={name} className="mb-2 flex items-center gap-2 rounded-xl border border-navy-100 p-3">
              <span className="h-5 w-7 rounded bg-cyan-400/40" />
              <span className="text-[11px] font-semibold">{name}</span>
            </div>
          ))}
          <div className="mt-4 rounded-full bg-navy-800 py-2 text-center text-[11px] font-semibold text-white">{t("signup.button")}</div>
          <p className="mt-3 text-center text-[10px] text-navy-500">🔒 {t("signup.lock")}</p>
        </div>
      )}
    </PhoneFrame>
  );
}
