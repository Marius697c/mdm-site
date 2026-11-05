"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Map as LeafletMap, LayerGroup } from "leaflet";

type Pharmacy = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
  distance: number; // mètres
};

type Status = "idle" | "locating" | "searching" | "ready" | "empty" | "denied" | "unsupported" | "error";

// Centre par défaut (France) avant géolocalisation.
const DEFAULT_CENTER: [number, number] = [46.6, 2.4];
const DEFAULT_ZOOM = 5;
const MAX_RESULTS = 10;
// Rayons de recherche successifs (m) : on élargit tant qu'on a trop peu de résultats.
const RADII = [1500, 5000, 15000];
// API Overpass (OpenStreetMap), gratuite et sans clé. Second serveur en secours.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

type OverpassElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function distanceMeters(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function queryOverpass(lat: number, lon: number, radius: number): Promise<OverpassElement[]> {
  const q = `[out:json][timeout:20];(node["amenity"="pharmacy"](around:${radius},${lat},${lon});way["amenity"="pharmacy"](around:${radius},${lat},${lon}););out center tags;`;
  let lastError: unknown;
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(q)}`,
      });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const json = (await res.json()) as { elements?: OverpassElement[] };
      return json.elements ?? [];
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

function toPharmacy(el: OverpassElement, origin: [number, number], fallbackName: string): Pharmacy | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;
  const tags = el.tags ?? {};
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const city = [tags["addr:postcode"], tags["addr:city"]].filter(Boolean).join(" ");
  return {
    id: `${el.type}/${el.id}`,
    name: tags.name || fallbackName,
    lat,
    lon,
    address: [street, city].filter(Boolean).join(", ") || undefined,
    phone: tags.phone || tags["contact:phone"],
    distance: distanceMeters(origin, [lat, lon]),
  };
}

async function findNearest(origin: [number, number], fallbackName: string) {
  let found: Pharmacy[] = [];
  for (const radius of RADII) {
    const elements = await queryOverpass(origin[0], origin[1], radius);
    found = elements
      .map((el) => toPharmacy(el, origin, fallbackName))
      .filter((p): p is Pharmacy => p !== null)
      .sort((a, b) => a.distance - b.distance);
    if (found.length >= 5) break;
  }
  return found.slice(0, MAX_RESULTS);
}

function directionsUrl(p: Pharmacy) {
  return `https://www.openstreetmap.org/directions?to=${p.lat}%2C${p.lon}`;
}

export function NearbyPharmacies() {
  const t = useTranslations("Pharmacies.map");
  const locale = useLocale();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  // Initialise la carte côté client uniquement (Leaflet dépend de window).
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(mapEl.current, { scrollWheelZoom: false }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const formatDistance = (m: number) =>
    m < 1000
      ? `${Math.round(m / 10) * 10} m`
      : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(m / 1000)} km`;

  function drawResults(origin: [number, number], list: Pharmacy[]) {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();

    L.circleMarker(origin, { radius: 9, color: "#ffffff", weight: 3, fillColor: "#22d3ee", fillOpacity: 1 })
      .bindTooltip(t("you"))
      .addTo(layer);

    list.forEach((p, i) => {
      const popup = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = p.name;
      popup.appendChild(title);
      if (p.address) {
        const addr = document.createElement("div");
        addr.textContent = p.address;
        popup.appendChild(addr);
      }
      const dist = document.createElement("div");
      dist.textContent = formatDistance(p.distance);
      popup.appendChild(dist);
      const link = document.createElement("a");
      link.href = directionsUrl(p);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = t("directions");
      popup.appendChild(link);

      const icon = L.divIcon({
        className: "",
        html: `<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:#0f2a4a;color:#67e8f9;border:2px solid #fff;font:700 13px/1 sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.3)">${i + 1}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([p.lat, p.lon], { icon, title: p.name, alt: p.name })
        .bindPopup(popup)
        .on("click", () => setSelected(p.id))
        .addTo(layer);
    });

    const bounds = L.latLngBounds([origin, ...list.map((p) => [p.lat, p.lon] as [number, number])]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }

  function locate() {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const origin: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setStatus("searching");
        try {
          const list = await findNearest(origin, t("unnamed"));
          setPharmacies(list);
          setSelected(null);
          drawResults(origin, list);
          setStatus(list.length ? "ready" : "empty");
        } catch {
          setStatus("error");
        }
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  function focus(p: Pharmacy) {
    setSelected(p.id);
    mapRef.current?.setView([p.lat, p.lon], 17);
    layerRef.current?.eachLayer((layer) => {
      const m = layer as import("leaflet").Marker;
      if (typeof m.getLatLng === "function" && m.options.title === p.name) {
        const ll = m.getLatLng();
        if (ll.lat === p.lat && ll.lng === p.lon) m.openPopup();
      }
    });
  }

  const busy = status === "locating" || status === "searching";
  const message =
    status === "idle" ? t("idle")
    : status === "locating" ? t("locating")
    : status === "searching" ? t("searching")
    : status === "empty" ? t("empty")
    : status === "denied" ? t("denied")
    : status === "unsupported" ? t("unsupported")
    : status === "error" ? t("error")
    : t("found", { count: pharmacies.length });

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div>
        <div
          ref={mapEl}
          role="region"
          aria-label={t("label")}
          className="relative z-0 h-[380px] overflow-hidden rounded-3xl border border-navy-100 bg-navy-50 shadow-soft sm:h-[500px]"
        />
        <p className="mt-3 text-xs text-navy-500">{t("privacy")}</p>
      </div>

      <div className="flex flex-col gap-4">
        <button type="button" onClick={locate} disabled={busy} className="btn-dark disabled:opacity-60">
          <span aria-hidden="true">📍</span>
          {status === "ready" || status === "empty" ? t("refresh") : t("button")}
        </button>
        <p aria-live="polite" role="status" className="text-sm text-navy-700">
          {message}
        </p>
        {pharmacies.length > 0 && (
          <ol className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
            {pharmacies.map((p, i) => (
              <li key={p.id}>
                <div
                  className={`rounded-xl border p-3 transition-colors ${
                    selected === p.id ? "border-cyan-500 bg-navy-50" : "border-navy-100"
                  }`}
                >
                  <button type="button" onClick={() => focus(p)} className="flex w-full items-start gap-3 text-left">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-cyan-300">
                      {i + 1}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="font-semibold">{p.name}</span>
                      {p.address && <span className="text-xs text-navy-500">{p.address}</span>}
                      <span className="text-xs font-semibold text-navy-700">{formatDistance(p.distance)}</span>
                    </span>
                  </button>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-10 text-xs">
                    <a href={directionsUrl(p)} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-800 underline">
                      {t("directions")}
                    </a>
                    {p.phone && (
                      <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="text-navy-700 underline">
                        {p.phone}
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
        <p className="text-xs leading-relaxed text-navy-500">{t("source")}</p>
      </div>
    </div>
  );
}
