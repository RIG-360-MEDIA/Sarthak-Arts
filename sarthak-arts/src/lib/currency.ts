import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { convertMinor, formatMoney } from "@/lib/money";

export function formatDisplay(baseMinor: number, code: string, ratePerBase: number): string {
  return formatMoney(convertMinor(baseMinor, ratePerBase), code);
}

const CURRENCY_COOKIE = "currency";

export type DisplayCurrency = { code: string; ratePerBase: number };

export async function resolveDisplayCurrency(): Promise<DisplayCurrency> {
  const chosen = (await cookies()).get(CURRENCY_COOKIE)?.value;
  const currencies = await prisma.currency.findMany({ where: { active: true } });
  const match =
    currencies.find((c) => c.code === chosen) ??
    currencies.find((c) => c.isDefault) ??
    currencies[0];
  return { code: match?.code ?? "INR", ratePerBase: Number(match?.ratePerBase ?? 1) };
}

export async function activeCurrencies() {
  return prisma.currency.findMany({ where: { active: true }, orderBy: { isDefault: "desc" } });
}
