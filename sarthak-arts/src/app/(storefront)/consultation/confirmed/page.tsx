import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function Confirmed({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const booking = id
    ? await prisma.booking.findUnique({ where: { id: Number(id) }, include: { consultationType: true } })
    : null;
  if (!booking) notFound();
  return (
    <div style={{ paddingTop: 60, textAlign: "center" }}>
      <h1>Your consultation is booked</h1>
      <p style={{ color: "var(--ink-muted)" }}>
        {booking.consultationType.name} · {booking.slotStart.toUTCString()}
      </p>
      <p style={{ color: "var(--ink-muted)" }}>
        {booking.paymentStatus === "free"
          ? "Covered by your free-consultation credit."
          : `Fee: ${formatMoney(booking.feeMinorAtBooking, "INR")} — payment link to follow.`}
      </p>
      <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>A call link will be emailed before your slot.</p>
    </div>
  );
}
