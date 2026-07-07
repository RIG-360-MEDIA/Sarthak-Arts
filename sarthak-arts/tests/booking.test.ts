import { describe, it, expect } from "vitest";
import { freeSlots } from "@/lib/booking";

const s = (iso: string) => new Date(iso);

describe("freeSlots", () => {
  it("returns availability slots that are not already booked", () => {
    const avail = [s("2026-07-10T04:30:00Z"), s("2026-07-10T06:30:00Z"), s("2026-07-10T09:30:00Z")];
    const booked = [s("2026-07-10T06:30:00Z")];
    const free = freeSlots(avail, booked);
    expect(free.map((d) => d.toISOString())).toEqual([
      "2026-07-10T04:30:00.000Z",
      "2026-07-10T09:30:00.000Z",
    ]);
  });
  it("drops slots already in the past relative to a reference time", () => {
    const now = s("2026-07-10T05:00:00Z");
    const avail = [s("2026-07-10T04:30:00Z"), s("2026-07-10T06:30:00Z")];
    const free = freeSlots(avail, [], now);
    expect(free.map((d) => d.toISOString())).toEqual(["2026-07-10T06:30:00.000Z"]);
  });
});
