/**
 * Plain-language glossary for the Sanskrit / devotional terms used across the
 * platform. ONE source of truth so every tooltip, gloss and the glossary page
 * stay consistent and correct (devotional-accuracy principle: a term is only
 * as good as its definition — keep these accurate and general, never invented).
 *
 * `short` — one line, fits inside a tooltip (≈10–16 words).
 * `long`  — 1–2 sentences for the glossary page.
 * Keys are lowercase slugs; they double as the glossary-page anchor (#slug).
 */
export type GlossaryEntry = {
  term: string;        // display form, with diacritics
  deva?: string;       // Devanagari, where it helps
  short: string;       // tooltip line
  long: string;        // glossary-page explanation
  group: "time" | "choghadiya" | "vastu" | "materials";
};

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // ── The sacred calendar (Panchang) ──────────────────────────────────────
  panchang: {
    term: "Panchāng", deva: "पञ्चाङ्ग", group: "time",
    short: "The Hindu almanac — the five parts that describe a day's quality.",
    long: "The traditional Hindu calendar. It reads five ‘limbs’ of each day — tithi, nakshatra, yoga, karana and the weekday — to tell you the quality and timing of a day for rituals and new beginnings.",
  },
  tithi: {
    term: "Tithi", deva: "तिथि", group: "time",
    short: "A lunar day — one of the 30 phases of the moon in a lunar month.",
    long: "A lunar ‘day’, set by the moon's angle to the sun. There are 30 in a lunar month, and they decide when festivals and fasts fall — not the ordinary calendar date.",
  },
  nakshatra: {
    term: "Nakṣatra", deva: "नक्षत्र", group: "time",
    short: "The lunar mansion — the star-group the moon sits in today.",
    long: "One of 27 star constellations (‘lunar mansions’) the moon travels through. The nakshatra of the day carries its own character, used in choosing auspicious moments.",
  },
  yoga: {
    term: "Yoga", deva: "योग", group: "time",
    short: "One of 27 sun–moon combinations that colour the day.",
    long: "In the calendar sense, one of 27 combinations of the sun and moon's positions — each lending the day a favourable or cautious tone.",
  },
  karana: {
    term: "Karaṇa", deva: "करण", group: "time",
    short: "Half of a tithi — the smallest unit of the lunar day.",
    long: "Half of a tithi; one of eleven that recur through the lunar month, used for fine-tuning the timing of an act.",
  },
  masa: {
    term: "Māsa", deva: "मास", group: "time",
    short: "A lunar month, such as Śrāvaṇa or Kārtika.",
    long: "A month of the Hindu lunar calendar (Caitra, Śrāvaṇa, Kārtika…). Festivals are named by their māsa and tithi.",
  },
  paksha: {
    term: "Pakṣa", deva: "पक्ष", group: "time",
    short: "The lunar fortnight — waxing (Śukla) or waning (Kṛṣṇa).",
    long: "The half-month between new and full moon. Śukla pakṣa is the bright, waxing half; Kṛṣṇa pakṣa is the dark, waning half.",
  },
  shukla: {
    term: "Śukla Pakṣa", deva: "शुक्ल पक्ष", group: "time",
    short: "The bright fortnight — the moon waxing toward full.",
    long: "The bright half of the lunar month, from new moon to full moon, when the moon grows fuller each night. Traditionally the more auspicious fortnight for beginnings.",
  },
  krishna: {
    term: "Kṛṣṇa Pakṣa", deva: "कृष्ण पक्ष", group: "time",
    short: "The dark fortnight — the moon waning toward new.",
    long: "The dark half of the lunar month, from full moon to new moon, when the moon shrinks each night.",
  },
  purnima: {
    term: "Pūrṇimā", deva: "पूर्णिमा", group: "time",
    short: "The full-moon day.",
    long: "The full moon — the brightest tithi, when many festivals (like Raksha Bandhan and Guru Pūrṇimā) are observed.",
  },
  amavasya: {
    term: "Amāvāsyā", deva: "अमावस्या", group: "time",
    short: "The new-moon day.",
    long: "The new moon — the dark tithi. Some observances (like Diwali) fall on it; it is generally kept for ancestral rites rather than new ventures.",
  },
  muhurta: {
    term: "Muhūrta", deva: "मुहूर्त", group: "time",
    short: "An auspicious moment chosen for an important act.",
    long: "A carefully-elected auspicious time-window for an important act — a wedding, a housewarming, installing a sacred object. Choosing it well is a small science of its own.",
  },
  "rahu-kala": {
    term: "Rāhu Kāla", deva: "राहु काल", group: "time",
    short: "A ~90-minute period each day best avoided for new beginnings.",
    long: "An inauspicious window of roughly 90 minutes that falls at a different time each weekday. Tradition avoids starting anything important during it — though ongoing work is fine.",
  },

  // ── Choghadiya (the day's good/bad windows) ─────────────────────────────
  choghadiya: {
    term: "Choghadiya", deva: "चौघड़िया", group: "choghadiya",
    short: "The day split into 8 windows, each good or poor for starting things.",
    long: "A simple, popular way to time the day: sunrise-to-sunset (and night) is divided into eight roughly 90-minute windows, each marked auspicious or inauspicious for beginning a new task, journey or purchase.",
  },
  amrta: {
    term: "Amṛta", deva: "अमृत", group: "choghadiya",
    short: "The most auspicious window — ‘nectar’; excellent for anything.",
    long: "‘Nectar of immortality’ — the most auspicious Choghadiya. An excellent time to begin anything of importance.",
  },
  shubha: {
    term: "Śubha", deva: "शुभ", group: "choghadiya",
    short: "‘Auspicious’ — favourable for ceremonies, worship and study.",
    long: "‘Auspicious’ — a favourable Choghadiya, especially good for ceremonies, worship, education and auspicious purchases.",
  },
  labha: {
    term: "Lābha", deva: "लाभ", group: "choghadiya",
    short: "‘Gain’ — favourable for business and new ventures.",
    long: "‘Gain / profit’ — a favourable Choghadiya for business dealings, new ventures and learning.",
  },
  chala: {
    term: "Cala", deva: "चल", group: "choghadiya",
    short: "‘Moving’ — neutral-to-good, well suited to travel.",
    long: "‘Moving’ — a neutral-to-favourable Choghadiya, considered good for travel and things involving movement.",
  },
  udvega: {
    term: "Udvega", deva: "उद्वेग", group: "choghadiya",
    short: "‘Anxiety’ — inauspicious; best not to start something new.",
    long: "‘Anxiety / agitation’ — an inauspicious Choghadiya (linked to the Sun), traditionally avoided for beginning anything new.",
  },
  roga: {
    term: "Roga", deva: "रोग", group: "choghadiya",
    short: "‘Illness’ — inauspicious; better to wait.",
    long: "‘Illness / affliction’ — an inauspicious Choghadiya, kept clear of new beginnings.",
  },
  kala: {
    term: "Kāla", deva: "काल", group: "choghadiya",
    short: "‘Time/death’ — inauspicious; avoid for important work.",
    long: "‘Time / death’ — an inauspicious Choghadiya (linked to Saturn), avoided for auspicious or important undertakings.",
  },

  // ── Vāstu & the directions ──────────────────────────────────────────────
  vastu: {
    term: "Vāstu Śāstra", deva: "वास्तु शास्त्र", group: "vastu",
    short: "The Indian science of placement — aligning a home with the directions.",
    long: "The traditional Indian science of architecture and placement. It treats a home as a living body of nine directions, and guides where each space and sacred object belongs for harmony and wellbeing.",
  },
  dikpala: {
    term: "Dikpāla", deva: "दिक्पाल", group: "vastu",
    short: "The guardian deity of a direction (e.g. Kubera of the north).",
    long: "The guardian deity of a direction — Indra of the east, Kubera of the north, and so on. Vāstu places each object in the corner its Dikpāla governs.",
  },
  yantra: {
    term: "Yantra", deva: "यन्त्र", group: "vastu",
    short: "A sacred geometric diagram used for focus and worship.",
    long: "A sacred geometric diagram used as a tool for meditation and worship — a ‘machine’ for the mind that concentrates a deity's energy.",
  },
  "sri-yantra": {
    term: "Śrī Yantra", deva: "श्री यन्त्र", group: "vastu",
    short: "The most revered yantra — nine triangles of abundance and grace.",
    long: "The most revered yantra: nine interlocking triangles radiating from a central point, representing the union of the divine feminine and masculine. Associated with Lakṣmī, abundance and grace.",
  },
  kalash: {
    term: "Kalash", deva: "कलश", group: "vastu",
    short: "A sacred pot symbolising abundance and the divine.",
    long: "A sacred pot — often of copper or brass — filled and adorned in rituals. It symbolises abundance, the womb of creation, and the presence of the divine.",
  },

  // ── Sacred materials ────────────────────────────────────────────────────
  ashtadhatu: {
    term: "Aṣṭadhātu", deva: "अष्टधातु", group: "materials",
    short: "‘Eight metals’ — a sacred alloy used for idols and objects.",
    long: "‘Eight metals’ — a traditional sacred alloy (including gold, silver, copper, zinc and others) prized for idols and sacred objects, believed to hold and radiate positive energy.",
  },
  panchadhatu: {
    term: "Pañcadhātu", deva: "पञ्चधातु", group: "materials",
    short: "‘Five metals’ — a sacred alloy for idols and talismans.",
    long: "‘Five metals’ — a sacred alloy of five metals used for idols, rings and talismans in the Hindu tradition.",
  },
};

/** Ordered groups for the glossary page. */
export const GLOSSARY_GROUPS: { key: GlossaryEntry["group"]; title: string; blurb: string }[] = [
  { key: "time", title: "The sacred calendar", blurb: "How a Hindu day is read — the moon, the fortnight and the moments within it." },
  { key: "choghadiya", title: "Choghadiya — the day's windows", blurb: "The eight windows that make a moment good or poor for beginning something." },
  { key: "vastu", title: "Vāstu & the directions", blurb: "The science of placing a home and its sacred objects in harmony." },
  { key: "materials", title: "Sacred materials", blurb: "The metals our pieces are cast from, and why they're chosen." },
];

export function getTerm(key: string): GlossaryEntry | undefined {
  return GLOSSARY[key.toLowerCase()];
}
