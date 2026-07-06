import { prisma } from "@/lib/db";

export type ZoneConfig = {
  rate: { amountMinor: number; freeAboveMinor: number | null };
  taxRatePercent: number;
};

export function computeTotals(subtotalMinor: number, zone: ZoneConfig) {
  const shippingMinor =
    zone.rate.freeAboveMinor !== null && subtotalMinor >= zone.rate.freeAboveMinor ? 0 : zone.rate.amountMinor;
  const taxMinor = Math.round((subtotalMinor * zone.taxRatePercent) / 100);
  return { subtotalMinor, shippingMinor, taxMinor, totalMinor: subtotalMinor + shippingMinor + taxMinor };
}

export async function zoneConfigForCountry(countryCode: string): Promise<ZoneConfig & { zoneCode: string }> {
  const zones = await prisma.shippingZone.findMany({ include: { rates: true } });
  const zone =
    zones.find((z) => z.countries.includes(countryCode)) ?? zones.find((z) => z.countries.includes("*"));
  if (!zone || zone.rates.length === 0) throw new Error(`No shipping zone configured for ${countryCode}`);
  const tax =
    (await prisma.taxRule.findFirst({ where: { region: zone.code } })) ??
    (await prisma.taxRule.findFirst({ where: { region: "*" } }));
  return {
    zoneCode: zone.code,
    rate: { amountMinor: zone.rates[0].amountMinor, freeAboveMinor: zone.rates[0].freeAboveMinor },
    taxRatePercent: Number(tax?.ratePercent ?? 0),
  };
}
