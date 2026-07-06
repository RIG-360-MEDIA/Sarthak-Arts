const LOCALES: Record<string, string> = { INR: "en-IN", USD: "en-US", GBP: "en-GB", AED: "en-AE" };

export function formatMoney(minor: number, currency: string): string {
  const major = minor / 100;
  const isWhole = Number.isInteger(major);
  return new Intl.NumberFormat(LOCALES[currency] ?? "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(major);
}

export function convertMinor(baseMinor: number, ratePerBase: number): number {
  return Math.round(baseMinor * ratePerBase);
}
