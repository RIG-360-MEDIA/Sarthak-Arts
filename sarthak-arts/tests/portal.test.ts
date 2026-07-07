import { describe, it, expect } from "vitest";
import { partitionBookings } from "@/lib/portal";

const now = new Date("2026-07-10T12:00:00.000Z");
const mk = (id: number, iso: string, status = "booked") => ({ id, slotStart: new Date(iso), status });

describe("partitionBookings", () => {
  it("puts future booked slots in upcoming, sorted earliest first", () => {
    const { upcoming } = partitionBookings([mk(1, "2026-07-12T10:00:00Z"), mk(2, "2026-07-11T10:00:00Z")], now);
    expect(upcoming.map((b) => b.id)).toEqual([2, 1]);
  });

  it("treats past slots as past", () => {
    const { past, upcoming } = partitionBookings([mk(1, "2026-07-09T10:00:00Z")], now);
    expect(past.map((b) => b.id)).toEqual([1]);
    expect(upcoming).toHaveLength(0);
  });

  it("treats completed bookings as past even if the slot is in the future", () => {
    const { past, upcoming } = partitionBookings([mk(1, "2026-07-12T10:00:00Z", "completed")], now);
    expect(past.map((b) => b.id)).toEqual([1]);
    expect(upcoming).toHaveLength(0);
  });

  it("sorts past most-recent first", () => {
    const { past } = partitionBookings([mk(1, "2026-07-01T10:00:00Z"), mk(2, "2026-07-08T10:00:00Z")], now);
    expect(past.map((b) => b.id)).toEqual([2, 1]);
  });
});
