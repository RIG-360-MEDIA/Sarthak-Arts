"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ensureAuthUser } from "@/lib/supabase/admin";

/**
 * Set or reset a consultant's portal login. Creates/links a User with the
 * "consultant" role and (re)sets the Supabase Auth password, then links it to the consultant.
 */
export async function setConsultantAccess(formData: FormData): Promise<void> {
  const consultantId = Number(formData.get("consultantId"));
  const email = String(formData.get("email")).trim().toLowerCase();
  const password = String(formData.get("password"));
  if (!email || !password) return;

  const role = await prisma.role.upsert({ where: { code: "consultant" }, update: {}, create: { code: "consultant", name: "Consultant" } });
  const authId = await ensureAuthUser(email, password, "consultant", "Consultant");
  const user = await prisma.user.upsert({
    where: { email },
    update: { authId },
    create: { email, authId, name: "Consultant", isGuest: false },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {}, create: { userId: user.id, roleId: role.id },
  });
  await prisma.consultant.update({ where: { id: consultantId }, data: { userId: user.id } });
  revalidatePath("/admin/consultations");
}

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
