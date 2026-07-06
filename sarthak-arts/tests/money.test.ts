import { describe, it, expect } from "vitest";
import { formatMoney, convertMinor } from "@/lib/money";

describe("formatMoney", () => {
  it("formats INR minor units without decimals when whole", () => {
    expect(formatMoney(1840000, "INR")).toBe("₹18,400");
  });
  it("formats USD minor units with decimals", () => {
    expect(formatMoney(19999, "USD")).toBe("$199.99");
  });
});

describe("convertMinor", () => {
  it("converts base minor units by rate, rounding to whole minor units", () => {
    expect(convertMinor(1840000, 0.012)).toBe(22080);
  });
});
