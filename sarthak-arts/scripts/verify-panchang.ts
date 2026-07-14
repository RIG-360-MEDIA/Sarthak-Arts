/**
 * Panchang cross-check — run BEFORE wiring the engine to any UI.
 *
 * Every assertion is a well-documented, universally-agreed Hindu festival
 * date whose tithi/paksha/masa cannot be in dispute. If any assertion
 * fails, the engine is wrong and we do NOT ship — per the
 * devotional-data-accuracy principle.
 *
 * Reference dates (all observed pan-India, published in every panchang):
 *   2024-03-17  Rāma Navamī       Caitra   Śukla    Navamī
 *   2024-08-19  Raksha Bandhan     Śrāvaṇa  Śukla    Pūrṇimā
 *   2024-10-31  Deepāvalī (Diwali) Āśvina/Kārtika  Kṛṣṇa    Amāvāsyā
 *                                  (mhah returns Āśvina — amāvāsyā of a lunar
 *                                   month is the day the month "ends" per the
 *                                   amānta system, so Diwali amāvāsyā is
 *                                   Āśvina-end / Kārtika-start depending on
 *                                   convention. Both are traditionally correct.)
 *
 * Run:  npx tsx scripts/verify-panchang.ts
 */
import "dotenv/config";
import { computePanchang } from "../src/lib/panchang";

type Case = {
  label: string;
  date: string;                          // YYYY-MM-DD local IST
  city: "delhi" | "varanasi";
  expect: {
    tithi_iast: string;
    paksha: "śukla" | "kṛṣṇa";
    masa_iast: string | string[];        // allow set of acceptable values
  };
};

const CASES: Case[] = [
  {
    label: "Rāma Navamī 2024",
    date: "2024-04-17",   // Rama Navami fell on April 17 2024
    city: "delhi",
    expect: { tithi_iast: "Navamī", paksha: "śukla", masa_iast: "Caitra" },
  },
  {
    label: "Raksha Bandhan 2024",
    date: "2024-08-19",
    city: "delhi",
    expect: { tithi_iast: "Pūrṇimā", paksha: "śukla", masa_iast: "Śrāvaṇa" },
  },
  {
    // At Delhi sunrise on Nov 1, Amāvāsyā has been active since 06:16 PM Oct 31.
    // Diwali is popularly observed Oct 31 (Pradosh Kaal rule), but the tithi
    // AT SUNRISE is Amāvāsyā on Nov 1 — that's what the panchang engine reports.
    label: "Kārtika Amāvāsyā 2024 (Diwali)",
    date: "2024-11-01",
    city: "delhi",
    expect: { tithi_iast: "Amāvāsyā", paksha: "kṛṣṇa", masa_iast: "Kārtika" },
  },
];

let failed = 0;

for (const c of CASES) {
  // Sample at mid-morning IST — well after sunrise so tithi convention holds
  const at = new Date(`${c.date}T09:00:00+05:30`);
  const p = computePanchang(c.city, at);
  if (!p.ok) {
    console.error(`\n✗ ${c.label}: engine returned error: ${p.error}`);
    failed++;
    continue;
  }
  const gotMasa = p.masa.iast;
  const expectMasa = Array.isArray(c.expect.masa_iast) ? c.expect.masa_iast : [c.expect.masa_iast];
  const okTithi = p.tithi.iast === c.expect.tithi_iast;
  const okPaksha = p.tithi.paksha === c.expect.paksha;
  const okMasa = expectMasa.includes(gotMasa);

  const status = okTithi && okPaksha && okMasa ? "✓" : "✗";
  console.log(
    `${status} ${c.label} @ ${c.city}\n` +
    `    expected: ${c.expect.paksha.padEnd(6)} ${c.expect.tithi_iast.padEnd(10)} ${expectMasa.join("|")}\n` +
    `    got:      ${p.tithi.paksha.padEnd(6)} ${p.tithi.iast.padEnd(10)} ${gotMasa}\n` +
    `    sunrise:  ${p.sunrise.toISOString()}   weekday: ${p.weekday}`,
  );
  if (!(okTithi && okPaksha && okMasa)) failed++;
}

console.log("\n─────────────────────────────────────────────");
console.log(`Result: ${CASES.length - failed}/${CASES.length} passed`);
if (failed > 0) {
  console.error("PANCHANG ENGINE FAILED VERIFICATION — do not wire to UI.");
  process.exit(1);
}
console.log("Panchang engine verified against reference festival dates.");

// Also print live "today" for a quick sanity glance
const today = computePanchang("delhi");
if (today.ok) {
  console.log("\n── Live sample: today in New Delhi ──");
  console.log(`  ${today.weekday} · sunrise ${today.sunrise.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST`);
  console.log(`  Tithi: ${today.tithi.paksha === "śukla" ? "Śukla" : "Kṛṣṇa"} ${today.tithi.iast} (${today.tithi.deva})`);
  console.log(`  Nakṣatra: ${today.nakshatra.iast} (${today.nakshatra.deva})`);
  console.log(`  Yoga: ${today.yoga.iast}   Karaṇa: ${today.karana.iast}   Māsa: ${today.masa.iast}`);
  console.log(`  Now: ${today.choghadiyaNow?.iast ?? "—"}${today.choghadiyaNow?.auspicious ? " (auspicious)" : today.choghadiyaNow ? " (inauspicious)" : ""}`);
  console.log(`  Rāhu Kāla: ${today.rahuKala.start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} – ${today.rahuKala.end.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}`);
}
