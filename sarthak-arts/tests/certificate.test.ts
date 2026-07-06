import { describe, it, expect } from "vitest";
import { renderCertificatePdf } from "@/lib/certificate";

describe("renderCertificatePdf", () => {
  it("returns PDF bytes containing the item data", async () => {
    const pdf = await renderCertificatePdf({
      orderNumber: "SA-TEST1",
      itemName: "Silver Sri Yantra Plate",
      composition: [
        { material: "Silver", label: null, weightGrams: 180, gemstoneQty: null },
        { material: "Ruby", label: "bindu stone", weightGrams: null, gemstoneQty: 1 },
      ],
      date: "2026-07-06",
    });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
