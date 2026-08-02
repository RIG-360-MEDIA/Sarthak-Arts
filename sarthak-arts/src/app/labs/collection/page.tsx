import type { Metadata } from "next";
import { CollectionHero } from "@/components/collection/CollectionHero";
import { computePanchang } from "@/lib/panchang";
import { readPanchangPreferences } from "@/lib/panchang/preferences";
import type { PanchangFlags } from "@/components/collection/panchang-flags";
import "./collection.css";

export const metadata: Metadata = {
  title: "The Collection — Sarthak Arts",
  description:
    "Murtis and Vastu instruments in copper, brass and silver — each piece built for one direction, one purpose, one home.",
};

/**
 * Serialise the full Panchang service result into the flat, cheap
 * PanchangFlags shape the client scene needs. Discards everything the
 * background visuals don't consume (tithi names, choghadiya windows,
 * yoga, karana, masa, city info). On failure, returns `{ok:false}` —
 * the client scene gracefully drops its cosmic-time acknowledgment
 * layer rather than fabricate a value.
 */
async function computePanchangFlags(): Promise<PanchangFlags> {
  try {
    const prefs = await readPanchangPreferences();
    const p = computePanchang(prefs.city.code, undefined, { masaSystem: prefs.masaSystem });
    if (!p.ok) return { ok: false };
    return {
      ok: true,
      weekday: p.weekday,
      sunriseTs: p.sunrise.getTime(),
      sunsetTs: p.sunset.getTime(),
    };
  } catch {
    return { ok: false };
  }
}

export default async function CollectionLabPage() {
  const panchang = await computePanchangFlags();
  return (
    <div className="collection-page">
      <CollectionHero panchang={panchang} />
      <div style={{ padding: "48px 24px", color: "var(--silk-faint)", fontSize: 14 }}>
        Filters, the direction compass, and the product grid land next — this
        page currently previews only the hero section.
      </div>
    </div>
  );
}
