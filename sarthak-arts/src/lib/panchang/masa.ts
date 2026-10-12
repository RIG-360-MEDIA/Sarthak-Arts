/**
 * Lunar month (masa) the traditional way: an amānta month is named from the
 * sidereal sign the Sun occupies at the new moon that opens it (Sun in Mesha
 * -> Vaiśākha, ... i.e. sign + 1). A month whose new moon and closing new moon
 * fall in the same sign contains no saṅkrānti and is adhika (leap).
 *
 * Low-precision solar/lunar series (Meeus, abridged) — good to roughly 0.1° of
 * the Sun and 0.3° of the Moon, which places a new moon within about an hour.
 * Only saṅkrānti-within-an-hour-of-new-moon cases can mislabel, and those are
 * exactly the days panchangs themselves flag as disputed.
 */
const RAD = Math.PI / 180;
const norm = (x: number) => ((x % 360) + 360) % 360;
const wrap180 = (x: number) => ((x + 540) % 360) - 180;
const DAY_MS = 86_400_000;

const jdOf = (d: Date) => d.getTime() / DAY_MS + 2440587.5;
const tOf = (d: Date) => (jdOf(d) - 2451545) / 36525;

/** Tropical solar longitude, degrees. */
function sunTropical(d: Date): number {
  const t = tOf(d);
  const l0 = 280.46646 + 36000.76983 * t;
  const m = (357.52911 + 35999.05029 * t) * RAD;
  const c = (1.914602 - 0.004817 * t) * Math.sin(m) + 0.019993 * Math.sin(2 * m) + 0.000289 * Math.sin(3 * m);
  return norm(l0 + c);
}

/** Lahiri ayanāṃśa, degrees (23°51′ at J2000, precessing ~50.29″/yr). */
const lahiri = (d: Date) => 23.853 + 1.3969 * tOf(d);

/** Sidereal solar longitude, degrees. */
export const sunSidereal = (d: Date) => norm(sunTropical(d) - lahiri(d));

/** Tropical lunar longitude, degrees. */
function moonTropical(d: Date): number {
  const t = tOf(d);
  const lp = 218.3164477 + 481267.88123421 * t;
  const dd = (297.8501921 + 445267.1114034 * t) * RAD;
  const m = (357.5291092 + 35999.0502909 * t) * RAD;
  const mp = (134.9633964 + 477198.8675055 * t) * RAD;
  const f = (93.272095 + 483202.0175233 * t) * RAD;
  return norm(
    lp +
      6.288774 * Math.sin(mp) + 1.274027 * Math.sin(2 * dd - mp) + 0.658314 * Math.sin(2 * dd) +
      0.213618 * Math.sin(2 * mp) - 0.185116 * Math.sin(m) - 0.114332 * Math.sin(2 * f) +
      0.058793 * Math.sin(2 * dd - 2 * mp) + 0.057066 * Math.sin(2 * dd - m - mp) +
      0.053322 * Math.sin(2 * dd + mp) + 0.045758 * Math.sin(2 * dd - m) - 0.040923 * Math.sin(m - mp) -
      0.034720 * Math.sin(dd) - 0.030383 * Math.sin(m + mp),
  );
}

const elongation = (d: Date) => wrap180(moonTropical(d) - sunTropical(d));

/** The new moon (elongation 0°) nearest to `guess`. */
function newMoonNear(guess: Date): Date {
  let ms = guess.getTime();
  for (let i = 0; i < 8; i++) ms -= (elongation(new Date(ms)) / 12.19) * DAY_MS;
  return new Date(ms);
}

/** The most recent new moon at or before `d`. */
function previousNewMoon(d: Date): Date {
  let n = newMoonNear(d);
  if (n.getTime() > d.getTime()) n = newMoonNear(new Date(n.getTime() - 29.53 * DAY_MS));
  return n;
}

/** Tithi index 0–29 (0 = Śukla Pratipadā … 29 = Amāvāsyā) at an exact instant: 12° of Moon–Sun elongation each. */
export function tithiIndexAt(d: Date): number {
  return Math.floor(norm(moonTropical(d) - sunTropical(d)) / 12);
}

export type LunarMonth = { amantaIdx: number; adhika: boolean };

/** Amānta month index (0 = Caitra … 11 = Phālguna) containing instant `d`, and whether it is a leap month. */
export function lunarMonthAt(d: Date): LunarMonth {
  const start = previousNewMoon(d);
  const end = newMoonNear(new Date(start.getTime() + 29.53 * DAY_MS));
  const startSign = Math.floor(sunSidereal(start) / 30);
  const endSign = Math.floor(sunSidereal(end) / 30);
  return { amantaIdx: (startSign + 1) % 12, adhika: startSign === endSign };
}
