/**
 * Server-side validation for customer-supplied checkout data. The browser has
 * `required` / `type=email` for UX, but those can be bypassed — this is the
 * authoritative gate before anything reaches the database or the payment
 * gateway. Keep it strict but not hostile to legitimate international input.
 */
export type CheckoutInput = {
  name: string; email: string; phone: string;
  line1: string; city: string; state: string; postalCode: string; country: string;
};

export type ValidationResult = { ok: true; value: CheckoutInput } | { ok: false; errors: Record<string, string> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCheckout(raw: Partial<Record<keyof CheckoutInput, unknown>>): ValidationResult {
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const value: CheckoutInput = {
    name: s(raw.name), email: s(raw.email), phone: s(raw.phone), line1: s(raw.line1),
    city: s(raw.city), state: s(raw.state), postalCode: s(raw.postalCode), country: s(raw.country) || "IN",
  };
  const errors: Record<string, string> = {};

  if (value.name.length < 2 || value.name.length > 120) errors.name = "Enter your full name.";
  if (!EMAIL_RE.test(value.email) || value.email.length > 200) errors.email = "Enter a valid email address.";
  const phoneDigits = value.phone.replace(/\D/g, "");
  if (phoneDigits.length < 7 || phoneDigits.length > 15) errors.phone = "Enter a valid phone number.";
  if (value.line1.length < 4 || value.line1.length > 240) errors.line1 = "Enter your street address.";
  if (!value.city) errors.city = "Enter your city.";
  if (!value.state) errors.state = "Enter your state.";
  if (value.country === "IN") {
    if (!/^\d{6}$/.test(value.postalCode)) errors.postalCode = "Enter a 6-digit PIN code.";
  } else if (value.postalCode.length < 3 || value.postalCode.length > 12) {
    errors.postalCode = "Enter a valid postal code.";
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}
