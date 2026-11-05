"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Map as LeafletMap, LayerGroup, Marker } from "leaflet";

// Données : fichier officiel FINESS (toutes les pharmacies d'officine de France),
// découpé en tuiles statiques par scripts/build-pharmacies.mjs. Aucune API externe
// à interroger : les pharmacies s'affichent dès que la position est connue.
const DATA_BASE = "/pharmacies";
const CELL = 0.5; // doit correspondre à scripts/build-pharmacies.mjs
const MAX_RESULTS = 10;
const GEO_TIMEOUT_MS = 5000;

type Pharmacy = {
  id: string;
  name: string;
  address: string;
  cp: string;
  city: string;
  phone: string;
  lat: number;
  lon: number;
  distance: number; // mètres
};
type Raw = [string, string, string, string, string, number, number];
type Commune = [string, string, number, number]; // [code postal, ville, lat, lon]

type Status = "idle" | "locating" | "loading" | "ready" | "empty" | "denied" | "unsupported" | "locationError" | "error";
type Origin = { lat: number; lon: number; label?: string };

const DEFAULT_CENTER: [number, number] = [46.6, 2.4];
const DEFAULT_ZOOM = 5;

function distanceMeters(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const tileCache = new Map<string, Promise<Raw[]>>();
function loadTile(key: string) {
  let p = tileCache.get(key);
  if (!p) {
    p = fetch(`${DATA_BASE}/t/${key}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Raw[]>) : []))
      .catch(() => {
        tileCache.delete(key);
        throw new Error("tile");
      });
    tileCache.set(key, p);
  }
  return p;
}

async function findNearest(origin: Origin): Promise<Pharmacy[]> {
  const ci = Math.floor(origin.lat / CELL);
  const cj = Math.floor(origin.lon / CELL);
  // 3×3 tuiles autour de la position (≈ 40 km au minimum), puis 5×5 si rien trouvé.
  for (const ring of [1, 2]) {
    const keys: string[] = [];
    for (let i = -ring; i <= ring; i++) for (let j = -ring; j <= ring; j++) keys.push(`${ci + i}_${cj + j}`);
    const tiles = await Promise.all(keys.map(loadTile));
    const list = tiles
      .flatMap((tile, ti) =>
        tile.map(([name, address, cp, city, phone, lat, lon], k) => ({
          id: `${keys[ti]}-${k}`,
          name,
          address,
          cp,
          city,
          phone,
          lat,
          lon,
          distance: distanceMeters(origin.lat, origin.lon, lat, lon),
        })),
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_RESULTS);
    if (list.length) return list;
  }
  return [];
}

let communesPromise: Promise<Commune[]> | null = null;
function loadCommunes() {
  communesPromise ??= fetch(`${DATA_BASE}/communes.json`)
    .then((r) => (r.ok ? (r.json() as Promise<Commune[]>) : []))
    .catch(() => {
      communesPromise = null;
      return [];
    });
  return communesPromise;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[-'’]/g, " ")
    .replace(/\bsaint\b/g, "st")
    .replace(/\s+/g, " ")
    .trim();

function directionsUrl(p: Pharmacy) {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat}%2C${p.lon}`;
}

export function NearbyPharmacies() {
  const t = useTranslations("Pharmacies.map");
  const locale = useLocale();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const pendingDraw = useRef<(() => void) | null>(null);
  const requestRef = useRef(0);
  const [status, setStatus] = useState<Status>("idle");
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Carte côté client uniquement (Leaflet dépend de window).
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(mapEl.current, { scrollWheelZoom: false }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      // Molette active seulement après un clic sur la carte, pour ne pas gêner le défilement de la page.
      map.on("click", () => map.scrollWheelZoom.enable());
      map.on("mouseout", () => map.scrollWheelZoom.disable());
      // Fond clair et épuré (CARTO Positron), gratuit avec attribution.
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
        subdomains: "abcd",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      pendingDraw.current?.();
      pendingDraw.current = null;
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Si la localisation a déjà été autorisée, on cherche tout de suite.
  useEffect(() => {
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((p) => {
        if (p.state === "granted") locate();
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDistance = (m: number) =>
    m < 1000
      ? `${Math.max(10, Math.round(m / 10) * 10)} m`
      : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(m / 1000)} km`;

  function draw(o: Origin, list: Pharmacy[]) {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) {
      // Carte pas encore prête : on dessinera dès qu'elle le sera.
      pendingDraw.current = () => draw(o, list);
      return;
    }
    layer.clearLayers();
    markersRef.current.clear();

    list.forEach((p, i) => {
      const popup = document.createElement("div");
      popup.style.minWidth = "180px";
      const title = document.createElement("strong");
      title.textContent = p.name;
      popup.appendChild(title);
      for (const line of [p.address, `${p.cp} ${p.city}`.trim(), formatDistance(p.distance)]) {
        if (!line) continue;
        const div = document.createElement("div");
        div.textContent = line;
        popup.appendChild(div);
      }
      if (p.phone) {
        const tel = document.createElement("a");
        tel.href = `tel:${p.phone.replace(/\s/g, "")}`;
        tel.textContent = `${t("phone")} ${p.phone}`;
        tel.style.display = "block";
        popup.appendChild(tel);
      }
      const link = document.createElement("a");
      link.href = directionsUrl(p);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = t("directions");
      popup.appendChild(link);

      const icon = L.divIcon({
        className: "",
        html: `<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:#0f2a4a;color:#67e8f9;border:2px solid #fff;font:700 13px/1 sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.35)">${i + 1}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -14],
      });
      const marker = L.marker([p.lat, p.lon], { icon, title: p.name, alt: p.name, zIndexOffset: MAX_RESULTS - i })
        .bindPopup(popup)
        .on("click", () => setSelected(p.id))
        .addTo(layer);
      markersRef.current.set(p.id, marker);
    });

    const youIcon = L.divIcon({
      className: "",
      html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#22d3ee;border:3px solid #fff;box-shadow:0 0 0 6px rgba(34,211,238,.25),0 2px 6px rgba(0,0,0,.3)"></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    L.marker([o.lat, o.lon], { icon: youIcon, zIndexOffset: 1000, keyboard: false })
      .bindTooltip(o.label ?? t("you"))
      .addTo(layer);

    if (!list.length) {
      map.setView([o.lat, o.lon], 13);
      return;
    }
    // Cadre sur la position et les 5 plus proches pour rester lisible.
    const bounds = L.latLngBounds([[o.lat, o.lon], ...list.slice(0, 5).map((p) => [p.lat, p.lon] as [number, number])]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }

  async function searchAround(o: Origin) {
    const req = ++requestRef.current;
    setOrigin(o);
    setStatus("loading");
    try {
      const list = await findNearest(o);
      if (req !== requestRef.current) return;
      setPharmacies(list);
      setSelected(null);
      draw(o, list);
      setStatus(list.length ? "ready" : "empty");
    } catch {
      if (req === requestRef.current) setStatus("error");
    }
  }

  function locate() {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    const req = ++requestRef.current;
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (req !== requestRef.current) return;
        searchAround({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        if (req !== requestRef.current) return;
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "locationError");
      },
      // Précision « réseau » : rapide, et quelques dizaines de mètres suffisent.
      { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: 10 * 60 * 1000 },
    );
  }

  function focus(p: Pharmacy) {
    setSelected(p.id);
    const map = mapRef.current;
    if (!map) return;
    map.setView([p.lat, p.lon], Math.max(map.getZoom(), 16));
    markersRef.current.get(p.id)?.openPopup();
    mapEl.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (q.length < 2 || !communes.length) return [];
    const isCp = /^\d+$/.test(q);
    const matches = communes.filter((c) => (isCp ? c[0].startsWith(q) : normalize(c[1]).startsWith(q)));
    // Nom exact d'abord (« Lyon » avant « Lyons-la-Forêt »), puis les plus courts.
    if (!isCp) matches.sort((a, b) => Number(normalize(b[1]) === q) - Number(normalize(a[1]) === q) || a[1].length - b[1].length);
    return matches.slice(0, 8);
  }, [query, communes]);

  function pickCommune(c: Commune) {
    setQuery(`${c[0]} ${c[1]}`);
    setShowSuggestions(false);
    searchAround({ lat: c[2], lon: c[3], label: `${c[0]} ${c[1]}` });
  }

  const busy = status === "locating" || status === "loading";
  const message = {
    idle: t("idle"),
    locating: t("locating"),
    loading: t("searching"),
    empty: t("empty"),
    denied: t("denied"),
    unsupported: t("unsupported"),
    locationError: t("locationError"),
    error: t("error"),
    ready: origin?.label ? t("foundNear", { count: pharmacies.length, place: origin.label }) : t("found", { count: pharmacies.length }),
  }[status];
  const isProblem = ["denied", "unsupported", "locationError", "error", "empty"].includes(status);

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={locate} disabled={busy} className="btn-dark shrink-0 disabled:opacity-60">
            <span aria-hidden="true">📍</span>
            {t("button")}
          </button>
          <form
            role="search"
            className="relative flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (suggestions[0]) pickCommune(suggestions[0]);
            }}
          >
            <label htmlFor="pharmacy-search" className="sr-only">
              {t("searchLabel")}
            </label>
            <input
              id="pharmacy-search"
              type="search"
              autoComplete="off"
              value={query}
              placeholder={t("searchPlaceholder")}
              onFocus={() => {
                setShowSuggestions(true);
                loadCommunes().then(setCommunes);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSuggestions && suggestions.length > 0}
              aria-controls="pharmacy-suggestions"
              className="h-12 w-full rounded-full border border-navy-100 bg-white px-5 text-base text-navy-900 placeholder:text-navy-500 focus:border-cyan-500"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul
                id="pharmacy-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-14 z-[1000] overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-soft"
              >
                {suggestions.map((c) => (
                  <li key={`${c[0]}-${c[1]}`} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickCommune(c)}
                      className="w-full px-5 py-2.5 text-left hover:bg-navy-50"
                    >
                      <span className="font-semibold">{c[0]}</span> {c[1]}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>
        <div
          ref={mapEl}
          role="region"
          aria-label={t("label")}
          className="relative z-0 h-[380px] overflow-hidden rounded-3xl border border-navy-100 bg-navy-50 shadow-soft sm:h-[520px]"
        />
        <p className="text-xs text-navy-500">{t("privacy")}</p>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <p
          aria-live="polite"
          role="status"
          className={`rounded-xl px-4 py-3 text-sm ${isProblem ? "bg-amber-50 text-amber-900" : "bg-navy-50 text-navy-700"}`}
        >
          {busy && (
            <span
              aria-hidden="true"
              className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-navy-100 border-t-navy-800 align-[-1px]"
            />
          )}
          {message}
        </p>
        {pharmacies.length > 0 && (
          <ol className="flex flex-col gap-2 lg:max-h-[560px] lg:overflow-y-auto lg:pr-1">
            {pharmacies.map((p, i) => (
              <li key={p.id}>
                <article
                  className={`rounded-xl border p-3 transition-colors ${
                    selected === p.id ? "border-cyan-500 bg-navy-50" : "border-navy-100 bg-white"
                  }`}
                >
                  <button type="button" onClick={() => focus(p)} className="flex w-full items-start gap-3 text-left">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-cyan-300">
                      {i + 1}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold leading-snug">{p.name}</span>
                        <span className="shrink-0 text-sm font-bold text-navy-800">{formatDistance(p.distance)}</span>
                      </span>
                      <span className="mt-0.5 text-sm text-navy-700">
                        {p.address && (
                          <>
                            {p.address}
                            <br />
                          </>
                        )}
                        {p.cp} {p.city}
                      </span>
                    </span>
                  </button>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 pl-10 text-sm">
                    {p.phone ? (
                      <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="font-semibold text-navy-800 underline-offset-2 hover:underline">
                        <span aria-hidden="true">📞 </span>
                        <span className="sr-only">{t("phone")} </span>
                        {p.phone}
                      </a>
                    ) : (
                      <span className="text-navy-500">{t("noPhone")}</span>
                    )}
                    <a href={directionsUrl(p)} target="_blank" rel="noopener noreferrer" className="text-navy-700 underline underline-offset-2">
                      {t("directions")}
                    </a>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        )}
        <p className="text-xs leading-relaxed text-navy-500">{t("source")}</p>
      </div>
    </div>
  );
}
