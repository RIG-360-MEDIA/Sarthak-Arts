import QRCode from "qrcode";

export type PaymentMode = "upi" | "razorpay";

/** UPI QR is the default; set PAYMENT_MODE=razorpay once live Razorpay keys are in place. */
export function paymentMode(): PaymentMode {
  return process.env.PAYMENT_MODE === "razorpay" ? "razorpay" : "upi";
}

export function upiPayee(): { vpa: string; name: string } {
  return { vpa: process.env.UPI_ID ?? "", name: process.env.UPI_PAYEE_NAME ?? "Sarthak Arts" };
}

/** Standard UPI deep link: any UPI app opens it with payee, amount and note pre-filled. */
export function upiLink(amountMinor: number, reference: string): string {
  const { vpa, name } = upiPayee();
  const params = new URLSearchParams({
    pa: vpa,
    pn: name,
    am: (amountMinor / 100).toFixed(2),
    cu: "INR",
    tn: `Sarthak Arts ${reference}`,
  });
  return `upi://pay?${params.toString()}`;
}

export function upiQrSvg(link: string): Promise<string> {
  return QRCode.toString(link, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#23150c", light: "#ffffff" } });
}

/** A UPI transaction reference (UTR) is 12 digits; some apps show longer alphanumeric IDs. */
export function normaliseUtr(raw: unknown): string | null {
  const v = String(raw ?? "").replace(/\s+/g, "").toUpperCase();
  return /^[A-Z0-9]{10,30}$/.test(v) ? v : null;
}

/** Short human-friendly reference shown to the customer and put in the UPI note. */
export function upiReference(intentId: string): string {
  return `SA${intentId.slice(-8).toUpperCase()}`;
}
