import { describe, it, expect } from "vitest";
import { computeTotals } from "@/lib/totals";

const zone = { rate: { amountMinor: 15000, freeAboveMinor: 500000 }, taxRatePercent: 3 };

describe("computeTotals", () => {
  it("adds shipping below the free threshold and applies tax", () => {
    const t = computeTotals(300000, zone);
    expect(t).toEqual({ subtotalMinor: 300000, shippingMinor: 15000, taxMinor: 9000, totalMinor: 324000 });
  });
  it("free shipping at/above the threshold", () => {
    const t = computeTotals(500000, zone);
    expect(t.shippingMinor).toBe(0);
  });
  it("rounds tax to whole minor units", () => {
    const t = computeTotals(100001, { rate: { amountMinor: 0, freeAboveMinor: null }, taxRatePercent: 3 });
    expect(t.taxMinor).toBe(3000);
  });
});
