"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function pinPost(formData: FormData): Promise<void> {
  await prisma.socialPost.create({
    data: {
      platform: String(formData.get("platform")),
      caption: String(formData.get("caption")),
      mediaUrl: String(formData.get("mediaUrl") || "/placeholder/copper-vastu-kalash.svg"),
      permalink: String(formData.get("permalink") || "#"),
    },
  });
  revalidatePath("/admin/social");
  revalidatePath("/", "layout");
}

export async function unpinPost(formData: FormData): Promise<void> {
  await prisma.socialPost.delete({ where: { id: Number(formData.get("postId")) } });
  revalidatePath("/admin/social");
  revalidatePath("/", "layout");
}
