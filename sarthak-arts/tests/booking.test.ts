import { describe, it, expect } from "vitest";
import { freeSlots, expandWeekly, istDate, istDayKey, istWeekday, nearestDays } from "@/lib/booking";

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

describe("IST helpers", () => {
  it("builds an instant from an IST date and time", () => {
    expect(istDate("2026-11-14", "10:00").toISOString()).toBe("2026-11-14T04:30:00.000Z");
  });
  it("keys a late-night IST slot to the IST day, not the UTC day", () => {
    expect(istDayKey(s("2026-11-13T19:30:00Z"))).toBe("2026-11-14"); // 1:00 am IST
  });
  it("knows 2026-11-14 is a Saturday", () => {
    expect(istWeekday("2026-11-14")).toBe(6);
  });
});

describe("expandWeekly", () => {
  const from = s("2026-11-12T08:00:00Z"); // Thu 12 Nov, 13:30 IST
  it("repeats weekly hours across the window and skips days off", () => {
    const out = expandWeekly([{ weekday: 6, time: "10:00" }, { weekday: 1, time: "18:30" }], ["2026-11-21"], from, 2);
    expect(out.map((d) => d.toISOString())).toEqual([
      "2026-11-14T04:30:00.000Z", // Sat 14
      "2026-11-16T13:00:00.000Z", // Mon 16
      // Sat 21 is a day off
      "2026-11-23T13:00:00.000Z", // Mon 23
    ]);
  });
  it("includes today's later times (freeSlots drops the ones already past)", () => {
    const out = expandWeekly([{ weekday: 4, time: "17:00" }], [], from, 1);
    expect(out[0].toISOString()).toBe("2026-11-12T11:30:00.000Z");
  });
  it("is empty with no weekly hours", () => {
    expect(expandWeekly([], [], from)).toEqual([]);
  });
});

describe("nearestDays", () => {
  it("lists the closest other days that have slots", () => {
    const slots = ["2026-11-10", "2026-11-13", "2026-11-13", "2026-11-18", "2026-11-30"].map((d) => istDate(d, "10:00"));
    expect(nearestDays(slots, "2026-11-14")).toEqual(["2026-11-13", "2026-11-10", "2026-11-18"]);
  });
});
