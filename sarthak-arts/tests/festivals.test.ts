import { describe, it, expect } from "vitest";
import { findFestivalDate, type FestivalRule } from "@/lib/panchang/festivals";
import { amantaToPurnimanta } from "@/lib/panchang/names";
import { lunarMonthAt } from "@/lib/panchang/masa";

const R: Record<string, FestivalRule> = {
  guru: { masa: "Āṣāḍha", tithi: "Pūrṇimā", paksha: "śukla" },
  janmashtami: { masa: "Bhādrapada", tithi: "Aṣṭamī", paksha: "kṛṣṇa" },
  ganesh: { masa: "Bhādrapada", tithi: "Caturthī", paksha: "śukla" },
  navratri: { masa: "Āśvina", tithi: "Pratipadā", paksha: "śukla" },
  diwali: { masa: "Kārtika", tithi: "Amāvāsyā", paksha: "kṛṣṇa", basis: "sunset" },
};

// Dates published in standard panchangs (Delhi).
const KNOWN: [keyof typeof R, string, string][] = [
  ["ganesh", "2024-08-15", "2024-09-07"],
  ["ganesh", "2025-08-01", "2025-08-27"],
  ["ganesh", "2026-08-01", "2026-09-14"],
  ["ganesh", "2026-09-26", "2027-09-04"],
  ["navratri", "2024-09-20", "2024-10-03"],
  ["navratri", "2025-09-10", "2025-09-22"],
  ["navratri", "2026-09-26", "2026-10-11"],
  ["diwali", "2024-10-15", "2024-10-31"],
  ["diwali", "2025-10-10", "2025-10-20"],
  ["diwali", "2026-10-25", "2026-11-08"],
  ["janmashtami", "2024-08-15", "2024-08-26"],
  ["janmashtami", "2025-08-10", "2025-08-16"],
  ["guru", "2025-06-20", "2025-07-10"],
  ["guru", "2026-07-01", "2026-07-29"],
];

describe("festival dates", () => {
  for (const [name, from, want] of KNOWN)
    it(`${name} after ${from} is ${want}`, () => {
      const d = findFestivalDate(R[name], new Date(`${from}T00:00:00Z`), "delhi");
      expect(d?.toISOString().slice(0, 10)).toBe(want);
    }, 60_000);
});

describe("lunar month naming", () => {
  it("names the month from the Sun's sign at the new moon (2026)", () => {
    // amānta indices: 4 Śrāvaṇa, 5 Bhādrapada, 6 Āśvina, 7 Kārtika
    expect(lunarMonthAt(new Date("2026-08-20T06:00:00Z")).amantaIdx).toBe(4);
    expect(lunarMonthAt(new Date("2026-09-14T06:00:00Z")).amantaIdx).toBe(5);
    expect(lunarMonthAt(new Date("2026-10-20T06:00:00Z")).amantaIdx).toBe(6);
    expect(lunarMonthAt(new Date("2026-11-20T06:00:00Z")).amantaIdx).toBe(7);
  });
  it("detects the 2026 adhika (leap) month and no other in the year", () => {
    expect(lunarMonthAt(new Date("2026-05-30T06:00:00Z")).adhika).toBe(true);
    expect(lunarMonthAt(new Date("2026-09-14T06:00:00Z")).adhika).toBe(false);
  });
});

describe("pūrṇimānta conversion", () => {
  it("keeps Śukla the same and moves Kṛṣṇa to the next month name", () => {
    expect(amantaToPurnimanta(5, "śukla")).toBe(5);
    expect(amantaToPurnimanta(5, "kṛṣṇa")).toBe(6);
    expect(amantaToPurnimanta(11, "kṛṣṇa")).toBe(0);
  });
});
