/**
 * A tiny catalogue of Indian cities the panchang can be computed for.
 * Lat/lon precise enough for sunrise-time accuracy (sub-arcminute).
 * Timezone is always Asia/Kolkata (IST) — India has one time zone.
 *
 * This list is intentionally small — it's the seed for the switcher UI.
 * Add more as needed; a full 500-city index isn't required for a v1.
 */
export type CityCode =
  | "delhi" | "mumbai" | "kolkata" | "chennai" | "bengaluru"
  | "hyderabad" | "ahmedabad" | "pune" | "jaipur" | "lucknow"
  | "varanasi" | "amritsar" | "bhubaneswar" | "guwahati" | "thiruvananthapuram";

import type { MasaSystem } from "./names";

/**
 * Native primary calendar for a region — what a local family actually reads.
 * For solar-calendar regions we still show a lunar Panchang (which is
 * universally valid — tithi/nakshatra/etc. don't change with region), but
 * we honestly flag that the region's *primary* calendar is solar and not
 * yet built. See feedback_devotional_data_accuracy: wrong is worse than absent.
 */
export type NativeCalendar =
  | "lunar-purnimanta"
  | "lunar-amanta"
  | "solar-tamil"
  | "solar-bengali"
  | "solar-malayalam"
  | "solar-assamese";

export type City = {
  code: CityCode;
  name: string;
  state: string;
  lat: number;
  lon: number;
  /** Default lunar-month reckoning for a visitor from this region. */
  defaultMasaSystem: MasaSystem;
  /** The region's primary traditional calendar (may differ from what we show). */
  nativeCalendar: NativeCalendar;
};

/**
 * Regional attribution sources:
 *  - Purnimanta belt: Bihar, HP, Haryana, J&K, Jharkhand, MP, Odisha, Punjab,
 *    Rajasthan, UP, Uttarakhand, Chhattisgarh (Drik Panchang FAQ, verified 2026-07)
 *  - Amanta belt: AP, Karnataka, Maharashtra, Gujarat, Goa, Telangana
 *  - Solar-primary: Tamil Nadu, Kerala, West Bengal, Assam (Wikipedia,
 *    verified 2026-07). We show these visitors a lunar Amanta Panchang
 *    with an honest "solar calendar for your region is on the roadmap" note.
 */
export const CITIES: ReadonlyArray<City> = [
  { code: "delhi",              name: "New Delhi",           state: "Delhi",             lat: 28.6139, lon: 77.2090, defaultMasaSystem: "purnimanta", nativeCalendar: "lunar-purnimanta" },
  { code: "mumbai",             name: "Mumbai",              state: "Maharashtra",       lat: 19.0760, lon: 72.8777, defaultMasaSystem: "amanta",     nativeCalendar: "lunar-amanta" },
  { code: "kolkata",            name: "Kolkata",             state: "West Bengal",       lat: 22.5726, lon: 88.3639, defaultMasaSystem: "amanta",     nativeCalendar: "solar-bengali" },
  { code: "chennai",            name: "Chennai",             state: "Tamil Nadu",        lat: 13.0827, lon: 80.2707, defaultMasaSystem: "amanta",     nativeCalendar: "solar-tamil" },
  { code: "bengaluru",          name: "Bengaluru",           state: "Karnataka",         lat: 12.9716, lon: 77.5946, defaultMasaSystem: "amanta",     nativeCalendar: "lunar-amanta" },
  { code: "hyderabad",          name: "Hyderabad",           state: "Telangana",         lat: 17.3850, lon: 78.4867, defaultMasaSystem: "amanta",     nativeCalendar: "lunar-amanta" },
  { code: "ahmedabad",          name: "Ahmedabad",           state: "Gujarat",           lat: 23.0225, lon: 72.5714, defaultMasaSystem: "amanta",     nativeCalendar: "lunar-amanta" },
  { code: "pune",               name: "Pune",                state: "Maharashtra",       lat: 18.5204, lon: 73.8567, defaultMasaSystem: "amanta",     nativeCalendar: "lunar-amanta" },
  { code: "jaipur",             name: "Jaipur",              state: "Rajasthan",         lat: 26.9124, lon: 75.7873, defaultMasaSystem: "purnimanta", nativeCalendar: "lunar-purnimanta" },
  { code: "lucknow",            name: "Lucknow",             state: "Uttar Pradesh",     lat: 26.8467, lon: 80.9462, defaultMasaSystem: "purnimanta", nativeCalendar: "lunar-purnimanta" },
  { code: "varanasi",           name: "Varanasi",            state: "Uttar Pradesh",     lat: 25.3176, lon: 82.9739, defaultMasaSystem: "purnimanta", nativeCalendar: "lunar-purnimanta" },
  { code: "amritsar",           name: "Amritsar",            state: "Punjab",            lat: 31.6340, lon: 74.8723, defaultMasaSystem: "purnimanta", nativeCalendar: "lunar-purnimanta" },
  { code: "bhubaneswar",        name: "Bhubaneswar",         state: "Odisha",            lat: 20.2961, lon: 85.8245, defaultMasaSystem: "purnimanta", nativeCalendar: "lunar-purnimanta" },
  { code: "guwahati",           name: "Guwahati",            state: "Assam",             lat: 26.1445, lon: 91.7362, defaultMasaSystem: "amanta",     nativeCalendar: "solar-assamese" },
  { code: "thiruvananthapuram", name: "Thiruvananthapuram",  state: "Kerala",            lat: 8.5241,  lon: 76.9366, defaultMasaSystem: "amanta",     nativeCalendar: "solar-malayalam" },
];

export const DEFAULT_CITY: CityCode = "delhi";
export const IST_OFFSET_MINUTES = 330; // +05:30

/** Solar-native regions where we show lunar Panchang with an honest note. */
export function isSolarNativeRegion(city: City): boolean {
  return city.nativeCalendar.startsWith("solar-");
}

/** Short label for the region's native calendar, for the roadmap note. */
export function nativeCalendarLabel(nc: NativeCalendar): string {
  switch (nc) {
    case "lunar-purnimanta": return "Pūrṇimānta lunar";
    case "lunar-amanta":     return "Amānta lunar";
    case "solar-tamil":      return "Tamil solar";
    case "solar-bengali":    return "Bengali solar";
    case "solar-malayalam":  return "Malayalam solar";
    case "solar-assamese":   return "Assamese solar";
  }
}

export function getCity(code: CityCode | string | undefined): City {
  return CITIES.find((c) => c.code === code) ?? CITIES.find((c) => c.code === DEFAULT_CITY)!;
}
