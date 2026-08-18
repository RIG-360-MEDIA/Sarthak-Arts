"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CITIES, getCity, type CityCode } from "./cities";
import type { MasaSystem } from "./names";

const CITY_COOKIE = "panchang_city";
const MASA_COOKIE = "panchang_masa_system";
const YEAR = 60 * 60 * 24 * 365;

/**
 * Persist the visitor's panchang preferences and revalidate the pages that
 * read them. Called from the client-side switcher's form action.
 */
export async function savePanchangPreferences(formData: FormData): Promise<void> {
  const cityRaw = String(formData.get("city") ?? "");
  const masaRaw = String(formData.get("masaSystem") ?? "");
  const validCity = CITIES.some((c) => c.code === cityRaw);
  const validMasa = masaRaw === "purnimanta" || masaRaw === "amanta";
  if (!validCity || !validMasa) return;

  const jar = await cookies();
  jar.set(CITY_COOKIE, cityRaw, { sameSite: "lax", maxAge: YEAR, path: "/" });
  jar.set(MASA_COOKIE, masaRaw, { sameSite: "lax", maxAge: YEAR, path: "/" });
  revalidatePath("/");
}

export type ResolvedPrefs = {
  city: ReturnType<typeof getCity>;
  masaSystem: MasaSystem;
  /** True iff the visitor has never set preferences and we're using defaults. */
  isDefault: boolean;
};

/** Read the visitor's stored preferences with city-appropriate defaults. */
export async function readPanchangPreferences(): Promise<ResolvedPrefs> {
  const jar = await cookies();
  const cityCode = jar.get(CITY_COOKIE)?.value;
  const masaRaw = jar.get(MASA_COOKIE)?.value;
  const city = getCity(cityCode);
  const masaSystem: MasaSystem =
    masaRaw === "amanta" || masaRaw === "purnimanta" ? masaRaw : city.defaultMasaSystem;
  return {
    city,
    masaSystem,
    isDefault: !cityCode && !masaRaw,
  };
}
