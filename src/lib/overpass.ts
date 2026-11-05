// Recherche de pharmacies via l'API Overpass (OpenStreetMap), gratuite et sans clé.
// Partagé entre le navigateur et la route /api/pharmacies (secours côté serveur).

export type OverpassElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export const ALLOWED_RADII = [3000, 15000] as const;

function buildQuery(lat: number, lon: number, radius: number, timeoutS: number) {
  return `[out:json][timeout:${timeoutS}];nwr["amenity"="pharmacy"](around:${radius},${lat.toFixed(5)},${lon.toFixed(5)});out center tags;`;
}

/**
 * Interroge tous les serveurs en parallèle et garde la première réponse valide.
 * Une réponse « 200 » qui contient une erreur Overpass (champ remark) est rejetée,
 * sinon un serveur saturé renverrait une liste vide plus vite que les autres.
 */
export async function queryOverpass(
  lat: number,
  lon: number,
  radius: number,
  timeoutMs: number,
  init?: RequestInit,
): Promise<OverpassElement[]> {
  const q = buildQuery(lat, lon, radius, Math.ceil(timeoutMs / 1000));
  const controllers = OVERPASS_ENDPOINTS.map(() => new AbortController());
  const timer = setTimeout(() => controllers.forEach((c) => c.abort()), timeoutMs);
  try {
    return await Promise.any(
      OVERPASS_ENDPOINTS.map(async (url, i) => {
        const res = await fetch(url, {
          ...init,
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", ...(init?.headers ?? {}) },
          body: `data=${encodeURIComponent(q)}`,
          signal: controllers[i].signal,
        });
        if (!res.ok) throw new Error(`${url} ${res.status}`);
        const json = (await res.json()) as { elements?: OverpassElement[]; remark?: string };
        if (!Array.isArray(json.elements)) throw new Error(`${url} invalid response`);
        if (json.remark && json.elements.length === 0) throw new Error(`${url} ${json.remark}`);
        controllers.forEach((c, j) => j !== i && c.abort());
        return json.elements;
      }),
    );
  } finally {
    clearTimeout(timer);
  }
}
