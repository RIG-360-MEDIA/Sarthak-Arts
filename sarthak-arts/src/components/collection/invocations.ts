/**
 * Direction invocations — the devotional config that drives every
 * direction-specific experience on the Collection page.
 *
 * Every field is content, not code. Adding a direction (or refining an
 * existing one) is an edit HERE — the InvocationScene, InvocationPanel,
 * card lift, and thread-of-light all consume this file. There is no
 * per-direction rendering logic hardcoded downstream: the modularity
 * mandate is respected end-to-end.
 *
 * `filled: true` gates whether the invocation is ready to render. E is
 * live; the other eight are placeholders authored one direction at a time
 * once the pattern is approved.
 *
 * Devotional data must be exact. Wrong is worse than absent — a blank
 * field is honest, a guessed śloka is not. Sources cross-checked against
 * the Aṣṭadikpāla tradition (Bṛhat Saṃhitā, Mānasāra), the standard
 * Vāstu invocation manuals, and each guardian's canonical Purāṇic
 * iconography before being written here.
 */

import type { MandalaZone } from "./VimanaWebGL";

export type SensoryLine = { scent: string; sound: string; touch: string };
export type PlacementCell = { row: 0 | 1 | 2; col: 0 | 1 | 2 };

export interface DirectionInvocation {
  zone: MandalaZone;
  filled: boolean;

  sanskritName: string;         // Roman transliteration, e.g. "Pūrvā"
  sanskritDevanagari: string;   // Devanāgarī, e.g. "पूर्वा"
  deityName: string;            // Roman, e.g. "Indra"
  deityDevanagari: string;      // Devanāgarī, e.g. "इन्द्रः"
  fullMantra: string;           // Full invocation, e.g. "ॐ इन्द्राय नमः"

  governs: string;              // Life domain in one short phrase
  elementLabel: string;         // e.g. "Vāyu · Air"
  oneLine: string;              // Poetic truth of the direction
  materialPurpose: string;      // Why this metal for this direction
  placement: PlacementCell;     // Cell in the 3×3 Vāstu-mandala schematic
  placementLine: string;        // Placement caption for the home
  sensory: SensoryLine;         // Scent · sound · touch — nyāsa
  productId: string;            // Links to REAL_PRODUCTS[id]
}

const EMPTY_INVOCATION: Omit<DirectionInvocation, "zone"> = {
  filled: false,
  sanskritName: "",
  sanskritDevanagari: "",
  deityName: "",
  deityDevanagari: "",
  fullMantra: "",
  governs: "",
  elementLabel: "",
  oneLine: "",
  materialPurpose: "",
  placement: { row: 1, col: 1 },
  placementLine: "",
  sensory: { scent: "", sound: "", touch: "" },
  productId: "",
};

export const INVOCATIONS: Record<MandalaZone, DirectionInvocation> = {
  E: {
    zone: "E",
    filled: true,
    sanskritName: "Pūrvā",
    sanskritDevanagari: "पूर्वा",
    deityName: "Indra",
    deityDevanagari: "इन्द्रः",
    fullMantra: "ॐ इन्द्राय नमः",
    governs: "New beginnings & health",
    elementLabel: "Vāyu · Air",
    oneLine: "The direction that sets the tone for the day.",
    materialPurpose:
      "Brass with gold overlay — the metal that catches dawn-light, chosen for Pūrvā where every day begins.",
    placement: { row: 1, col: 2 },
    placementLine:
      "Placed on your east wall, so the first light of morning enters through it.",
    sensory: {
      scent: "sandalwood at dawn",
      sound: "the conch",
      touch: "cool morning air",
    },
    productId: "om",
  },

  // C is filled so the Brass Ashtadhatu Pyramid card gets the blessed
  // treatment when C is picked — matches the direction-scene breath /
  // gem fade / vignette / orbit that C also enables. The panel copy
  // below is authored briefly; the panel itself is HIDDEN for filled
  // invocations at the CollectionHero level, so this content is not
  // rendered as text on the page (verified in CollectionHero.tsx).
  C: {
    zone: "C",
    filled: true,
    sanskritName: "Brahmasthāna",
    sanskritDevanagari: "ब्रह्मस्थान",
    deityName: "Brahmā",
    deityDevanagari: "ब्रह्मा",
    fullMantra: "ॐ ब्रह्मणे नमः",
    governs: "Balance for every zone",
    elementLabel: "Ākāśa · Space",
    oneLine: "The open core of the home — kept light, kept clear.",
    materialPurpose:
      "Ashtadhatu (eight-metal alloy) — the metal of balance, chosen for the still centre where all directions meet.",
    placement: { row: 1, col: 1 },
    placementLine:
      "Placed at the centre of the home — the open, uncluttered heart of the space.",
    sensory: {
      scent: "camphor",
      sound: "the om chant",
      touch: "the stillness of the centre",
    },
    productId: "pyramid",
  },
  NE: { zone: "NE", ...EMPTY_INVOCATION },
  N:  { zone: "N",  ...EMPTY_INVOCATION },
  NW: { zone: "NW", ...EMPTY_INVOCATION },
  W:  { zone: "W",  ...EMPTY_INVOCATION },
  SE: { zone: "SE", ...EMPTY_INVOCATION },
  S:  { zone: "S",  ...EMPTY_INVOCATION },
  SW: { zone: "SW", ...EMPTY_INVOCATION },
};
