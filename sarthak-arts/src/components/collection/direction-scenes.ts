/**
 * Direction scenes — the per-direction visual VOCABULARY that drives the
 * Collection page's environmental response to a picked direction.
 *
 * This file exists to break out of the loop where every "new" invocation
 * effect ended up being another gold-line-on-gold-lines variation. Each
 * direction here composes several DIFFERENT tool categories (breath,
 * weather, camera behaviour, geometry subtraction, panchang) so the
 * scene FEELS distinct per direction, not tinted.
 *
 * Only E · Pūrvā and C · Brahmasthāna are `filled: true` in the first
 * build — they're two opposites (awakening vs. still centre) that
 * exercise the framework. The other 7 sit as placeholders and their
 * signature vocabularies land in follow-up sessions once the framework
 * is validated on E and C.
 */

import type { MandalaZone } from "./VimanaWebGL";

export type WeatherType =
  | "none"
  | "dawn-streaks"     // E — thin warm-gold streaks drifting E→W
  | "cold-drops"       // NE — Ganga droplets descending (future)
  | "gold-drift"       // N — gold specks falling (future)
  | "wind-streams"     // NW — curved horizontal drift (future)
  | "water-ripples"    // W — concentric ripples (future)
  | "embers"           // SE — rising warm particles (future)
  | "settling-dust";   // SW — dense still-hanging particles (future)

export interface CameraOrbit {
  radius: number;      // world units around origin
  degPerSec: number;   // orbital speed
}

export interface PanchangBoosts {
  /** Additive bump to breath amplitude when panchang condition matches. */
  breathAmplitudeBump: number;
  /** Additive bump to weather intensity when panchang condition matches. */
  weatherIntensityBump: number;
}

export interface DirectionScene {
  zone: MandalaZone;
  filled: boolean;

  // -- Motion / rhythm ---------------------------------------------------
  /** Base amplitude of the cosmic breath (scale variation). 0 = no breath. */
  breathAmplitude: number;
  /** Full breath cycle length in seconds. */
  breathPeriodSec: number;
  /** Hold at each extremum (a pause at peak and trough). 0 = pure sine. */
  breathShapePause: number;
  /** Multiplier on the base rotation speeds of rings, particles, starfield. */
  sceneTempo: number;

  // -- Weather layer -----------------------------------------------------
  weatherType: WeatherType;
  weatherIntensity: number;

  // -- Camera behaviour --------------------------------------------------
  cameraOrbit: CameraOrbit | null;

  // -- Geometry subtraction ----------------------------------------------
  /** Target opacity for the 8 outer direction jewels (1 = full, 0.28 = quiet). */
  fadeOuterGemsTo: number;

  // -- Screen-space effect -----------------------------------------------
  /** Darkness for the screen vignette. null = leave at base. */
  vignetteDarkness: number | null;

  // -- Panchang acknowledgment -------------------------------------------
  /** e.g. "Wednesday" — matches PanchangOk.weekday when true. */
  panchangDay: string | null;
  panchangDayBoosts: PanchangBoosts;
  /** Cosmic hour — evaluated against the panchang service. */
  panchangHour: "sunrise" | "sunset" | "brahma-muhurta" | null;
  panchangHourBoosts: PanchangBoosts;
}

/** Neutral scene — "All directions" state. Everything at rest. */
export const NEUTRAL_SCENE: DirectionScene = {
  zone: "C", // arbitrary — the neutral scene isn't zone-specific
  filled: true,
  breathAmplitude: 0,
  breathPeriodSec: 8,
  breathShapePause: 0,
  sceneTempo: 1,
  weatherType: "none",
  weatherIntensity: 0,
  cameraOrbit: null,
  fadeOuterGemsTo: 1,
  vignetteDarkness: null,
  panchangDay: null,
  panchangDayBoosts: { breathAmplitudeBump: 0, weatherIntensityBump: 0 },
  panchangHour: null,
  panchangHourBoosts: { breathAmplitudeBump: 0, weatherIntensityBump: 0 },
};

// -------------------------------------------------------------------------
// E · Pūrvā · Indra · Air / Dawn
// -------------------------------------------------------------------------
// New beginnings, prāṇa (life-breath), the tone of the day. Rules the
// pre-dawn hour through sunrise. Indra's day is Wednesday.
//
// Vocabulary combines: cosmic breath + dawn streaks + a hush of the
// scene's base tempo. Whole scene inhales; horizontal ribbons of dawn
// light drift E→W; existing rotations slow slightly so the ribbons
// have space to breathe.
// -------------------------------------------------------------------------
const PURVA_INDRA: DirectionScene = {
  zone: "E",
  filled: true,
  breathAmplitude: 0.06,      // 6% scale variation — clearly visible
  breathPeriodSec: 8,
  breathShapePause: 0.5,
  sceneTempo: 0.75,           // rings hush a touch to let the ribbons read
  weatherType: "dawn-streaks",
  weatherIntensity: 1.0,
  cameraOrbit: null,
  fadeOuterGemsTo: 1,          // E leaves the mandala's outer jewels alone
  vignetteDarkness: null,
  panchangDay: "Wednesday",    // Indra's day
  panchangDayBoosts: {
    breathAmplitudeBump: 0.02,   // 6% → 8% on Wednesdays
    weatherIntensityBump: 0.15,
  },
  panchangHour: "sunrise",
  panchangHourBoosts: {
    breathAmplitudeBump: 0,
    weatherIntensityBump: 0.30,  // more streaks near actual sunrise
  },
};

// -------------------------------------------------------------------------
// C · Brahmasthāna · Brahmā · Space
// -------------------------------------------------------------------------
// Absolute equilibrium, the still centre, the void that holds all
// directions. The paramātman breath. Not a direction — the source of
// directions.
//
// Vocabulary combines: deepest breath in the whole system + geometry
// subtraction (outer gems recede) + slow orbital camera drift + tighter
// vignette. The 8 directions are present but quiet; only the bindu holds.
// -------------------------------------------------------------------------
const BRAHMASTHANA: DirectionScene = {
  zone: "C",
  filled: true,
  breathAmplitude: 0.10,      // 10% — the deepest breath in the system
  breathPeriodSec: 12,
  breathShapePause: 2,          // 2s hold at each extremum — paramātman pause
  sceneTempo: 0.5,             // scene slows notably — contemplative
  weatherType: "none",
  weatherIntensity: 0,
  cameraOrbit: { radius: 0.35, degPerSec: 2 },
  fadeOuterGemsTo: 0.28,       // outer jewels recede — bindu becomes anchor
  vignetteDarkness: 0.65,      // corners deepen into void
  panchangDay: null,
  panchangDayBoosts: { breathAmplitudeBump: 0, weatherIntensityBump: 0 },
  panchangHour: "brahma-muhurta",
  panchangHourBoosts: {
    breathAmplitudeBump: 0.02,  // 10% → 12% at real Brahma-muhūrta
    weatherIntensityBump: 0,
  },
};

// Placeholder for the 7 other directions — behaves like neutral until each
// gets its authored vocabulary. Keeps the pattern uniform: any zone can be
// looked up, filled or not.
const placeholder = (zone: MandalaZone): DirectionScene => ({
  ...NEUTRAL_SCENE,
  zone,
  filled: false,
});

export const DIRECTION_SCENES: Record<MandalaZone, DirectionScene> = {
  E:  PURVA_INDRA,
  C:  BRAHMASTHANA,
  NE: placeholder("NE"),
  N:  placeholder("N"),
  NW: placeholder("NW"),
  W:  placeholder("W"),
  SE: placeholder("SE"),
  S:  placeholder("S"),
  SW: placeholder("SW"),
};

export function directionSceneFor(zone: MandalaZone | null): DirectionScene {
  if (!zone) return NEUTRAL_SCENE;
  const s = DIRECTION_SCENES[zone];
  return s.filled ? s : NEUTRAL_SCENE;
}
