import { computePanchang, fmtIST } from "@/lib/panchang";
import { cookies } from "next/headers";

const CITY_COOKIE = "panchang_city";

/**
 * Live panchang strip — five cells + citation.
 * Reads the visitor's preferred city from cookie (set by the switcher, TBD)
 * and defaults to Delhi. Every value is computed from mhah-panchang +
 * suncalc at request time — verified accurate against Drik Panchang
 * (see scripts/verify-panchang.ts).
 *
 * Fail-loud: on error the strip renders a plain "temporarily unavailable"
 * state — never a fabricated value.
 */
export async function PanchangStrip() {
  const jar = await cookies();
  const cityCode = jar.get(CITY_COOKIE)?.value;
  const p = computePanchang(cityCode);

  if (!p.ok) {
    return (
      <section className="sa-panchang" aria-label="Today's panchang">
        <div className="sa-panchang-grid">
          <div className="sa-panchang-cell" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
            <div className="sa-panchang-lbl">Panchang</div>
            <div className="sa-panchang-val">Temporarily unavailable<b>please try again shortly</b></div>
          </div>
        </div>
      </section>
    );
  }

  const dateFmt = p.sunrise.toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
  const dayNum = p.sunrise.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" });
  const now = p.choghadiyaNow;
  const auspiciousClass = now ? (now.auspicious ? "now" : "avoid") : "";

  return (
    <section className="sa-panchang" aria-label="Today's panchang">
      <div className="sa-panchang-grid">
        <div className="sa-panchang-cell">
          <div className="sa-panchang-lbl">Today</div>
          <div className="sa-panchang-val">{dateFmt}<b>{p.masa.iast} {dayNum}</b></div>
        </div>
        <div className="sa-panchang-cell">
          <div className="sa-panchang-lbl">Tithi</div>
          <div className="sa-panchang-val">
            {p.tithi.paksha === "śukla" ? "Śukla" : "Kṛṣṇa"}
            <b lang="sa">{p.tithi.deva}</b>
          </div>
        </div>
        <div className="sa-panchang-cell">
          <div className="sa-panchang-lbl">Nakshatra</div>
          <div className="sa-panchang-val">{p.nakshatra.iast}<b lang="sa">{p.nakshatra.deva}</b></div>
        </div>
        <div className={`sa-panchang-cell ${auspiciousClass}`}>
          <div className="sa-panchang-lbl">Now · Choghadiya</div>
          <div className="sa-panchang-val">
            {now ? (now.auspicious ? "Auspicious" : "Inauspicious") : "—"}
            <b lang="sa">{now ? `${now.deva} · ${now.iast}` : ""}</b>
          </div>
        </div>
        <div className="sa-panchang-cell avoid">
          <div className="sa-panchang-lbl">Avoid</div>
          <div className="sa-panchang-val">Rāhu Kāla<b>{fmtIST(p.rahuKala.start)} – {fmtIST(p.rahuKala.end)}</b></div>
        </div>
      </div>
      <div className="sa-panchang-cite">
        Live via <b>mhah-panchang</b> · Lahiri Ayanamsa · {p.city.name} {p.city.lat.toFixed(2)}°N {p.city.lon.toFixed(2)}°E · Pūrṇimānta reckoning · verified against Drik Panchang
      </div>
    </section>
  );
}

/**
 * The hero announcement pill — "Labh Choghadiya · auspicious to begin any ritual · until 4:11 PM"
 * Now live: reads the current Choghadiya window and its end time.
 */
export async function HeroAnnouncement() {
  const jar = await cookies();
  const cityCode = jar.get(CITY_COOKIE)?.value;
  const p = computePanchang(cityCode);
  if (!p.ok || !p.choghadiyaNow) {
    // Silent, honest fallback — no anno pill rather than a fake one.
    return null;
  }
  const now = p.choghadiyaNow;
  const meaning = now.auspicious
    ? "auspicious to begin any ritual"
    : "inauspicious — begin nothing new";
  return (
    <div className="sa-hero-anno">
      <span className="dot" aria-hidden="true" />
      <span>
        <b>{now.iast} Choghadiya</b> · {meaning} · until {fmtIST(now.end)}
      </span>
    </div>
  );
}
