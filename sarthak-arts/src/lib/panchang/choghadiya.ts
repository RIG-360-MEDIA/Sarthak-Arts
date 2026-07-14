import { CHOGHADIYA, type ChoghadiyaLabel } from "./names";

/**
 * Day-Choghadiya sequence per weekday (Sunday=0 .. Saturday=6).
 * Each weekday has 8 muhurtas covering sunrise → sunset.
 * The 7 unique labels cycle in a fixed order; only the starting label
 * differs by weekday. The 8th slot repeats the 1st.
 *
 * Reference: Muhūrta Chintāmaṇi (17th century) and traditional Pañcāṅga usage.
 */
const DAY_START: readonly ChoghadiyaLabel[] = ["Udvega", "Amṛta", "Roga", "Lābha", "Śubha", "Cala", "Kāla"];
// Cycle order: after Udvega → Cala → Lābha → Amṛta → Kāla → Śubha → Roga → Udvega
const CYCLE_ORDER: readonly ChoghadiyaLabel[] = ["Udvega", "Cala", "Lābha", "Amṛta", "Kāla", "Śubha", "Roga"];

// Night-Choghadiya (sunset → next sunrise) starts 4 positions offset from day.
const NIGHT_START: readonly ChoghadiyaLabel[] = ["Śubha", "Cala", "Kāla", "Udvega", "Amṛta", "Roga", "Lābha"];

/** Rāhu Kāla — day is divided into 8; this is the 1-indexed part per weekday. */
const RAHU_KALA_PART: readonly number[] = [8, 2, 7, 5, 6, 4, 3]; // Sun..Sat

function cycleFrom(start: ChoghadiyaLabel, count: number): ChoghadiyaLabel[] {
  const startIdx = CYCLE_ORDER.indexOf(start);
  return Array.from({ length: count }, (_, i) => CYCLE_ORDER[(startIdx + i) % CYCLE_ORDER.length]);
}

export type ChoghadiyaWindow = {
  label: ChoghadiyaLabel;
  deva: string;
  iast: string;
  auspicious: boolean;
  start: Date;
  end: Date;
};

/**
 * Compute the 8 day-Choghadiya windows from sunrise to sunset.
 * weekday: 0 = Sunday .. 6 = Saturday (JS `Date.getDay()` convention).
 */
export function dayChoghadiya(sunrise: Date, sunset: Date, weekday: number): ChoghadiyaWindow[] {
  const stepMs = (sunset.getTime() - sunrise.getTime()) / 8;
  const labels = cycleFrom(DAY_START[weekday], 8);
  return labels.map((label, i) => ({
    label,
    deva: CHOGHADIYA[label].deva,
    iast: CHOGHADIYA[label].iast,
    auspicious: CHOGHADIYA[label].auspicious,
    start: new Date(sunrise.getTime() + i * stepMs),
    end: new Date(sunrise.getTime() + (i + 1) * stepMs),
  }));
}

/** Night-Choghadiya: sunset → next-day sunrise, 8 windows. */
export function nightChoghadiya(sunset: Date, nextSunrise: Date, weekday: number): ChoghadiyaWindow[] {
  const stepMs = (nextSunrise.getTime() - sunset.getTime()) / 8;
  const labels = cycleFrom(NIGHT_START[weekday], 8);
  return labels.map((label, i) => ({
    label,
    deva: CHOGHADIYA[label].deva,
    iast: CHOGHADIYA[label].iast,
    auspicious: CHOGHADIYA[label].auspicious,
    start: new Date(sunset.getTime() + i * stepMs),
    end: new Date(sunset.getTime() + (i + 1) * stepMs),
  }));
}

/** Rāhu Kāla for the day — one ~90 min window, weekday-dependent. */
export function rahuKala(sunrise: Date, sunset: Date, weekday: number): { start: Date; end: Date } {
  const stepMs = (sunset.getTime() - sunrise.getTime()) / 8;
  const part = RAHU_KALA_PART[weekday]; // 1-indexed
  return {
    start: new Date(sunrise.getTime() + (part - 1) * stepMs),
    end: new Date(sunrise.getTime() + part * stepMs),
  };
}

/** Find which day-Choghadiya window contains a given moment (or null if outside daytime). */
export function activeChoghadiya(windows: ChoghadiyaWindow[], at: Date): ChoghadiyaWindow | null {
  const t = at.getTime();
  return windows.find((w) => t >= w.start.getTime() && t < w.end.getTime()) ?? null;
}
