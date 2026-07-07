import { describe, it, expect } from "vitest";
import { nextStatusCode } from "@/lib/orderflow";

const flow = ["confirmed", "packed", "shipped", "delivered"];

describe("nextStatusCode", () => {
  it("returns the next status in the flow", () => {
    expect(nextStatusCode("confirmed", flow)).toBe("packed");
    expect(nextStatusCode("packed", flow)).toBe("shipped");
  });
  it("returns null at the end of the flow", () => {
    expect(nextStatusCode("delivered", flow)).toBeNull();
  });
  it("returns null for a status not in the flow (e.g. cancelled)", () => {
    expect(nextStatusCode("cancelled", flow)).toBeNull();
  });
});
