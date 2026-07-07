import { describe, it, expect } from "vitest";
import { formatDisplay } from "@/lib/currency";

describe("formatDisplay", () => {
  it("shows the base price unchanged for INR at rate 1", () => {
    expect(formatDisplay(1840000, "INR", 1)).toBe("₹18,400");
  });
  it("converts and formats into USD at a rate", () => {
    // 1,840,000 paise = ₹18,400; × 0.012 = $220.80
    expect(formatDisplay(1840000, "USD", 0.012)).toBe("$220.80");
  });
});
