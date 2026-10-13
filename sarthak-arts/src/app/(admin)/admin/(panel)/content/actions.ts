"use server";
import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { saveImage } from "@/lib/uploads";

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

/** Replace a site photo (content blocks whose key starts with "image."). */
export async function uploadContentImage(formData: FormData): Promise<void> {
  await requireAdmin();
  const key = String(formData.get("key"));
  const file = formData.get("file") as File | null;
  if (!key.startsWith("image.") || !file || file.size === 0) redirect("/admin/content");
  let url: string;
  try {
    url = (await saveImage(file, "site")).url;
  } catch {
    redirect("/admin/content?flash=image-error");
  }
  await prisma.contentBlock.update({ where: { key }, data: { body: url, updatedBy: "Owner" } });
  revalidatePath("/admin/content");
  revalidatePath("/", "layout");
  redirect("/admin/content?flash=image-saved");
}
