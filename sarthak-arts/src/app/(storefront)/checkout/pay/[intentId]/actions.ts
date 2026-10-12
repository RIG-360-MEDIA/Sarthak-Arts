"use server";
import { redirect } from "next/navigation";
import { submitUpiPayment } from "@/lib/orders";
import { normaliseUtr } from "@/lib/payments/upi";

export async function submitUpi(formData: FormData): Promise<void> {
  const intentId = String(formData.get("intentId"));
  const utr = normaliseUtr(formData.get("utr"));
  if (!utr) redirect(`/checkout/pay/${intentId}?error=utr`);

  const result = await submitUpiPayment(intentId, utr);
  if (!result.ok) redirect(result.reason === "duplicate_utr" ? `/checkout/pay/${intentId}?error=dup` : "/cart");
  redirect(`/checkout/success?intent=${intentId}`);
}
