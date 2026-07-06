import { describe, it, expect } from "vitest";
import { cartSubtotalMinor } from "@/lib/cart";

describe("cartSubtotalMinor", () => {
  it("sums unit price times quantity", () => {
    expect(cartSubtotalMinor([
      { unitPriceMinor: 1840000, quantity: 1 },
      { unitPriceMinor: 980000, quantity: 2 },
    ])).toBe(3800000);
  });
  it("is zero for an empty cart", () => {
    expect(cartSubtotalMinor([])).toBe(0);
  });
});
