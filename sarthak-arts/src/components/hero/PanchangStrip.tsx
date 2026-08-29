import { computePanchang, fmtIST } from "@/lib/panchang";
import { readPanchangPreferences } from "@/lib/panchang/preferences";
import { isSolarNativeRegion, nativeCalendarLabel } from "@/lib/panchang/cities";
import { PanchangSwitcher } from "./PanchangSwitcher";
import { Term } from "@/components/Term";

/** Map a Choghadiya label to its glossary key. */
const CHOGHADIYA_KEY: Record<string, string> = {
  "Amṛta": "amrta", "Śubha": "shubha", "Lābha": "labha", "Cala": "chala",
  "Udvega": "udvega", "Roga": "roga", "Kāla": "kala",
};

/**
 * Live panchang strip — five cells + citation with a switcher.
 * Reads city + masa-system preferences via readPanchangPreferences() with
 * city-appropriate defaults (Delhi → Pūrṇimānta, Bengaluru → Amānta, etc.).
 * Every value is computed live from mhah-panchang + suncalc — verified
 * against Drik Panchang (see scripts/verify-panchang.ts).
 *
 * Fail-loud: on error the strip renders a plain "temporarily unavailable"
 * state — never a fabricated value.
 */
export async function PanchangStrip() {
  const prefs = await readPanchangPreferences();
  const p = computePanchang(prefs.city.code, undefined, { masaSystem: prefs.masaSystem });

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
  // Show the lunar fortnight (masa + paksha) instead of "Āṣāḍha 14" —
  // a Gregorian day-of-month next to a lunar month reads as a tithi it isn't.
  const pakshaLabel = p.tithi.paksha === "śukla" ? "Śukla" : "Kṛṣṇa";
  const fortnight = `${p.masa.iast} · ${pakshaLabel}`;
  const now = p.choghadiyaNow;
  const auspiciousClass = now ? (now.auspicious ? "now" : "avoid") : "";

  return (
    <section className="sa-panchang" aria-label="Today's panchang">
      <div className="sa-panchang-grid">
        <div className="sa-panchang-cell">
          <div className="sa-panchang-lbl">Today</div>
          <div className="sa-panchang-val">{dateFmt}<b>{fortnight}</b></div>
        </div>
        <div className="sa-panchang-cell">
          <div className="sa-panchang-lbl"><Term name="tithi">Tithi</Term></div>
          <div className="sa-panchang-val">
            {p.tithi.paksha === "śukla" ? "Śukla" : "Kṛṣṇa"}
            <b lang="sa">{p.tithi.deva}</b>
          </div>
        </div>
        <div className="sa-panchang-cell">
          <div className="sa-panchang-lbl"><Term name="nakshatra">Nakshatra</Term></div>
          <div className="sa-panchang-val">{p.nakshatra.iast}<b lang="sa">{p.nakshatra.deva}</b></div>
        </div>
        <div className={`sa-panchang-cell ${auspiciousClass}`}>
          <div className="sa-panchang-lbl">Now · <Term name="choghadiya">Choghadiya</Term></div>
          <div className="sa-panchang-val">
            {now ? (now.auspicious ? "Auspicious" : "Inauspicious") : "—"}
            <b lang="sa">{now ? <>{now.deva} · <Term name={CHOGHADIYA_KEY[now.label] ?? "choghadiya"}>{now.iast}</Term></> : ""}</b>
          </div>
        </div>
        <div className="sa-panchang-cell avoid">
          <div className="sa-panchang-lbl">Avoid</div>
          <div className="sa-panchang-val"><Term name="rahu-kala">Rāhu Kāla</Term><b>{fmtIST(p.rahuKala.start)} – {fmtIST(p.rahuKala.end)}</b></div>
        </div>
      </div>
      <div className="sa-panchang-cite">
        Live via <b>mhah-panchang</b> · Lahiri Ayanamsa · {p.city.name} · {p.masaSystem === "purnimanta" ? "Pūrṇimānta" : "Amānta"} reckoning · verified against Drik Panchang
        {" "}
        <PanchangSwitcher currentCityCode={p.city.code} currentMasaSystem={p.masaSystem} />
        {isSolarNativeRegion(p.city) && (
          <div className="sa-panchang-solar-note">
            {p.city.state}'s primary calendar is <b>{nativeCalendarLabel(p.city.nativeCalendar)}</b>. A dedicated solar panchang for your region is on our roadmap; for now the universally-valid lunar panchang is shown above.
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * The hero announcement pill — "Labh Choghadiya · auspicious to begin any ritual · until 4:11 PM"
 * Now live: reads the current Choghadiya window and its end time.
 */
export async function HeroAnnouncement() {
  const prefs = await readPanchangPreferences();
  const p = computePanchang(prefs.city.code, undefined, { masaSystem: prefs.masaSystem });
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
        <b><Term name={CHOGHADIYA_KEY[now.label] ?? "choghadiya"}>{now.iast}</Term> <Term name="choghadiya">Choghadiya</Term></b> · {meaning} · until {fmtIST(now.end)}
      </span>
    </div>
  );
}
