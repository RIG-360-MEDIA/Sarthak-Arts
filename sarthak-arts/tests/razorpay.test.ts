import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";

describe("verifyWebhookSignature", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ event: "payment.captured" });
  it("accepts a valid signature", () => {
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
  });
  it("rejects a tampered body", () => {
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body + "x", sig, secret)).toBe(false);
  });
});
