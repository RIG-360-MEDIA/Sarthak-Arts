"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { currentSession } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

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
  const slotStart = new Date(String(formData.get("slotStart")));
  await prisma.consultantAvailability.create({ data: { consultantId: consultant.id, slotStart, durationMin: 20 } });
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
