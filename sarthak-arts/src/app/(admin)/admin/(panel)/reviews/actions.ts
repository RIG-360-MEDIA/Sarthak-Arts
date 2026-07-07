"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function setReviewStatus(formData: FormData): Promise<void> {
  await prisma.review.update({
    where: { id: Number(formData.get("reviewId")) },
    data: { status: String(formData.get("status")) },
  });
  revalidatePath("/admin/reviews");
}

export async function replyToReview(formData: FormData): Promise<void> {
  await prisma.review.update({
    where: { id: Number(formData.get("reviewId")) },
    data: { sellerReply: String(formData.get("reply")) },
  });
  revalidatePath("/admin/reviews");
}
