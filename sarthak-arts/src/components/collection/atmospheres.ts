/**
 * Direction atmospheres — the environmental transformation the whole
 * scene undergoes when a Vāstu direction is invoked.
 *
 * This is NOT a colour filter. Each entry is a multi-parameter recipe —
 * sky, fog, particle character, star density — designed together so the
 * scene FEELS like that direction's real hour, weather, and mood.
 *
 * Every atmosphere is grounded in Vāstu/Sanātana correspondence:
 *   • the time of day the direction rules
 *   • the element (Mahābhūta) that lives there
 *   • the guardian's felt presence (calm, radiant, austere …)
 *
 * Only E (Pūrvā / Indra / dawn) is authored right now — this file is the
 * seat for the other eight as we build them out one at a time.
 */

import type { MandalaZone } from "./VimanaWebGL";

export interface DirectionAtmosphere {
  /** CSS radial-gradient string for the page-behind sky div. Same shape
   *  across all atmospheres so a stacked-div crossfade transitions cleanly. */
  skyGradient: string;

  /** WebGL scene fog — colour + range. Lerped over ~1.5s on activation. */
  fogColor: [number, number, number];
  fogNear: number;
  fogFar: number;

  /** Starfield alpha (0..1). 1.0 = night, 0.3 = dawn stars fading. */
  starOpacity: number;
}

/** Neutral / "All directions" — the void state the scene rests in. */
export const NEUTRAL_ATMOSPHERE: DirectionAtmosphere = {
  skyGradient:
    "radial-gradient(140% 100% at 50% 42%, #2A1550 0%, #180C36 22%, #0C0622 55%, #05020F 100%)",
  fogColor: [0.07, 0.03, 0.20],
  fogNear: 8,
  fogFar: 18,
  starOpacity: 1.0,
};

export const ATMOSPHERES: Partial<Record<MandalaZone, DirectionAtmosphere>> = {
  // ---------------------------------------------------------------------
  // E · Pūrvā · Indra · Brahma-muhūrta
  // Atmosphere is a WHISPER — the sky stays mostly the neutral void, with
  // only a small, deep-warm patch confined to the low-east corner. The
  // background must NEVER compete with the product cards; it exists to
  // subtly hint at the direction's hour and character while the eye is
  // pulled to the invoked piece.
  // ---------------------------------------------------------------------
  E: {
    skyGradient:
      "radial-gradient(50% 40% at 100% 85%, #7A3E30 0%, #4A2438 22%, #251340 55%, #0F0620 85%, #05020F 100%)",
    fogColor: [0.10, 0.06, 0.20],
    fogNear: 9,
    fogFar: 19,
    starOpacity: 0.88,
  },
};

export function atmosphereFor(zone: MandalaZone | null): DirectionAtmosphere {
  if (!zone) return NEUTRAL_ATMOSPHERE;
  return ATMOSPHERES[zone] ?? NEUTRAL_ATMOSPHERE;
}
