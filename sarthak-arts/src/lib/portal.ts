export type PartitionableBooking = { slotStart: Date; status: string };

/**
 * Split a consultant's bookings into upcoming vs past.
 * Past = the slot is in the past OR the session is already completed.
 * Upcoming is sorted earliest-first (next up); past is most-recent-first.
 */
export function partitionBookings<T extends PartitionableBooking>(
  bookings: T[],
  now: Date,
): { upcoming: T[]; past: T[] } {
  const upcoming: T[] = [];
  const past: T[] = [];
  for (const b of bookings) {
    if (b.status === "completed" || b.slotStart.getTime() < now.getTime()) past.push(b);
    else upcoming.push(b);
  }
  upcoming.sort((a, b) => a.slotStart.getTime() - b.slotStart.getTime());
  past.sort((a, b) => b.slotStart.getTime() - a.slotStart.getTime());
  return { upcoming, past };
}
