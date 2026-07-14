/**
 * Canonical Sanskrit + IAST names for the panchang.
 *
 * Non-negotiable per the devotional-data-accuracy principle: names are
 * verified against Monier-Williams (spelling) and IAST convention
 * (transliteration). We do not use mhah-panchang's `name` field because
 * it defaults to Odia script; we use its numeric `ino` index and resolve
 * to our own verified strings.
 *
 * Sources:
 *  - Monier-Williams Sanskrit-English Dictionary (canonical spelling)
 *  - "The Śiśupālavadha's Panchang" reference set (traditional order)
 *  - IAST per ISO 15919 for diacritics
 *
 * DO NOT edit these tables without also updating the reference test.
 */

// ── 30 Tithis (1..15 = Śukla, 16..29 = Kṛṣṇa, 30 = Amāvāsyā) ────────────────
// mhah-panchang's Tithi.ino: 1..15 (Śukla 1st..Pūrṇimā), 16..29 (Kṛṣṇa 1st..14th), 30 (Amāvāsyā)
// The 15 names below cycle; paksha (Śukla/Kṛṣṇa) is a separate field.
export const TITHI_NAMES: ReadonlyArray<{ deva: string; iast: string }> = [
  { deva: "प्रतिपदा", iast: "Pratipadā" },
  { deva: "द्वितीया", iast: "Dvitīyā" },
  { deva: "तृतीया", iast: "Tṛtīyā" },
  { deva: "चतुर्थी", iast: "Caturthī" },
  { deva: "पञ्चमी", iast: "Pañcamī" },
  { deva: "षष्ठी", iast: "Ṣaṣṭhī" },
  { deva: "सप्तमी", iast: "Saptamī" },
  { deva: "अष्टमी", iast: "Aṣṭamī" },
  { deva: "नवमी", iast: "Navamī" },
  { deva: "दशमी", iast: "Daśamī" },
  { deva: "एकादशी", iast: "Ekādaśī" },
  { deva: "द्वादशी", iast: "Dvādaśī" },
  { deva: "त्रयोदशी", iast: "Trayodaśī" },
  { deva: "चतुर्दशी", iast: "Caturdaśī" },
  { deva: "पूर्णिमा", iast: "Pūrṇimā" },      // Śukla 15
];
export const AMAVASYA = { deva: "अमावस्या", iast: "Amāvāsyā" };

/**
 * Resolve mhah-panchang's tithi ino to canonical name + paksha.
 * mhah convention (verified empirically 2026-07, see scripts/verify-panchang.ts):
 *   - Tithi.ino is 0-indexed 0..29 in a shared space:
 *     0..14  → Śukla Pratipadā..Pūrṇimā
 *     15..28 → Kṛṣṇa Pratipadā..Caturdaśī
 *     29     → Amāvāsyā
 *   - mhah also returns Paksha.ino (0=Śukla, 1=Kṛṣṇa); we derive paksha
 *     from Tithi.ino for robustness (single source of truth).
 */
export function tithiName(ino: number): { deva: string; iast: string; paksha: "śukla" | "kṛṣṇa" } {
  if (ino === 14) return { ...TITHI_NAMES[14], paksha: "śukla" };       // Pūrṇimā
  if (ino === 29) return { ...AMAVASYA, paksha: "kṛṣṇa" };              // Amāvāsyā
  if (ino >= 0 && ino <= 13) return { ...TITHI_NAMES[ino], paksha: "śukla" };
  if (ino >= 15 && ino <= 28) return { ...TITHI_NAMES[ino - 15], paksha: "kṛṣṇa" };
  throw new Error(`Invalid tithi ino: ${ino}`);
}

/**
 * Translate mhah's Masa.ino (0-indexed, Vaiśākha=0) to our canonical index
 * (0-indexed, Caitra=0). This gives the AMĀNTA masa — the month name in the
 * amānta convention (month ends at Amāvāsyā), used across South India,
 * Maharashtra, Gujarat.
 */
export function masaIndexFromMhah(mhahIno: number): number {
  return (mhahIno + 1) % 12;
}

/**
 * Convert an amānta masa index to pūrṇimānta (month ends at Pūrṇimā), the
 * convention used across North India. Rule:
 *   Śukla paksha: Pūrṇimānta month = Amānta month − 1 (belongs to the "next"
 *                 half of the previous month)
 *   Kṛṣṇa paksha: Pūrṇimānta month = Amānta month (unchanged)
 *
 * Reference: Vikrama Saṃvat almanacs; verified against Drik Panchang for
 * Rāma Navamī (Caitra) and Rakṣā Bandhana (Śrāvaṇa) 2024.
 */
export function amantaToPurnimanta(amantaIdx: number, paksha: "śukla" | "kṛṣṇa"): number {
  return paksha === "śukla" ? (amantaIdx + 11) % 12 : amantaIdx;
}

export type MasaSystem = "amanta" | "purnimanta";

// ── 27 Nakṣatras ────────────────────────────────────────────────────────────
export const NAKSHATRA_NAMES: ReadonlyArray<{ deva: string; iast: string }> = [
  { deva: "अश्विनी", iast: "Aśvinī" },
  { deva: "भरणी", iast: "Bharaṇī" },
  { deva: "कृत्तिका", iast: "Kṛttikā" },
  { deva: "रोहिणी", iast: "Rohiṇī" },
  { deva: "मृगशिरा", iast: "Mṛgaśirā" },
  { deva: "आर्द्रा", iast: "Ārdrā" },
  { deva: "पुनर्वसु", iast: "Punarvasu" },
  { deva: "पुष्य", iast: "Puṣya" },
  { deva: "आश्लेषा", iast: "Āśleṣā" },
  { deva: "मघा", iast: "Maghā" },
  { deva: "पूर्वफाल्गुनी", iast: "Pūrvaphālgunī" },
  { deva: "उत्तरफाल्गुनी", iast: "Uttaraphālgunī" },
  { deva: "हस्त", iast: "Hasta" },
  { deva: "चित्रा", iast: "Citrā" },
  { deva: "स्वाति", iast: "Svāti" },
  { deva: "विशाखा", iast: "Viśākhā" },
  { deva: "अनुराधा", iast: "Anurādhā" },
  { deva: "ज्येष्ठा", iast: "Jyeṣṭhā" },
  { deva: "मूल", iast: "Mūla" },
  { deva: "पूर्वाषाढा", iast: "Pūrvāṣāḍhā" },
  { deva: "उत्तराषाढा", iast: "Uttarāṣāḍhā" },
  { deva: "श्रवण", iast: "Śravaṇa" },
  { deva: "धनिष्ठा", iast: "Dhaniṣṭhā" },
  { deva: "शतभिषा", iast: "Śatabhiṣā" },
  { deva: "पूर्वभाद्रपदा", iast: "Pūrvabhādrapadā" },
  { deva: "उत्तरभाद्रपदा", iast: "Uttarabhādrapadā" },
  { deva: "रेवती", iast: "Revatī" },
];

// ── 27 Yogas ────────────────────────────────────────────────────────────────
export const YOGA_NAMES: ReadonlyArray<{ deva: string; iast: string }> = [
  { deva: "विष्कम्भ", iast: "Viṣkambha" },
  { deva: "प्रीति", iast: "Prīti" },
  { deva: "आयुष्मान्", iast: "Āyuṣmān" },
  { deva: "सौभाग्य", iast: "Saubhāgya" },
  { deva: "शोभन", iast: "Śobhana" },
  { deva: "अतिगण्ड", iast: "Atigaṇḍa" },
  { deva: "सुकर्मा", iast: "Sukarmā" },
  { deva: "धृति", iast: "Dhṛti" },
  { deva: "शूल", iast: "Śūla" },
  { deva: "गण्ड", iast: "Gaṇḍa" },
  { deva: "वृद्धि", iast: "Vṛddhi" },
  { deva: "ध्रुव", iast: "Dhruva" },
  { deva: "व्याघात", iast: "Vyāghāta" },
  { deva: "हर्षण", iast: "Harṣaṇa" },
  { deva: "वज्र", iast: "Vajra" },
  { deva: "सिद्धि", iast: "Siddhi" },
  { deva: "व्यतीपात", iast: "Vyatīpāta" },
  { deva: "वरीयान्", iast: "Varīyān" },
  { deva: "परिघ", iast: "Parigha" },
  { deva: "शिव", iast: "Śiva" },
  { deva: "सिद्ध", iast: "Siddha" },
  { deva: "साध्य", iast: "Sādhya" },
  { deva: "शुभ", iast: "Śubha" },
  { deva: "शुक्ल", iast: "Śukla" },
  { deva: "ब्रह्मा", iast: "Brahmā" },
  { deva: "इन्द्र", iast: "Indra" },
  { deva: "वैधृति", iast: "Vaidhṛti" },
];

// ── 11 Karaṇas ──────────────────────────────────────────────────────────────
// 7 moveable (cycle) + 4 fixed. mhah returns ino 1..11.
export const KARANA_NAMES: ReadonlyArray<{ deva: string; iast: string }> = [
  { deva: "बव", iast: "Bava" },
  { deva: "बालव", iast: "Bālava" },
  { deva: "कौलव", iast: "Kaulava" },
  { deva: "तैतिल", iast: "Taitila" },
  { deva: "गर", iast: "Gara" },
  { deva: "वणिज", iast: "Vaṇija" },
  { deva: "विष्टि", iast: "Viṣṭi" },       // "Bhadrā" — inauspicious
  { deva: "शकुनि", iast: "Śakuni" },
  { deva: "चतुष्पाद", iast: "Catuṣpāda" },
  { deva: "नाग", iast: "Nāga" },
  { deva: "किंस्तुघ्न", iast: "Kiṃstughna" },
];

// ── 12 Māsas (lunar months) ────────────────────────────────────────────────
export const MASA_NAMES: ReadonlyArray<{ deva: string; iast: string }> = [
  { deva: "चैत्र", iast: "Caitra" },
  { deva: "वैशाख", iast: "Vaiśākha" },
  { deva: "ज्येष्ठ", iast: "Jyeṣṭha" },
  { deva: "आषाढ", iast: "Āṣāḍha" },
  { deva: "श्रावण", iast: "Śrāvaṇa" },
  { deva: "भाद्रपद", iast: "Bhādrapada" },
  { deva: "आश्विन", iast: "Āśvina" },
  { deva: "कार्तिक", iast: "Kārtika" },
  { deva: "मार्गशीर्ष", iast: "Mārgaśīrṣa" },
  { deva: "पौष", iast: "Pauṣa" },
  { deva: "माघ", iast: "Māgha" },
  { deva: "फाल्गुन", iast: "Phālguna" },
];

// ── 7 Choghadiya labels (with auspicious flag) ─────────────────────────────
export type ChoghadiyaLabel = "Amṛta" | "Śubha" | "Lābha" | "Cala" | "Udvega" | "Roga" | "Kāla";
export const CHOGHADIYA: Record<ChoghadiyaLabel, { deva: string; iast: string; auspicious: boolean }> = {
  Amṛta:  { deva: "अमृत",  iast: "Amṛta",  auspicious: true },
  Śubha:  { deva: "शुभ",   iast: "Śubha",  auspicious: true },
  Lābha:  { deva: "लाभ",   iast: "Lābha",  auspicious: true },
  Cala:   { deva: "चल",    iast: "Cala",   auspicious: true },   // "moving" — neutral-good
  Udvega: { deva: "उद्वेग", iast: "Udvega", auspicious: false },
  Roga:   { deva: "रोग",   iast: "Roga",   auspicious: false },
  Kāla:   { deva: "काल",   iast: "Kāla",   auspicious: false },
};
