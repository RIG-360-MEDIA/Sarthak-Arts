"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { currentSession } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";
import { istDate } from "@/lib/booking";

/** Resolve the consultant record for the signed-in user, or throw. */
async function requireConsultant() {
  const session = await currentSession();
  if (!session || session.role !== "consultant") redirect("/portal/login");
  const consultant = await prisma.consultant.findFirst({ where: { userId: session.userId } });
  if (!consultant) redirect("/portal/login");
  return consultant;
}

export async function addSlot(formData: FormData): Promise<void> {
  const consultant = await requireConsultant();
  // datetime-local has no zone; the consultant means IST, not the server's UTC.
  const [date, time] = String(formData.get("slotStart")).split("T");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || !/^\d{2}:\d{2}$/.test(time ?? "")) return;
  await prisma.consultantAvailability.create({ data: { consultantId: consultant.id, slotStart: istDate(date, time), durationMin: 30 } });
  revalidatePath("/portal/availability");
}

export async function addWeeklyHour(formData: FormData): Promise<void> {
  const consultant = await requireConsultant();
  const time = String(formData.get("time") ?? "");
  if (!/^\d{2}:\d{2}$/.test(time)) return;
  // "Default" = every day of the week at this time
  await Promise.all(
    [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
      prisma.consultantWeeklyHour.upsert({
        where: { consultantId_weekday_time: { consultantId: consultant.id, weekday, time } },
        update: {}, create: { consultantId: consultant.id, weekday, time },
      }),
    ),
  );
  revalidatePath("/portal/availability");
}

export async function removeWeeklyHour(formData: FormData): Promise<void> {
  const consultant = await requireConsultant();
  const time = String(formData.get("time") ?? "");
  // Remove all 7 weekday entries for this default time
  await prisma.consultantWeeklyHour.deleteMany({ where: { consultantId: consultant.id, time } });
  revalidatePath("/portal/availability");
}

export async function addDayOff(formData: FormData): Promise<void> {
  const consultant = await requireConsultant();
  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  await prisma.consultantDayOff.upsert({
    where: { consultantId_date: { consultantId: consultant.id, date } },
    update: {}, create: { consultantId: consultant.id, date },
  });
  revalidatePath("/portal/availability");
}

export async function removeDayOff(formData: FormData): Promise<void> {
  const consultant = await requireConsultant();
  await prisma.consultantDayOff.deleteMany({ where: { id: Number(formData.get("id")), consultantId: consultant.id } });
  revalidatePath("/portal/availability");
}

export async function removeSlot(formData: FormData): Promise<void> {
  const consultant = await requireConsultant();
  const slotId = Number(formData.get("slotId"));
  // Ownership check: only delete a slot that belongs to this consultant.
  await prisma.consultantAvailability.deleteMany({ where: { id: slotId, consultantId: consultant.id } });
  revalidatePath("/portal/availability");
}

export async function markDone(formData: FormData): Promise<void> {
  const consultant = await requireConsultant();
  const bookingId = Number(formData.get("bookingId"));
  await prisma.booking.updateMany({ where: { id: bookingId, consultantId: consultant.id }, data: { status: "completed" } });
  revalidatePath("/portal");
}

export async function setVideoLink(formData: FormData): Promise<void> {
  const consultant = await requireConsultant();
  const bookingId = Number(formData.get("bookingId"));
  const videoLink = (formData.get("videoLink") as string)?.trim() || null;
  await prisma.booking.updateMany({ where: { id: bookingId, consultantId: consultant.id }, data: { videoLink } });
  revalidatePath("/portal");
}

export async function logout(): Promise<void> {
  await (await supabaseServer()).auth.signOut();
  redirect("/portal/login");
}
