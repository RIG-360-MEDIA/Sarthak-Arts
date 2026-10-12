/**
 * The panchang service — computes today's five-limb almanac + choghadiya + rāhu kāla
 * for a given city, on demand. All astronomical/astrological math is delegated to
 * mhah-panchang (Lahiri ayanamsa) and suncalc (sunrise/sunset).
 *
 * Fail-loud principle: any computation error yields a Panchang with `ok:false` —
 * the display layer must render an honest "temporarily unavailable" state, never
 * a fabricated value.
 */
import { MhahPanchang } from "mhah-panchang";
import * as SunCalc from "suncalc";
import { getCity, type CityCode, type City } from "./cities";
import {
  tithiName,
  amantaToPurnimanta,
  NAKSHATRA_NAMES,
  YOGA_NAMES,
  KARANA_NAMES,
  MASA_NAMES,
  type MasaSystem,
} from "./names";
import { lunarMonthAt, tithiIndexAt } from "./masa";
import {
  dayChoghadiya,
  nightChoghadiya,
  rahuKala,
  activeChoghadiya,
  type ChoghadiyaWindow,
} from "./choghadiya";

export type PanchangCell = { deva: string; iast: string };
export type Paksha = "śukla" | "kṛṣṇa";

export type PanchangOk = {
  ok: true;
  city: City;
  weekday: string;              // e.g. "Tuesday"
  sunrise: Date;
  sunset: Date;
  tithi: PanchangCell & { paksha: Paksha };
  nakshatra: PanchangCell;
  yoga: PanchangCell;
  karana: PanchangCell;
  masa: PanchangCell;           // lunar month (per the chosen masa system)
  masaSystem: MasaSystem;
  /** True when this lunar month is an adhika (leap) month. */
  adhika: boolean;
  choghadiyaDay: ChoghadiyaWindow[];
  choghadiyaNight: ChoghadiyaWindow[];
  choghadiyaNow: ChoghadiyaWindow | null;
  rahuKala: { start: Date; end: Date };
};

export type PanchangFail = { ok: false; error: string; city: City };
export type Panchang = PanchangOk | PanchangFail;

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const mhah = new MhahPanchang();

export type PanchangOptions = {
  /** Lunar month reckoning. Default "purnimanta" (North Indian). */
  masaSystem?: MasaSystem;
  /** Instant the tithi is read at: "sunrise" (default) or local "midday" (used for festival days). */
  basis?: "sunrise" | "midday" | "sunset";
};

/**
 * Compute the panchang for a given moment at a given city.
 * `at` defaults to now. Options control regional convention.
 *
 * Results are memoized in-process with a 60-second bucket key so back-to-back
 * renders in the same minute (nav + strip + hero pill + festival section) reuse
 * a single Swiss-Ephemeris pass. Choghadiya windows change every ~90 min so a
 * 60s bucket is safely stale-free. Bucket key is derived from the caller's `at`
 * argument (not wall-clock) so historical calls (e.g. the festival finder that
 * scans day-by-day) also benefit.
 */
const CACHE = new Map<string, Panchang>();
const CACHE_TTL_MS = 60 * 1000;
const CACHE_MAX = 400; // 15 cities x ~3 minute-buckets x 2 systems worth of headroom

export function computePanchang(
  cityCode: CityCode | string | undefined,
  at: Date = new Date(),
  opts: PanchangOptions = {},
): Panchang {
  const masaSystem: MasaSystem = opts.masaSystem ?? "purnimanta";
  const city = getCity(cityCode);
  const bucket = Math.floor(at.getTime() / CACHE_TTL_MS);
  const basis = opts.basis ?? "sunrise";
  const key = `${city.code}|${masaSystem}|${basis}|${bucket}`;
  const hit = CACHE.get(key);
  if (hit) return hit;
  const result = computePanchangUncached(city, masaSystem, at, basis);
  if (CACHE.size >= CACHE_MAX) CACHE.clear();
  CACHE.set(key, result);
  return result;
}

function computePanchangUncached(
  city: City,
  masaSystem: MasaSystem,
  at: Date,
  basis: "sunrise" | "midday" | "sunset",
): Panchang {
  try {
    // Sunrise/sunset for the calendar day the observer is currently living in.
    // For accuracy convention: tithi/nakshatra/yoga/karana are the values at
    // *sunrise of the day the moment falls in*.
    const suncalcSunrise = SunCalc.getTimes(at, city.lat, city.lon).sunrise;
    const suncalcSunset = SunCalc.getTimes(at, city.lat, city.lon).sunset;
    if (!suncalcSunrise || !suncalcSunset || Number.isNaN(suncalcSunrise.getTime()) || Number.isNaN(suncalcSunset.getTime())) {
      return { ok: false, error: "sunrise/sunset unavailable", city };
    }

    // Panchang values at sunrise (classical convention: tithi/nakshatra/yoga/
    // karana of the day are those prevailing at sunrise).
    // All mhah inos are 0-indexed. Masa needs remapping (Amanta year convention).
    const readAt = basis === "midday"
      ? new Date((suncalcSunrise.getTime() + suncalcSunset.getTime()) / 2)
      : basis === "sunset"
        ? new Date(suncalcSunset.getTime() + 20 * 60 * 1000) // pradoṣa, just after sunset
        : suncalcSunrise;
    const c = mhah.calendar(readAt, city.lat, city.lon);
    // mhah reads one tithi per calendar day (at sunrise); for a specific instant, derive it from the Sun–Moon angle.
    const tithi = tithiName(basis === "sunrise" ? c.Tithi.ino : tithiIndexAt(readAt));
    const nakshatraIdx = c.Nakshatra.ino % 27;
    const yogaIdx = c.Yoga.ino % 27;
    const karanaIdx = c.Karna.ino % 11;
    const month = lunarMonthAt(readAt);
    const masaIdx = masaSystem === "purnimanta"
      ? amantaToPurnimanta(month.amantaIdx, tithi.paksha)
      : month.amantaIdx;

    // Next-day sunrise for night-choghadiya.
    const tomorrow = new Date(at.getTime() + 24 * 60 * 60 * 1000);
    const nextSunrise = SunCalc.getTimes(tomorrow, city.lat, city.lon).sunrise;
    if (!nextSunrise || Number.isNaN(nextSunrise.getTime())) {
      return { ok: false, error: "next sunrise unavailable", city };
    }

    const weekday = suncalcSunrise.getDay();
    const day = dayChoghadiya(suncalcSunrise, suncalcSunset, weekday);
    const night = nightChoghadiya(suncalcSunset, nextSunrise, weekday);
    // "Now" window: check day first, fall back to night.
    const nowDay = activeChoghadiya(day, at);
    const nowNight = nowDay ? null : activeChoghadiya(night, at);

    return {
      ok: true,
      city,
      weekday: WEEKDAY_NAMES[weekday],
      sunrise: suncalcSunrise,
      sunset: suncalcSunset,
      tithi: { ...tithi },
      nakshatra: NAKSHATRA_NAMES[nakshatraIdx],
      yoga: YOGA_NAMES[yogaIdx],
      karana: KARANA_NAMES[karanaIdx],
      masa: MASA_NAMES[masaIdx],
      masaSystem,
      adhika: month.adhika,
      choghadiyaDay: day,
      choghadiyaNight: night,
      choghadiyaNow: nowDay ?? nowNight,
      rahuKala: rahuKala(suncalcSunrise, suncalcSunset, weekday),
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message ?? "unknown", city };
  }
}

/** Format a Date as HH:MM AM/PM in IST for display. */
export function fmtIST(d: Date): string {
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

/** Format a Date as "Mon 14 Jul" in IST. */
export function fmtISTDate(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}

export type { City, CityCode } from "./cities";
export { CITIES } from "./cities";
