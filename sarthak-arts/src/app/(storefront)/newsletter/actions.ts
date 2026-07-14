"use server";
import { prisma } from "@/lib/db";

export type SubscribeResult =
  | { ok: true; already: boolean }
  | { ok: false; error: "invalid" | "server" };

// Pragmatic HTML5 email pattern — real bounce handling happens at the ESP layer.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function saveSubscriber(email: string): Promise<SubscribeResult> {
  const clean = email.trim().toLowerCase();
  if (!clean || !EMAIL_RE.test(clean)) return { ok: false, error: "invalid" };
  try {
    const existing = await prisma.subscriber.findUnique({ where: { email: clean } });
    if (existing) return { ok: true, already: true };
    await prisma.subscriber.create({ data: { email: clean } });
    return { ok: true, already: false };
  } catch {
    return { ok: false, error: "server" };
  }
}

// One-arg signature — used by the old storefront layout's <form action={subscribe}>.
export async function subscribe(formData: FormData): Promise<void> {
  await saveSubscriber(String(formData.get("email") ?? ""));
}

// useActionState-compatible signature — used by the sanctum homepage's client wrapper.
export async function subscribeAction(
  _prev: SubscribeResult | null,
  formData: FormData,
): Promise<SubscribeResult> {
  return saveSubscriber(String(formData.get("email") ?? ""));
}
