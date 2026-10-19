"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { HOTSPOTS, type HotspotId } from "@/lib/hotspots";
import { MODEL_URL } from "./MachineModel";

const MachineScene = dynamic(() => import("./MachineScene"), {
  ssr: false,
  loading: () => <LoadingState />,
});

function LoadingState() {
  const t = useTranslations("Machine.viewer");
  return (
    <div role="status" className="flex h-full items-center justify-center text-navy-100">
      {t("loading")}
    </div>
  );
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function MachineViewer() {
  const t = useTranslations("Machine");
  const [selected, setSelected] = useState<HotspotId | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [useGlb, setUseGlb] = useState(false);
  const markers = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    setWebgl(hasWebGL());
    // Charge /public/models/mdm.glb s'il existe, sinon modèle stylisé.
    fetch(MODEL_URL, { method: "HEAD" })
      .then((res) => setUseGlb(res.ok && !(res.headers.get("content-type") ?? "").includes("text/html")))
      .catch(() => setUseGlb(false));
  }, []);

  const labelFor = (id: HotspotId) => `${t("viewer.hotspotPrefix")} : ${t(`hotspots.${id}.title`)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div>
        <div
          role="group"
          aria-label={t("viewer.label")}
          className="relative h-[420px] overflow-hidden rounded-3xl bg-gradient-to-b from-navy-800 to-navy-950 shadow-soft sm:h-[540px]"
        >
          {webgl === null && <LoadingState />}
          {webgl === false && (
            <p className="flex h-full items-center justify-center p-8 text-center text-navy-100">{t("viewer.unsupported")}</p>
          )}
          {webgl && <MachineScene useGlb={useGlb} markers={markers} />}
          {webgl &&
            HOTSPOTS.map((h, i) => (
              <button
                key={h.id}
                ref={(el) => {
                  markers.current[i] = el;
                }}
                type="button"
                onClick={() => setSelected(h.id)}
                aria-label={labelFor(h.id)}
                aria-pressed={selected === h.id}
                style={{ visibility: "hidden" }}
                className={`absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold shadow-lg hover:scale-110 ${
                  selected === h.id
                    ? "border-white bg-cyan-400 text-navy-950"
                    : "animate-pulse border-cyan-300 bg-navy-900/90 text-cyan-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
        </div>
        <p className="mt-3 text-sm text-navy-700">{t("viewer.help")}</p>
      </div>

      <div className="flex flex-col gap-4">
        <div aria-live="polite" className="card min-h-[180px] border-cyan-400/40">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold">{t(`hotspots.${selected}.title`)}</h3>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label={t("viewer.close")}
                  className="-mr-2 -mt-2 flex h-9 w-9 items-center justify-center rounded-full text-navy-700 hover:bg-navy-50"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
              <p className="mt-3 leading-relaxed text-navy-700">{t(`hotspots.${selected}.text`)}</p>
            </>
          ) : (
            <p className="text-navy-700">{t("viewer.placeholder")}</p>
          )}
        </div>

        <h3 className="text-sm font-semibold uppercase tracking-widest text-navy-500">{t("viewer.zonesTitle")}</h3>
        <ul className="space-y-2">
          {HOTSPOTS.map((h, i) => (
            <li key={h.id}>
              <button
                type="button"
                aria-pressed={selected === h.id}
                onClick={() => setSelected(h.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left font-semibold transition-colors ${
                  selected === h.id ? "border-cyan-500 bg-navy-50" : "border-navy-100 hover:bg-navy-50"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-800 text-sm text-cyan-300">{i + 1}</span>
                {t(`hotspots.${h.id}.title`)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
