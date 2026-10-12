import { NextResponse, type NextRequest } from "next/server";

/**
 * Place suggestions for the birth-place field, via Photon (OpenStreetMap data,
 * built for search-as-you-type, no API key). Proxied so results are cached and
 * the provider can be swapped without touching the form.
 */
const SETTLEMENTS = new Set(["city", "town", "village", "hamlet", "suburb", "municipality", "county", "district", "borough", "locality"]);

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: { name?: string; county?: string; district?: string; city?: string; state?: string; country?: string; countrycode?: string; osm_value?: string };
};

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ places: [] });

  const url = new URL("https://photon.komoot.io/api/");
  url.search = new URLSearchParams({ q, limit: "15", lang: "en", lat: "23", lon: "79", zoom: "4", location_bias_scale: "0.05", osm_tag: "place" }).toString();

  try {
    const res = await fetch(url, { headers: { "User-Agent": "SarthakArts/1.0 (https://sarthakarts.in)" }, next: { revalidate: 86400 } });
    if (!res.ok) return NextResponse.json({ places: [] });
    const data = (await res.json()) as { features?: PhotonFeature[] };

    const seen = new Set<string>();
    const places = (data.features ?? [])
      .filter((f) => f.properties.name && SETTLEMENTS.has(f.properties.osm_value ?? ""))
      .map((f) => {
        const p = f.properties;
        const parts = [p.name, p.county ?? p.district, p.state, p.country].filter((x): x is string => !!x);
        const label = parts.filter((x, i) => parts.indexOf(x) === i).join(", ");
        return { label, india: p.countrycode === "IN", lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] };
      })
      .filter((p) => !seen.has(p.label) && seen.add(p.label))
      .sort((a, b) => Number(b.india) - Number(a.india))
      .slice(0, 6)
      .map(({ label, lat, lon }) => ({ label, lat, lon }));

    return NextResponse.json({ places }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch {
    return NextResponse.json({ places: [] });
  }
}
