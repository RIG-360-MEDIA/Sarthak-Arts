import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { formatMoney } from "@/lib/money";
import { getSetting } from "@/lib/settings";

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
    from: "orders@sarthakarts.com",
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
    from: "bookings@sarthakarts.com",
    to: booking.customerEmail,
    subject: `Your ${booking.consultationType.name} consultation is booked`,
    html: `<p>Your ${booking.consultationType.name} is booked for ${booking.slotStart.toUTCString()}. A call link will follow.</p>`,
  });
}
