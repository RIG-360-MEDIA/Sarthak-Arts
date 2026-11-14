"use server";
import { requireAdmin } from "@/lib/require-admin";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createCategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const code = slugify(name);
  if (!code) redirect("/admin/categories?flash=invalid");
  await prisma.category.upsert({ where: { code }, update: { name }, create: { code, name } });
  redirect("/admin/categories?flash=saved");
}

export async function renameCategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  if (!name) redirect("/admin/categories?flash=invalid");
  await prisma.category.update({ where: { id }, data: { name } });
  redirect("/admin/categories?flash=saved");
}

/** Only an empty category can go — products keep their category until the owner moves them. */
export async function deleteCategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const inUse = await prisma.product.count({ where: { categoryId: id } });
  const children = await prisma.category.count({ where: { parentId: id } });
  if (inUse || children) redirect("/admin/categories?flash=inuse");
  await prisma.category.delete({ where: { id } });
  redirect("/admin/categories?flash=deleted");
}
