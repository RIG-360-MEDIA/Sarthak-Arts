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

export type City = {
  code: CityCode;
  name: string;
  state: string;
  lat: number;
  lon: number;
};

export const CITIES: ReadonlyArray<City> = [
  { code: "delhi",              name: "New Delhi",           state: "Delhi",             lat: 28.6139, lon: 77.2090 },
  { code: "mumbai",             name: "Mumbai",              state: "Maharashtra",       lat: 19.0760, lon: 72.8777 },
  { code: "kolkata",            name: "Kolkata",             state: "West Bengal",       lat: 22.5726, lon: 88.3639 },
  { code: "chennai",            name: "Chennai",             state: "Tamil Nadu",        lat: 13.0827, lon: 80.2707 },
  { code: "bengaluru",          name: "Bengaluru",           state: "Karnataka",         lat: 12.9716, lon: 77.5946 },
  { code: "hyderabad",          name: "Hyderabad",           state: "Telangana",         lat: 17.3850, lon: 78.4867 },
  { code: "ahmedabad",          name: "Ahmedabad",           state: "Gujarat",           lat: 23.0225, lon: 72.5714 },
  { code: "pune",               name: "Pune",                state: "Maharashtra",       lat: 18.5204, lon: 73.8567 },
  { code: "jaipur",             name: "Jaipur",              state: "Rajasthan",         lat: 26.9124, lon: 75.7873 },
  { code: "lucknow",            name: "Lucknow",             state: "Uttar Pradesh",     lat: 26.8467, lon: 80.9462 },
  { code: "varanasi",           name: "Varanasi",            state: "Uttar Pradesh",     lat: 25.3176, lon: 82.9739 },
  { code: "amritsar",           name: "Amritsar",            state: "Punjab",            lat: 31.6340, lon: 74.8723 },
  { code: "bhubaneswar",        name: "Bhubaneswar",         state: "Odisha",            lat: 20.2961, lon: 85.8245 },
  { code: "guwahati",           name: "Guwahati",            state: "Assam",             lat: 26.1445, lon: 91.7362 },
  { code: "thiruvananthapuram", name: "Thiruvananthapuram",  state: "Kerala",            lat: 8.5241,  lon: 76.9366 },
];

export const DEFAULT_CITY: CityCode = "delhi";
export const IST_OFFSET_MINUTES = 330; // +05:30

export function getCity(code: CityCode | string | undefined): City {
  return CITIES.find((c) => c.code === code) ?? CITIES.find((c) => c.code === DEFAULT_CITY)!;
}
