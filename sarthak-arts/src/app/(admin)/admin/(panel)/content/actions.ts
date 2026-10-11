"use server";
import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function saveBlock(formData: FormData): Promise<void> {
  await requireAdmin();
  const key = String(formData.get("key"));
  await prisma.contentBlock.update({
    where: { key },
    data: { title: (formData.get("title") as string) || null, body: String(formData.get("body")), updatedBy: "Owner" },
  });
  revalidatePath("/admin/content");
  revalidatePath("/", "layout");
  redirect("/admin/content?flash=content-saved");
}
