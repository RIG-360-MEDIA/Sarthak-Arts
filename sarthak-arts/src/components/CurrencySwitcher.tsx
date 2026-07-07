import { activeCurrencies, resolveDisplayCurrency } from "@/lib/currency";
import { setCurrency } from "@/app/(storefront)/actions";
import { CurrencySelect } from "./CurrencySelect";

export async function CurrencySwitcher() {
  const [currencies, current] = await Promise.all([activeCurrencies(), resolveDisplayCurrency()]);
  return (
    <CurrencySelect
      codes={currencies.map((c) => c.code)}
      current={current.code}
      action={setCurrency}
    />
  );
}
