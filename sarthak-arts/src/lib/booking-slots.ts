import { prisma } from "@/lib/db";
import { expandWeekly, freeSlots } from "@/lib/booking";

export type OpenSlot = { consultantId: number; slotStart: Date };

/** Every bookable slot for a consultation type: one-off slots + weekly defaults, minus days off and bookings. */
export async function openSlots(consultationTypeId: number, now = new Date()): Promise<OpenSlot[]> {
  const consultants = await prisma.consultant.findMany({
    where: { active: true, types: { some: { consultationTypeId } } },
    include: {
      availability: true, weeklyHours: true, daysOff: true,
      bookings: { where: { status: { not: "cancelled" } }, select: { slotStart: true } },
    },
  });
  const seen = new Set<number>();
  const out: OpenSlot[] = [];
  for (const c of consultants) {
    const avail = [...c.availability.map((a) => a.slotStart), ...expandWeekly(c.weeklyHours, c.daysOff.map((d) => d.date), now)];
    for (const slotStart of freeSlots(avail, c.bookings.map((b) => b.slotStart), now)) {
      if (seen.has(slotStart.getTime())) continue;
      seen.add(slotStart.getTime());
      out.push({ consultantId: c.id, slotStart });
    }
  }
  return out.sort((a, b) => a.slotStart.getTime() - b.slotStart.getTime());
}
