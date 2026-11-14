import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { formatMoney } from "@/lib/money";
import { getSetting } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";

// Resend's shared sender works without DNS setup but only delivers to the Resend account's own address;
// set EMAIL_FROM to an address on a verified domain (e.g. orders@sarthakarts.in) for customer mail.
const FROM = process.env.EMAIL_FROM || "Sarthak Arts <onboarding@resend.dev>";
const OWNER_EMAIL = process.env.OWNER_ORDER_EMAIL || "sarthakart.in@gmail.com";

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

export async function sendOrderConfirmation(orderId: number): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, certificates: true },
  });
  const storeName = await getSetting<string>("store_name", "Store");
  const itemsHtml = order.items
    .map((i) => `<tr><td>${i.name} × ${i.quantity}</td><td align="right">${formatMoney(i.unitPriceMinor * i.quantity, order.currency)}</td></tr>`)
    .join("");
  const html = `
    <div style="font-family:Georgia,serif;color:#2B211A;max-width:520px">
      <p style="letter-spacing:2px;font-size:11px;color:#B8863E">${storeName.toUpperCase()}</p>
      <h2>Thank you — order ${order.orderNumber} is confirmed.</h2>
      <table width="100%" style="font-size:14px">${itemsHtml}
        <tr><td><strong>Total</strong></td><td align="right"><strong>${formatMoney(order.totalMinor, order.currency)}</strong></td></tr>
      </table>
      <p style="font-size:13px;color:#5A4E42">Your certificate of composition is attached. A placement card ships in the box.</p>
    </div>`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[email disabled] would send order confirmation for ${order.orderNumber} to ${order.email}`);
    return;
  }
  const attachments = await Promise.all(
    order.certificates.map(async (c) => ({
      filename: c.storageKey.split("/").pop() ?? "certificate.pdf",
      content: (await storage.get(c.storageKey)).toString("base64"),
    })),
  );
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM,
    to: order.email,
    subject: `Order ${order.orderNumber} confirmed — ${storeName}`,
    html,
    attachments,
  });
}

export async function sendBookingConfirmation(bookingId: number): Promise<void> {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { consultationType: true },
  });
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email disabled] would send booking confirmation ${bookingId} to ${booking.customerEmail}`);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM,
    to: booking.customerEmail,
    subject: `Your ${booking.consultationType.name} consultation is booked`,
    html: `<p>Your ${booking.consultationType.name} is booked for ${booking.slotStart.toUTCString()}. A call link will follow.</p>`,
  });
}

/** Tell the owner about every new order — pending UPI ones too, so nothing waits unnoticed. */
export async function sendOwnerOrderAlert(orderId: number): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true, payments: true, status: true } });
  const addr = order.shippingAddress as { name: string; line1: string; city: string; state: string; postalCode: string; country: string };
  const upi = order.payments.find((p) => p.gateway === "upi");
  const link = `${SITE_URL}/order/${order.orderNumber}?email=${encodeURIComponent(order.email)}`;
  const itemsHtml = order.items
    .map((i) => `<tr><td>${esc(i.name)} × ${i.quantity}</td><td align="right">${formatMoney(i.unitPriceMinor * i.quantity, order.currency)}</td></tr>`)
    .join("");
  const html = `
    <div style="font-family:Georgia,serif;color:#2B211A;max-width:560px">
      <p style="letter-spacing:2px;font-size:11px;color:#B8863E">NEW ORDER</p>
      <h2>${esc(order.orderNumber)} — ${esc(order.status.name)}</h2>
      <p><b>${esc(addr.name)}</b><br>${esc(order.email)}${order.phone ? `<br>${esc(order.phone)}` : ""}</p>
      <p>${esc(addr.line1)}<br>${esc(addr.city)}, ${esc(addr.state)} ${esc(addr.postalCode)}<br>${esc(addr.country)}</p>
      <table width="100%" style="font-size:14px;border-top:1px solid #ddd">${itemsHtml}
        <tr><td>Shipping</td><td align="right">${formatMoney(order.shippingMinor, order.currency)}</td></tr>
        <tr><td><strong>Total</strong></td><td align="right"><strong>${formatMoney(order.totalMinor, order.currency)}</strong></td></tr>
      </table>
      ${upi ? `<p>UPI transaction ID (UTR): <b>${esc(upi.gatewayPaymentId ?? "")}</b> — ${upi.status === "captured" ? "received" : "please check your UPI app, then confirm the order in the admin panel"}.</p>` : ""}
      ${order.isGift ? `<p><b>Gift order</b>${order.giftNote ? ` — “${esc(order.giftNote)}”` : ""}</p>` : ""}
      <p><a href="${link}">View this order</a> (no login needed) · <a href="${SITE_URL}/admin/orders/${order.id}">Open in admin</a></p>
    </div>`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[email disabled] would alert ${OWNER_EMAIL} about order ${order.orderNumber}`);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({ from: FROM, to: OWNER_EMAIL, subject: `New order ${order.orderNumber} — ${formatMoney(order.totalMinor, order.currency)}`, html });
}
