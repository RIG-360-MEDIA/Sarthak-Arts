"use server";
import { prisma } from "@/lib/db";

export async function subscribe(formData: FormData): Promise<void> {
  const email = String(formData.get("email")).trim().toLowerCase();
  if (email) await prisma.subscriber.upsert({ where: { email }, update: {}, create: { email } });
}
