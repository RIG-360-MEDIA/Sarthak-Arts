export function freeSlots(availability: Date[], booked: Date[], now?: Date): Date[] {
  const bookedTimes = new Set(booked.map((d) => d.getTime()));
  const floor = now ? now.getTime() : -Infinity;
  return availability
    .filter((d) => !bookedTimes.has(d.getTime()) && d.getTime() > floor)
    .sort((a, b) => a.getTime() - b.getTime());
}
