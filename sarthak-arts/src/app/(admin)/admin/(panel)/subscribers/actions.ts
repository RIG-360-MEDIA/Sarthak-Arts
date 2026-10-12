"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";

export async function removeSubscriber(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const { count } = await prisma.subscriber.deleteMany({ where: { id } });
  revalidatePath("/admin/subscribers");
  redirect(`/admin/subscribers?removed=${count}`);
}
