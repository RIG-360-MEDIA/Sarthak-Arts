"use server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function createBooking(formData: FormData): Promise<void> {
  const consultationTypeId = Number(formData.get("consultationTypeId"));
  const slotIso = String(formData.get("slot"));
  const email = String(formData.get("email"));
  const type = await prisma.consultationType.findUniqueOrThrow({ where: { id: consultationTypeId } });

  const slot = await prisma.consultantAvailability.findFirstOrThrow({
    where: {
      slotStart: new Date(slotIso),
      consultant: { types: { some: { consultationTypeId } }, active: true },
    },
  });

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
      slotStart: new Date(slotIso),
      feeMinorAtBooking: entitlement ? 0 : type.feeMinor,
      paymentStatus: entitlement ? "free" : "pending",
      entitlementId: entitlement?.id,
    },
  });
  if (entitlement) await prisma.consultationEntitlement.update({ where: { id: entitlement.id }, data: { status: "used" } });

  redirect(`/consultation/confirmed?id=${booking.id}`);
}
