"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function saveGeneralSettings(formData: FormData): Promise<void> {
  const storeName = String(formData.get("storeName"));
  const announcementLines = String(formData.get("announcementLines"))
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  await prisma.setting.upsert({ where: { key: "store_name" }, update: { value: storeName }, create: { key: "store_name", value: storeName } });
  await prisma.setting.upsert({ where: { key: "announcement_lines" }, update: { value: announcementLines }, create: { key: "announcement_lines", value: announcementLines } });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?flash=saved");
}
