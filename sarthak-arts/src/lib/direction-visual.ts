/**
 * Direction VISUAL layer — the brand design system for the nine zones.
 *
 * This file owns only *presentation* facts: the colour-coding used across the
 * Collection page, and the IAST (diacritic) romanisation of each direction's
 * Sanskrit name and its guardian Dikpāla.
 *
 * ── On accuracy ────────────────────────────────────────────────────────────
 *   • The verified devotional data (Devanagari guardian names, element,
 *     what each zone governs, microcopy) lives in `lib/direction.ts` and the
 *     Prisma seed. This file does NOT restate or override it.
 *   • The IAST forms and guardian names here are the standard romanisations of
 *     the Aṣṭadikpāla set (per Bṛhat Saṃhitā ch. 53 / Monier-Williams), matching
 *     `DEVA_BY_CODE` in `lib/direction.ts` and the homepage DirectionWheel.
 *   • The COLOURS are a *brand palette*, chosen to echo each zone's element
 *     (water→teal, fire→red/sindoor, wealth→green, etc.). They are a design
 *     decision, NOT a scriptural prescription — traditional Vāstu colour lore
 *     varies by text, so we do not present these as canonical.
 *
 * Everything the Collection page needs about a direction's *look* is here, so a
 * palette change is one edit, never a code hunt. [[feedback-modularity-mandate]]
 */

export type DirectionVisual = {
  /** IAST romanisation of the direction's Sanskrit name (e.g. "Uttara"). */
  iast: string;
  /** Guardian Dikpāla, romanised (e.g. "Kubera"). */
  deity: string;
  /** Guardian Dikpāla in Devanagari (matches DEVA_BY_CODE in lib/direction.ts). */
  deva: string;
  /** Brand accent for this zone (element-inspired). Drives card + compass colour. */
  color: string;
  /** A deeper shade of the accent, for text/borders on light washes. */
  colorDeep: string;
};

export const DIRECTION_VISUAL: Record<string, DirectionVisual> = {
  north:     { iast: "Uttara",       deity: "Kubera",  deva: "कुबेर",    color: "#2E9E5B", colorDeep: "#1E6E3E" },
  northeast: { iast: "Īśānya",       deity: "Īśāna",   deva: "ईशान",     color: "#2BA8C4", colorDeep: "#1B7D95" },
  east:      { iast: "Pūrva",        deity: "Indra",   deva: "इन्द्र",    color: "#F5911E", colorDeep: "#B4670E" },
  southeast: { iast: "Āgneya",       deity: "Agni",    deva: "अग्नि",     color: "#E0492E", colorDeep: "#A8321C" },
  south:     { iast: "Dakṣiṇa",      deity: "Yama",    deva: "यम",       color: "#C0392B", colorDeep: "#8E2820" },
  southwest: { iast: "Nairṛtya",     deity: "Nirṛti",  deva: "निर्ऋति",   color: "#B5762E", colorDeep: "#855119" },
  west:      { iast: "Paścima",      deity: "Varuṇa",  deva: "वरुण",     color: "#3B5BA5", colorDeep: "#29417A" },
  northwest: { iast: "Vāyavya",      deity: "Vāyu",    deva: "वायु",     color: "#1B9E8A", colorDeep: "#127365" },
  center:    { iast: "Brahmasthāna", deity: "Brahmā",  deva: "ब्रह्म",    color: "#E8A81C", colorDeep: "#B47D0C" },
};

/** Safe fallback so an unknown code never crashes the render. */
export const DIRECTION_VISUAL_FALLBACK: DirectionVisual = {
  iast: "", deity: "", deva: "", color: "#B8863E", colorDeep: "#8A6320",
};

export function visualFor(code: string): DirectionVisual {
  return DIRECTION_VISUAL[code] ?? DIRECTION_VISUAL_FALLBACK;
}

/**
 * Screen-space bearing (degrees) for each zone on a North-up compass:
 * East 0°, South 90°, West 180°, North -90°. Center has no bearing.
 * Used to place petals/labels on the rail compass and mandala.
 */
export const DIRECTION_ANGLE: Record<string, number> = {
  east: 0, southeast: 45, south: 90, southwest: 135,
  west: 180, northwest: -135, north: -90, northeast: -45,
};
