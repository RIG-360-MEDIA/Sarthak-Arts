// Pure slot arithmetic (no DB) — all calendar math is in IST, which has no DST, so a fixed offset is exact.
const IST = "Asia/Kolkata";
const WEEKS_AHEAD = 8;
export const SLOT_MINUTES = 30;

/** "2026-11-14" + "10:00" (IST) → the instant. */
export function istDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+05:30`);
}

/** The IST calendar day of an instant, as "YYYY-MM-DD". */
export function istDayKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: IST });
}

/** 0 = Sunday … 6 = Saturday for an IST day key. */
export function istWeekday(dayKey: string): number {
  return istDate(dayKey, "12:00").getUTCDay();
}

export function freeSlots(availability: Date[], booked: Date[], now?: Date): Date[] {
  const bookedTimes = new Set(booked.map((d) => d.getTime()));
  const floor = now ? now.getTime() : -Infinity;
  return availability
    .filter((d) => !bookedTimes.has(d.getTime()) && d.getTime() > floor)
    .sort((a, b) => a.getTime() - b.getTime());
}

/** Expand weekly default hours into concrete slots for the next `weeks`, skipping days off. */
export function expandWeekly(
  hours: { weekday: number; time: string }[],
  daysOff: string[],
  from: Date,
  weeks = WEEKS_AHEAD,
): Date[] {
  if (hours.length === 0) return [];
  const off = new Set(daysOff);
  const out: Date[] = [];
  let day = istDate(istDayKey(from), "12:00");
  for (let i = 0; i < weeks * 7; i++, day = new Date(day.getTime() + 86_400_000)) {
    const key = istDayKey(day);
    if (off.has(key)) continue;
    const wd = istWeekday(key);
    for (const h of hours) if (h.weekday === wd) out.push(istDate(key, h.time));
  }
  return out;
}

/** The days (IST keys) with slots, nearest to `wanted` first — the "try these dates instead" list. */
export function nearestDays(slots: Date[], wanted: string, n = 3): string[] {
  const target = istDate(wanted, "12:00").getTime();
  const days = [...new Set(slots.map(istDayKey))].filter((k) => k !== wanted);
  return days
    .sort((a, b) => Math.abs(istDate(a, "12:00").getTime() - target) - Math.abs(istDate(b, "12:00").getTime() - target))
    .slice(0, n);
}
