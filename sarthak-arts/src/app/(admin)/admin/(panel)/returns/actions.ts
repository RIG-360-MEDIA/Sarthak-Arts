"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function resolveReturn(formData: FormData): Promise<void> {
  const status = String(formData.get("status")); // approved | rejected | refunded
  await prisma.returnRequest.update({
    where: { id: Number(formData.get("returnId")) },
    data: { status, adminNote: (formData.get("adminNote") as string) || null, resolvedAt: new Date() },
  });
  revalidatePath("/admin/returns");
}
