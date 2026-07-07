"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function addSlot(formData: FormData): Promise<void> {
  const consultantId = Number(formData.get("consultantId"));
  const slotStart = new Date(String(formData.get("slotStart")));
  await prisma.consultantAvailability.create({ data: { consultantId, slotStart, durationMin: 20 } });
  revalidatePath("/admin/consultations");
}

export async function removeSlot(formData: FormData): Promise<void> {
  await prisma.consultantAvailability.delete({ where: { id: Number(formData.get("slotId")) } });
  revalidatePath("/admin/consultations");
}

export async function markComplete(formData: FormData): Promise<void> {
  await prisma.booking.update({ where: { id: Number(formData.get("bookingId")) }, data: { status: "completed" } });
  revalidatePath("/admin/consultations");
}
