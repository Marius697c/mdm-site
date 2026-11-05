import { NextResponse } from "next/server";
import { ALLOWED_RADII, queryOverpass } from "@/lib/overpass";

export const runtime = "nodejs";

// Secours côté serveur quand le navigateur n'arrive pas à joindre Overpass
// (bloqueur, réseau d'entreprise, serveur public qui refuse la requête…).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Arrondi à ~100 m : protège la vie privée et améliore le cache.
  const lat = Math.round(Number(searchParams.get("lat")) * 1000) / 1000;
  const lon = Math.round(Number(searchParams.get("lon")) * 1000) / 1000;
  const radius = Number(searchParams.get("radius"));
  if (
    !Number.isFinite(lat) || !Number.isFinite(lon) ||
    Math.abs(lat) > 90 || Math.abs(lon) > 180 ||
    !(ALLOWED_RADII as readonly number[]).includes(radius)
  ) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }
  try {
    const elements = await queryOverpass(lat, lon, radius, 20000, {
      headers: { "User-Agent": "mdm-site (pharmacy map)" },
    });
    return NextResponse.json(
      { elements },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch {
    return NextResponse.json({ error: "overpass_unavailable" }, { status: 502 });
  }
}
