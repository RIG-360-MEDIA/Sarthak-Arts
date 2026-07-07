import { describe, it, expect } from "vitest";
import { canReturn } from "@/lib/returns";

const now = new Date("2026-07-15T00:00:00Z");
const deliveredRecently = new Date("2026-07-12T00:00:00Z"); // 3 days ago

describe("canReturn", () => {
  it("allows a delivered, non-final-sale item within the window with no prior request", () => {
    expect(canReturn({ statusCode: "delivered", deliveredAt: deliveredRecently, windowDays: 7, now, isFinalSale: false, alreadyRequested: false })).toBe(true);
  });
  it("blocks final-sale items", () => {
    expect(canReturn({ statusCode: "delivered", deliveredAt: deliveredRecently, windowDays: 7, now, isFinalSale: true, alreadyRequested: false })).toBe(false);
  });
  it("blocks when outside the window", () => {
    const old = new Date("2026-07-01T00:00:00Z"); // 14 days ago
    expect(canReturn({ statusCode: "delivered", deliveredAt: old, windowDays: 7, now, isFinalSale: false, alreadyRequested: false })).toBe(false);
  });
  it("blocks when not delivered", () => {
    expect(canReturn({ statusCode: "shipped", deliveredAt: null, windowDays: 7, now, isFinalSale: false, alreadyRequested: false })).toBe(false);
  });
  it("blocks a second request", () => {
    expect(canReturn({ statusCode: "delivered", deliveredAt: deliveredRecently, windowDays: 7, now, isFinalSale: false, alreadyRequested: true })).toBe(false);
  });
});
