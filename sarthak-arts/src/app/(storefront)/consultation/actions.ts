"use server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { openSlots } from "@/lib/booking-slots";

export async function createBooking(formData: FormData): Promise<void> {
  const consultationTypeId = Number(formData.get("consultationTypeId"));
  const slotIso = String(formData.get("slot"));
  const email = String(formData.get("email"));
  const birthDate = String(formData.get("birthDate") ?? "").trim();
  const birthTime = String(formData.get("birthTime") ?? "").trim();
  const birthPlace = String(formData.get("birthPlace") ?? "").trim().slice(0, 120);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !birthPlace) redirect("/consultation?error=birth");
  const type = await prisma.consultationType.findUniqueOrThrow({ where: { id: consultationTypeId } });

  const slot = (await openSlots(consultationTypeId)).find((s) => s.slotStart.getTime() === new Date(slotIso).getTime());
  if (!slot) redirect(`/consultation?type=${type.code}&error=slot#book`);

  const entitlement = await prisma.consultationEntitlement.findFirst({
    where: { customerEmail: email, consultationTypeId, status: "unused" },
  });

  const booking = await prisma.booking.create({
    data: {
      consultantId: slot.consultantId,
      consultationTypeId,
      customerName: String(formData.get("name")),
      customerEmail: email,
      customerPhone: String(formData.get("phone")),
      birthDate,
      birthTime: /^\d{2}:\d{2}$/.test(birthTime) ? birthTime : null,
      birthPlace,
      slotStart: new Date(slotIso),
      feeMinorAtBooking: entitlement ? 0 : type.feeMinor,
      paymentStatus: entitlement ? "free" : "pending",
      entitlementId: entitlement?.id,
    },
  });
  if (entitlement) await prisma.consultationEntitlement.update({ where: { id: entitlement.id }, data: { status: "used" } });

  const { sendBookingConfirmation } = await import("@/lib/email");
  await sendBookingConfirmation(booking.id).catch((err) => console.error("[booking] confirmation email failed:", err instanceof Error ? err.message : err));

  redirect(`/consultation/confirmed?id=${booking.id}`);
}
